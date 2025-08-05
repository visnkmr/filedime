use std::io::{Read, Write};
use std::net::TcpStream;
use std::path::Path;

use include_dir::Dir;
use percent_encoding::percent_decode_str;
use serde::Serialize;

use crate::markdown::loadmarkdown;

#[derive(Debug)]
struct Request {
    method: String,
    path: String,
    http_version: String,
    headers: Vec<(String, String)>,
    body: Vec<u8>,
}

fn parse_request(mut stream: &mut TcpStream) -> std::io::Result<Request> {
    // Read headers first
    let mut headers_buf = vec![0u8; 8192];
    let mut read_total = 0usize;
    loop {
        let n = stream.read(&mut headers_buf[read_total..])?;
        if n == 0 {
            break;
        }
        read_total += n;
        if read_total >= 4 {
            if let Some(pos) = find_headers_end(&headers_buf[..read_total]) {
                // Split head and body start
                let head = &headers_buf[..pos];
                let mut lines = head.split(|&b| b == b'\n').map(|l| {
                    let mut v = l.to_vec();
                    if v.ends_with(&[b'\r']) {
                        v.pop();
                    }
                    v
                });

                let request_line = lines
                    .next()
                    .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidData, "Bad request line"))?;
                let request_line_str = String::from_utf8_lossy(&request_line);
                let mut parts = request_line_str.split_whitespace();
                let method = parts.next().unwrap_or("").to_string();
                let path = parts.next().unwrap_or("/").to_string();
                let http_version = parts.next().unwrap_or("HTTP/1.1").to_string();

                let mut headers = Vec::new();
                for l in lines {
                    if l.is_empty() {
                        break;
                    }
                    if let Some(idx) = l.iter().position(|&b| b == b':') {
                        let (name, rest) = l.split_at(idx);
                        let value = rest[1..].to_vec(); // skip ':'
                        let name = String::from_utf8_lossy(name).trim().to_string();
                        let value = String::from_utf8_lossy(&value).trim().to_string();
                        headers.push((name, value));
                    }
                }

                let body_start = &headers_buf[pos..read_total];
                // Determine content-length
                let mut content_length = 0usize;
                for (k, v) in &headers {
                    if k.eq_ignore_ascii_case("content-length") {
                        if let Ok(n) = v.parse() {
                            content_length = n;
                        }
                    }
                }

                let mut body = Vec::with_capacity(content_length);
                body.extend_from_slice(body_start);
                while body.len() < content_length {
                    let mut chunk = vec![0u8; content_length - body.len()];
                    let n = stream.read(&mut chunk)?;
                    if n == 0 {
                        break;
                    }
                    body.extend_from_slice(&chunk[..n]);
                }

                return Ok(Request {
                    method,
                    path,
                    http_version,
                    headers,
                    body,
                });
            }
        }

        if read_total == headers_buf.len() {
            // grow
            headers_buf.resize(headers_buf.len() * 2, 0);
        }
    }

    Err(std::io::Error::new(std::io::ErrorKind::UnexpectedEof, "Connection closed"))
}

fn find_headers_end(buf: &[u8]) -> Option<usize> {
    // look for \r\n\r\n
    buf.windows(4)
        .position(|w| w == b"\r\n\r\n")
        .map(|pos| pos + 4)
}

fn status_line(code: u16) -> &'static str {
    match code {
        200 => "HTTP/1.1 200 OK",
        201 => "HTTP/1.1 201 Created",
        400 => "HTTP/1.1 400 Bad Request",
        404 => "HTTP/1.1 404 Not Found",
        405 => "HTTP/1.1 405 Method Not Allowed",
        500 => "HTTP/1.1 500 Internal Server Error",
        _ => "HTTP/1.1 500 Internal Server Error",
    }
}

fn cors_headers() -> String {
    "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n".to_string()
}

fn send_empty_response(stream: &mut TcpStream, code: u16) -> std::io::Result<()> {
    let resp = format!(
        "{}\r\n{}Content-Length: 0\r\n\r\n",
        status_line(code),
        cors_headers()
    );
    stream.write_all(resp.as_bytes())
}

fn send_json<T: Serialize>(stream: &mut TcpStream, code: u16, payload: &T) -> std::io::Result<()> {
    let body = serde_json::to_vec(payload).unwrap_or_else(|_| b"{}".to_vec());
    let resp = format!(
        "{}\r\n{}Content-Type: application/json\r\nContent-Length: {}\r\n\r\n",
        status_line(code),
        cors_headers(),
        body.len()
    );
    stream.write_all(resp.as_bytes())?;
    stream.write_all(&body)
}

fn not_found(stream: &mut TcpStream) -> std::io::Result<()> {
    send_json(stream, 404, &serde_json::json!({ "error": "Not Found" }))
}

fn bad_request(stream: &mut TcpStream, msg: &str) -> std::io::Result<()> {
    send_json(stream, 400, &serde_json::json!({ "error": msg }))
}

fn ok_text(stream: &mut TcpStream, text: &str) -> std::io::Result<()> {
    let body = text.as_bytes();
    let resp = format!(
        "{}\r\n{}Content-Type: text/plain; charset=utf-8\r\nContent-Length: {}\r\n\r\n",
        status_line(200),
        cors_headers(),
        body.len()
    );
    stream.write_all(resp.as_bytes())?;
    stream.write_all(body)
}

fn ok_html(stream: &mut TcpStream, html: &[u8]) -> std::io::Result<()> {
    let resp = format!(
        "{}\r\n{}Content-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n",
        status_line(200),
        cors_headers(),
        html.len()
    );
    stream.write_all(resp.as_bytes())?;
    stream.write_all(html)
}

fn ok_static(stream: &mut TcpStream, bytes: &[u8], content_type: &str) -> std::io::Result<()> {
    let resp = format!(
        "{}\r\n{}Content-Type: {}\r\nContent-Length: {}\r\n\r\n",
        status_line(200),
        cors_headers(),
        content_type,
        bytes.len()
    );
    stream.write_all(resp.as_bytes())?;
    stream.write_all(bytes)
}

fn content_type_for(path: &str) -> &'static str {
    if path.ends_with(".html") {
        "text/html; charset=utf-8"
    } else if path.ends_with(".js") {
        "application/javascript"
    } else if path.ends_with(".css") {
        "text/css"
    } else if path.ends_with(".json") {
        "application/json"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".jpg") || path.ends_with(".jpeg") {
        "image/jpeg"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".woff2") {
        "font/woff2"
    } else {
        "application/octet-stream"
    }
}

fn decode_component(s: &str) -> String {
    percent_decode_str(s).decode_utf8_lossy().to_string()
}

fn query_param(path_with_query: &str, key: &str) -> Option<String> {
    let mut parts = path_with_query.splitn(2, '?');
    let _path_only = parts.next().unwrap_or("");
    let query = parts.next().unwrap_or("");
    for pair in query.split('&') {
        if pair.is_empty() {
            continue;
        }
        let mut kv = pair.splitn(2, '=');
        let k = kv.next().unwrap_or("");
        let v = kv.next().unwrap_or("");
        if k == key {
            return Some(decode_component(v));
        }
    }
    None
}

pub fn route_connection(mut stream: TcpStream, project_dir: &Dir) -> anyhow::Result<()> {
    let req = match parse_request(&mut stream) {
        Ok(r) => r,
        Err(_) => {
            let _ = send_empty_response(&mut stream, 400);
            return Ok(());
        }
    };

    // Handle CORS preflight
    if req.method.eq_ignore_ascii_case("OPTIONS") {
        let _ = send_empty_response(&mut stream, 200);
        return Ok(());
    }

    // Normalize path
    let full_path = req.path.clone();
    let mut path_only = full_path.splitn(2, '?').next().unwrap_or("/").to_string();

    // API routes first
    if path_only == "/api/ping" {
        if !req.method.eq_ignore_ascii_case("GET") {
            let _ = send_empty_response(&mut stream, 405);
            return Ok(());
        }
        let _ = send_json(&mut stream, 200, &serde_json::json!({ "ok": true, "ts": chrono::Utc::now().timestamp_millis() }));
        return Ok(());
    }

    if path_only == "/api/markdown" {
        if !req.method.eq_ignore_ascii_case("GET") {
            let _ = send_empty_response(&mut stream, 405);
            return Ok(());
        }
        let path_param = match query_param(&full_path, "path") {
            Some(p) => p,
            None => {
                let _ = bad_request(&mut stream, "Missing 'path' query parameter");
                return Ok(());
            }
        };
        // Security: allow only existing files on disk
        if !Path::new(&path_param).exists() {
            let _ = bad_request(&mut stream, "File not found");
            return Ok(());
        }
        match futures::executor::block_on(loadmarkdown(path_param)) {
            Ok(html) => {
                let _ = ok_html(&mut stream, html.as_bytes());
            }
            Err(e) => {
                let _ = send_json(&mut stream, 500, &serde_json::json!({ "error": e }));
            }
        }
        return Ok(());
    }

    // Static/page routing:
    // Map page-name routes to `<name>.html` if present, else fallback to index.html
    if path_only == "/" {
        path_only = "/filegpt.html".to_string(); // existing default in main.rs
    } else if !path_only.contains('.') {
        // no extension, treat as page name
        let candidate = format!("{}{}.html", if path_only.starts_with('/') { "" } else { "/" }, path_only.trim_start_matches('/'));
        if project_dir.contains(&candidate[1..]) {
            path_only = candidate;
        } else {
            // Always serve index.html for SPA routes (so /diffview, /settings, etc. work in browser)
            path_only = "/index.html".to_string();
        }
    }

    let rel = path_only.trim_start_matches('/');
    if project_dir.contains(rel) {
        if let Some(f) = project_dir.get_file(rel) {
            let ct = content_type_for(rel);
            let _ = ok_static(&mut stream, f.contents(), ct);
            return Ok(());
        }
        if let Some(d) = project_dir.get_dir(rel) {
            // try index.html inside dir
            if let Some(f) = d.get_file("index.html") {
                let _ = ok_static(&mut stream, f.contents(), "text/html; charset=utf-8");
                return Ok(());
            }
        }
    }

    let _ = not_found(&mut stream);
    Ok(())
}