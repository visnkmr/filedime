#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{
    collections::{HashMap, HashSet},
    fmt::format,
    io::{Cursor, Read},
    mem,
    net::{TcpListener, TcpStream},
    path::{self, Path},
    process::Command,
    sync::{Arc, Mutex, RwLock},
    thread,
    time::{self, Duration, Instant, SystemTime, UNIX_EPOCH},
};
mod dirsize;
mod drivelist;
mod fileitem;
mod embedhelp;
mod filltrie;
mod lastmodcalc;
mod navtimeline;
mod sendtofrontend;
mod installed_apps;
mod dual_viewer;
use chrono::{DateTime, Local, Utc};
use local_ip_address::local_ip;
// use get_size::GetSize;
use navtimeline::{BrowserHistory, Page};
use ollama_rs::generation::{completion::request::GenerationRequest, embeddings::request::GenerateEmbeddingsRequest};
use text_splitter::TextSplitter;
// use filesize::PathExt;

use crate::{driveops::*, embedhelp::load_document_and_extract_text};
use crate::fileops::*;
use ignore::WalkBuilder;
use prefstore::*;
use rayon::prelude::*;
use reqwest::Error;
use sendtofrontend::{driveslist, lfat, sendbuttonnames, sendprogress};
use serde_json::json;
use syntect::{highlighting::ThemeSet, parsing::SyntaxSet};
use tauri::{
    api::{file::read_string, shell},
    http::ResponseBuilder,
    window, CustomMenuItem, GlobalWindowEvent, Manager, Menu, MenuItem, PathResolver, Runtime,
    State, Submenu, WindowEvent,
};

// use walkdir::WalkDir;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Window};
mod appstate;
use appstate::*;
mod filechangewatcher;
mod searchfiles;
mod sizeunit;
// mod loadjs;
mod tabinfo;
// mod recentfiles;
mod bookmarks;
mod openhtml;
// // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod listfiles;
mod markdown;
// mod partialratio;
use crate::{
    bookmarks::*, filechangewatcher::*, filltrie::populate_try, listfiles::*, markdown::*,
    openhtml::*, searchfiles::*, sendtofrontend::loadmarks, tabinfo::*, installed_apps::*,
    dual_viewer::*,
};
use lastmodcalc::lastmodified;
// mod r  esync;
mod navops;
use crate::navops::*;
// define a struct to represent a file or directory
#[derive(Serialize, Clone, Debug, PartialEq, Hash, Eq)]
pub struct FileItem {
    name: String,
    path: String,
    is_dir: bool,
    size: String,
    rawfs: u64,
    lmdate: String,
    timestamp: i64,
    foldercon: i32,
    ftype: String, // grandparent:String,
    parent: String,
}
const CACHE_EXPIRY: u64 = 60;

use std::fs::File;
use std::io::{self, Seek, SeekFrom, Write};

#[tauri::command]
async fn searchload(
    path: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), String> {
    populate_try(path.clone(), &window, &state).await;
    Ok(())
}
#[tauri::command]
async fn mirror(functionname: String, arguments: Vec<String>, window: Window) {
    window.get_focused_window().unwrap().emit(
        "mirror",
        serde_json::to_string(&json!({
          "functionname":functionname,
          "arguments":arguments
        }))
        .unwrap(),
    );
}

#[derive(Serialize)]
struct existingfileinfo {
    sourcepath: String,
    destpath: String,
    existingfilesize: String,
    existingdate: String,
    srcfilesize: String,
    srcfiledate: String,
}

mod driveops;
mod fileops;

// #[tauri::command]
// async fn defaulttoopen(name:String,window: Window, state: State<'_, AppStateStore>) ->
//   Result<String, String>
//   {
//     match(dirs::home_dir()){
//       Some(val)=>{
//           return Ok(val.to_string_lossy().to_string())
//       },
//       None=>{
//         return Err("home not found".to_string());
//       }
//     }

//   }

#[tauri::command]
async fn getlocalip() -> Result<String, String> {
    println!("{}", local_ip().unwrap().to_string());
    Ok(local_ip().unwrap().to_string())
}
#[tauri::command]
async fn fileslist(state: State<'_, AppStateStore>) -> Result<Vec<String>, String> {
    let filelist=state.filelist.read().unwrap();
    Ok(filelist.clone())
}
#[tauri::command]
async fn embedfile(path: Vec<String>,embeddingmodelname:String, state: State<'_, AppStateStore>) -> Result<(serde_json::Value), String> {
    println!("{:?}",path);
    let mut successcount=0;
    let mut failcount=0;
    for eachfile in path{
        if let Ok(res)=state.embedfile(eachfile,embeddingmodelname.clone()).await{
            successcount+=1
        }
        else{
            failcount+=1
        }
    }
    if(successcount>=1)
    {
        return Ok(json!({"successcount":successcount,"failcount":failcount}))
    }
    Err("Could not embed file type not supported".to_string())
}
#[tauri::command]
async fn queryfile(question: String, model: String,embeddingmodelname:String,usecompletefile:bool,pathstr:String, state: State<'_, AppStateStore>) -> Result<String, String> {
        let mut doclist;
        let mut retrieved_context=String::new();
        let mut pathfile=Path::new(&pathstr);
        let path=pathfile.display().to_string();
        // println!("{}",path);
    println!("querying file with question {} with embedding model {} and path {} and usecompletefile {}",question,embeddingmodelname,path,usecompletefile);

        // let ollama = ollama_rs::Ollama::from_url(tauri::Url::parse(&ollamaurl).unwrap());

        // let path="ALL";
        if(usecompletefile){
            if(path=="ALL")
            {
                let rwdoclist=state.filelist.read().unwrap();
                doclist =rwdoclist.clone();
                drop(rwdoclist);
            }
            else{
                doclist=vec![path.to_string()]
            }
            for path in doclist{
                let input_vec = load_document_and_extract_text(Path::new(&path)).unwrap();
                let texts_to_embed=input_vec.content;
                retrieved_context.push_str(texts_to_embed.as_str());
            }
        }
        else
        {

            let splitter = TextSplitter::new(256);
            let mut seen = std::collections::HashSet::new();
    let texts_to_embed: Vec<&str> = splitter.chunks(&question).filter(|c| seen.insert(*c)).collect();
        
            // Create the embedding request for the user's question
            let query_req = GenerateEmbeddingsRequest::new(
                embeddingmodelname.clone(),
                texts_to_embed.clone().into(),
            );
        
            // 1. AWAIT: Generate embeddings for the question. No locks are held here.
            let embeddings_response = state.ollama.generate_embeddings(query_req).await.unwrap();
        
            // This string will hold the data we retrieve from the database.
            // let mut retrieved_context = String::new();
        
            // --- Start of the critical section ---
            // Use a block to strictly limit the lifetime of the RwLockReadGuard.
            {
                let db = Arc::clone(&state.db);
                // The read guard 'collections_guard' is created here.
                let collections_guard = db.read().unwrap(); 
                let collection = collections_guard.get_collection(&path).unwrap();
        
                for (i,embedding) in embeddings_response.embeddings.iter().enumerate() {
                    // Perform the similarity search while the lock is held.
                    for similar_result_found in collection.get_similarity(embedding, 10) {
                        // println!("{:?}",similar_result_found.embedding.id);
                        // Assuming the 'title' is what you want to retrieve.
                        // Using .get() and handling the Option is safer.
                        if let Some(title_value) = similar_result_found.embedding.id.get(&format!("title")) {
                            // Convert the value to a string slice and push it.
                                retrieved_context.push_str(title_value.as_str());
                                retrieved_context.push_str("\n"); // Add a separator for clarity
                        }
                    }
                }
            } // <-- The 'collections_guard' is dropped here, and the read lock is released.
              // We are now safe to .await again.
        
            }
    println!("Retrieved Content: {}", retrieved_context);
    Ok(retrieved_context)

    // let prompt = format!(
    //     "Given the following context, answer the question accurately and concisely. If the answer is not in the context, state that you cannot answer from the provided information.\n\nContext:\n{}\n\nQuestion: {}",
    //     retrieved_context.trim(),
    //     question
    // );

    // let llm_request = GenerationRequest::new(model, prompt);

    // // 2. AWAIT: Generate the final response from the LLM.
    // if let Ok(llm_response) = state.ollama.generate(llm_request).await {
    //     return Ok(llm_response.response);
    // }

    // Ok("no response generated".to_string())
}

#[tauri::command]
async fn highlightfile(path: String, theme: String) -> Result<String, String> {
    let syntax_set = SyntaxSet::load_defaults_newlines();
    let theme_set = ThemeSet::load_defaults();
    // let dark="dark".to_string();
    // let theme = "dark"; // or "light"

    let th = if (theme == "dark".to_string()) {
        &theme_set.themes["base16-ocean.dark"]
    } else {
        &theme_set.themes["base16-ocean.light"]
    };
    // &theme_set.themes["base16-ocean.light"];
    match (syntect::html::highlighted_html_for_file(&path, &syntax_set, th)) {
        Ok(src) => Ok(src),
        Err(e) => Err(e.to_string()),
    }
}
#[tauri::command]
fn filegptendpoint(endpoint: String,whichvar:String,defaultval:String) -> Result<String, String> {
    if (endpoint == "") {
        Ok(getcustom(
            "filedime",
            format!("storevals/{}.set",whichvar),
            defaultval,
        ))
    } else {
        savecustom("filedime", format!("storevals/{}.set",whichvar ), endpoint.clone());
        Ok(endpoint)
    }
}
#[tauri::command]
async fn openpath(path: String) -> Result<(), String> {
    println!("{}", path);
    if (is_appimage(path.clone())) {
        let output = Command::new(path)
            .output()
            .expect("Failed to execute command");

        if !output.status.success() {
            eprintln!(
                "Command executed with error: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        } else {
            println!(
                "Command executed successfully: {}",
                String::from_utf8_lossy(&output.stdout)
            );
        }
    } else {
        match (opener::open(path)) {
            Ok(g) => {
                println!("opening")
            }
            Err(e) => {
                println!("error opening file")
            }
        };
    }
    Ok(())
}
fn is_appimage(path: String) -> bool {
    #[cfg(target_os = "linux")]
    {
        let path = Path::new(&path);
        let metadata = fs::metadata(&path).unwrap();
        let bval = if metadata.is_file() {
            if let Some(ext) = path.extension() {
                ext == "AppImage"
            } else {
                false
            }
        } else {
            false
        };
        return bval;
    }
    false
}
#[cfg(target_os = "windows")]
#[tauri::command]
async fn check_if_installed(appname: &str) -> Result<bool, String> {
    let output = Command::new("cmd")
        .args(["/C", appname])
        .output()
        .expect("cmd Not found");

    Ok(output.status.success())
}
#[derive(Debug, Deserialize, Serialize)]
struct CommandEntry {
    os: String,      // The operating system name (e.g., "macOS", "Linux", "Windows").
    command: String, // The actual command string to execute.
}

// Define a struct that mirrors the overall JSON structure.
#[derive(Debug, Deserialize, Serialize)]
struct AppConfig {
    icon: String,           // The icon string.
    name: String,           // The name string.
    command: Vec<CommandEntry>, // A vector (array) of CommandEntry structs.
}
use std::env::consts::OS;
fn parse_config(json_str: &str, target_os: &str) -> Result<(String, String, Option<String>), String> {
    // Attempt to deserialize the JSON string into our AppConfig struct.
    // The `?` operator is used for error propagation, returning an `Err` if deserialization fails.
    let config: AppConfig = serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // Find the command specific to the target_os.
    // `find()` returns an `Option<&CommandEntry>`, which will be `Some` if found, `None` otherwise.
    let command_for_os = config.command.iter()
        .find(|entry| entry.os.eq_ignore_ascii_case(target_os)) // Case-insensitive comparison for OS.
        .map(|entry| entry.command.clone()); // If found, clone the command string.

    // Return the extracted data wrapped in an `Ok` variant.
    Ok((config.icon, config.name, command_for_os))
}
fn startup(window: &AppHandle) -> Result<(), ()> {
    let defaultopenterm=json!({
        "icon": "Terminal",
        "name": "Open Terminal",
        "command": [
            {
            "os": "macos",
            "command": "open -a Terminal %f"
            },
            {
            "os": "linux",
            "command": "exo-open --working-directory %f --launch TerminalEmulator"
            },
            {
            "os": "windows",
            "command": "cmd /C start cmd /K cd /d %f"
            }
        ]
        });
    //define format for adding custom button as extensions to ui
    // if cfg!(target_os = "linux") {
    //     // getcustom(
    //     //     "filedime",
    //     //     "custom_scripts/terminal_open.fds",
    //     //     "exo-open --working-directory %f --launch TerminalEmulator",
    //     // );
    // } else if cfg!(target_os = "windows") {
        getcustom(
            "filedime",
            "custom_scripts/terminal_open.fds",
            serde_json::to_string(&defaultopenterm).unwrap(),
        );
    // }

    let mut buttonnames = Vec::new();
    // println!("{:?}",getallcustomwithin("filedime", "custom_scripts","fds"));
    for (i, j) in getallcustomwithin("filedime", "custom_scripts", "fds") {
        buttonnames.push(i.clone().replace("_", " "));
        // println!("name of file{:?}",i);//filename
        // println!("{:?}",j);//contents
    }
    sendbuttonnames(&window.app_handle(), &buttonnames).unwrap();
    Ok(())
}
// #[tauri::command]
// fn zoom_window(window: tauri::Window, scale_factor: f64) {
//     let _ = window.with_webview(move |webview| {
//         #[cfg(target_os = "linux")]
//         {
//           // see https://docs.rs/webkit2gtk/0.18.2/webkit2gtk/struct.WebView.html
//           // and https://docs.rs/webkit2gtk/0.18.2/webkit2gtk/trait.WebViewExt.html
//         //   use webkit2gtk::traits::WebViewExt;
          
//         //   webview.inner().set_zoom_level(scale_factor);
//         }

//         #[cfg(windows)]
//         unsafe {
//           // see https://docs.rs/webview2-com/0.19.1/webview2_com/Microsoft/Web/WebView2/Win32/struct.ICoreWebView2Controller.html
//           webview.controller().SetZoomFactor(scale_factor).unwrap();
//         }

//         // #[cfg(target_os = "macos")]
//         // unsafe {
//         //   let () = msg_send![webview.inner(), setPageZoom: scale_factor];
//         // }
//       });
// }
#[tauri::command]
async fn otb(bname: String, path: String, state: State<'_, AppStateStore>) -> Result<(), ()> {
    // state.getactivepath(path);
     let current_os = OS;

    println!("{}--{}",bname, path);

    if (!Path::new(&path).is_dir()) {
        return Err(());
    }
    let mut json_data = state
        .buttonnames
        .get(&bname.replace(" ", "_"))
        .unwrap()
        .clone();
    println!("Detected operating system: {}", current_os);
    let mut args="".to_string();
    // Parse the configuration for the current operating system.
    match parse_config(&json_data, current_os) {
        Ok((icon, name, command)) => {
            println!("--- For Current OS ({}) ---", current_os);
            println!("Icon: {}", icon);
            println!("Name: {}", name);
            if let Some(cmd) = command {
                args=cmd.clone();
                println!("Command: {}", cmd);
            } else {
                println!("Command for {} not found.", current_os);
            }
        },
        Err(e) => eprintln!("Error parsing config: {}", e),
    }

    println!();

    // Test with malformed JSON (kept for error handling demonstration)
    // let malformed_json = r#"{"icon": "❌", "name": "Broken", "command": ["oops"}"#;
    // match parse_config(malformed_json, current_os) {
    //     Ok((icon, name, command)) => {
    //         println!("--- For Malformed JSON ---");
    //         println!("Icon: {}", icon);
    //         println!("Name: {}", name);
    //         if let Some(cmd) = command {
    //             println!("Command: {}", cmd);
    //         } else {
    //             println!("Command not found.");
    //         }
    //     },
    //     Err(e) => eprintln!("--- For Malformed JSON Error --- \nError: {}", e),
    // }
    args = args.replace("%f", &path);
    let args: Vec<_> = args.split(" ").collect();
    println!("{:?}", args);

    let output = Command::new(args[0])
        .args(&args[1..])
        // .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    println!("{:?}", output);
    Ok(())
}
// #[tauri::command]
// fn get_window_label() -> String {
//   let window = tauri::Window::current().unwrap();
//   window.label().to_string()
// }
#[tauri::command]
async fn get_timestamp() -> String {
    let timestamp = format!("{}", chrono::Utc::now().timestamp_millis());
    // println!("{}",timestamp);
    timestamp
}

#[tauri::command]
async fn get_installed_apps_command() -> Result<String, String> {
    let apps = get_installed_apps()?;
    serde_json::to_string(&apps).map_err(|e| e.to_string())
}
#[tauri::command]
async fn nosize(
    windowname: String,
    togglewhat: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    // println!("loading toggle rust---->1");

    match (togglewhat.as_str()) {
        "size" => state.togglenosize(),
        "excludehidden" => {
            println!("togglehidden");
            state.togglehidden()
        }
        "includefolder" => {
            state.toggleif();
        }
        "folcount" => {
            state.togglefolcount();
        }
        "sessionsave" => {
            savecustom("filedime", "storevals/savetabs.set", {
                let truechecker = getcustom("filedime", "storevals/savetabs.set", "false");
                match (truechecker.as_str()) {
                    "true" => false,
                    _ => true,
                }
            });
        }
        "loadmarks" => {
            loadmarks(
                &windowname,
                &window.app_handle(),
                serde_json::to_string(&state.getmarks()).unwrap(),
            );
        }
        _ => {}
    }

    Ok(())
}

#[tauri::command]
async fn newwindow(
    path: String,
    ff: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    let absolute_date = getuniquewindowlabel();
    let filename = PathBuf::from(path.clone());
    let mut wname = "";
    if let Some(fname) = filename.file_name() {
        wname = fname.to_str().unwrap();
    }
    opennewwindow(&window.app_handle(), &wname, &absolute_date);
    println!("new winodw==============");

    Ok(())
}
#[tauri::command]
async fn newspecwindow(
    winlabel: String,
    name: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    // println!("{}",tauri::WindowUrl::App("settings.html".into()).to_string());
    let labelwin=winlabel;
    let namewin=name;
    if (labelwin == "settings" || labelwin == "installed-apps" || labelwin == "chatui" || labelwin == "diffview") {
        tauri::WindowBuilder::new(
            &window.app_handle(),
            labelwin.clone(),
            tauri::WindowUrl::App(labelwin.clone().into()),
        )
        .title(namewin.clone())
        .build()
        .unwrap();
        if (labelwin.starts_with("chatui")) {
                println!("{:?}",embedfile(vec![namewin.replace("FileGPT: ","")],state.embedding_model_name.clone(), state).await.unwrap());
            window.app_handle()
                .emit_all(
                    "dialogshow",
                    serde_json::to_string(&json!({
                    "title":namewin.replace("FileGPT: ",""),
                    "content":"Sucessfully embeded",
                    }))
                    .unwrap(),
                )
                .unwrap();
        }
    } else {
        opennewwindow(&window.app_handle(), &namewin, &labelwin);
    }
    Ok(())
}

#[tauri::command]
fn configfolpath(window: Window, state: State<'_, AppStateStore>) -> String {
    serde_json::to_string(&json!({
      "excludehidden":state.excludehidden.read().unwrap().clone(),
      "sessionstore":({
          let truechecker=getcustom("filedime", "storevals/savetabs.set", "false");
          match(truechecker.as_str()){
          "true"=>{
              true
          },
          _=>false
          }
        }),
      "includefolder":state.includefolderinsearch.read().unwrap().clone(),
      "childcount":state.showfolderchildcount.read().unwrap().clone(),
      "folsize":state.nosize.read().unwrap().clone(),
      "cfpath":config_folder_path("filedime").as_path().to_string_lossy().to_string(),
      "cfpathsize":(sizeunit::size(dirsize::dir_size(
          &config_folder_path("filedime").as_path().to_string_lossy().to_string(),
          &state,
      ),true)),
    //   "frontend_size":(sizeunit::size(&PROJECT_DIR.,true)),
    }))
    .unwrap()
}
#[tauri::command]
fn tabname(path: String) -> String {
    let p = path.clone();
    let result = if let Some(h) = PathBuf::from(&path).file_stem() {
        let tabname = h.to_string_lossy().to_string();
        if (tabname == "") {
            path
        } else {
            tabname
        }
    } else {
        path
    };
    println!(" found tabname of ------> {} as {}", p, result);

    result
}
#[tauri::command]
async fn foldersize(
    path: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<String, ()> {
    let sizetosend = dirsize::dir_size(&path.to_string(), &state);
    Ok(sizeunit::size(sizetosend, true))
}
#[tauri::command]
async fn loadsearchlist(
    windowname: &str,
    id: String,
    path: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    // state.togglelsl();
    populate_try(path, &window, &state);
    // list_files(windowname.to_string(),id,path,"newtab".to_string(), window, state).await;
    Ok(())
}
// use url::Url;

// fn parse_uri(uri: &str) -> HashMap<String, String> {
//   let parsed_url = Url::parse(uri).unwrap();
//   let mut params = HashMap::new();

//   for (key, value) in parsed_url.query_pairs() {
//       params.insert(key.into_owned(), value.into_owned());
//   }

//   params
// }
#[tauri::command]
async fn checker() -> Result<String, String> {
    let url = "https://cdn.jsdelivr.net/gh/visnkmr/filedime@nextrelease/version.txt";
    match (reqwest::get(url).await) {
        Ok(response) => {
            // Ensure the response is successful
            if response.status().is_success() {
                // Read the response body as text
                let body = response.text().await.unwrap_or_default();
                println!("Response data: {}", body);
                return Ok(body);
            } else {
                println!("Failed to fetch data. Status: {}", response.status());
                Err("Could not check for updates".to_string())
            }
        }
        Err(_) => Err("Could not check for updates".to_string()),
    }
}

fn get_boundary(request: &str) -> Option<String> {
    // Look for "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary"
    if let Some(pos) = request.find("Content-Type: multipart/form-data;") {
        let content_type = &request[pos..];
        if let Some(boundary_pos) = content_type.find("boundary=") {
            let boundary_start = boundary_pos + "boundary=".len();
            let boundary_end = content_type[boundary_start..].find("\r\n").unwrap_or(content_type.len());
            return Some(content_type[boundary_start..boundary_start + boundary_end].to_string());
        }
    }
    None
}

fn get_body(request: &str) -> Option<String> {
    // The body starts after the headers, which are separated by a double newline (CRLF)
    if let Some(pos) = request.find("\r\n\r\n") {
        let body = &request[pos + 4..];
        return Some(body.to_string());
    }
    None
}

fn parse_multipart_form_data(body: &str, boundary: &str) -> Vec<(String, String)> {
    let mut form_data = Vec::new();
    let boundarystring=format!("--{}", boundary);
    let mut parts = body.split(&boundarystring); // Split by the boundary

    for part in parts {
        if part.is_empty() {
            continue;
        }

        // Find the headers in the part
        if let Some(pos) = part.find("\r\n\r\n") {
            let headers = &part[..pos];
            let content = &part[pos + 4..]; // After the headers is the content

            // Check for the content-disposition header for form fields
            if let Some(disposition_pos) = headers.find("Content-Disposition: form-data;") {
                let header = &headers[disposition_pos..];
                if let Some(name_pos) = header.find("name=\"") {
                    let name_start = name_pos + "name=\"".len();
                    let name_end = header[name_start..].find("\"").unwrap_or(header.len());
                    let name = &header[name_start..name_start + name_end];

                    // Capture the content of the field
                    form_data.push((name.to_string(), content.to_string()));
                }
            }
        }
    }

    form_data
}
mod api_server;
fn handle_connection(stream: TcpStream) -> anyhow::Result<()> {
    // Delegate HTTP handling to centralized router.
    // #[cfg(feature = "embed-frontend")]
    {
        crate::api_server::route_connection(stream, &PROJECT_DIR)?;
        return Ok(());
    }
    // #[cfg(not(feature = "embed-frontend"))]
    // {
    //     // Use current directory as an empty include_dir to allow API routing; static files will 404.
    //     static EMPTY_DIR: include_dir::Dir = include_dir::include_dir!(".");
    //     crate::api_server::route_connection(stream, &EMPTY_DIR)?;
    //     return Ok(());
    // }
}
use include_dir::{include_dir, Dir};

// #[cfg(feature = "embed-frontend")]
// fn handle_connection(mut stream: TcpStream) -> anyhow::Result<()> {
//     let mut buffer = [0; 1024];
//     stream.read(&mut buffer).unwrap();
//     let request = String::from_utf8_lossy(&buffer[..]);
//     println!("Request: {}", request);

//      // Handle CORS preflight (OPTIONS) requests
//     if request.starts_with("OPTIONS") {
//         let response = "HTTP/1.1 200 OK\r\n\
//                         Access-Control-Allow-Origin: *\r\n\
//                         Access-Control-Allow-Methods: POST, OPTIONS\r\n\
//                         Access-Control-Allow-Headers: Content-Type\r\n\
//                         Content-Length: 0\r\n\r\n";
//         stream.write(response.as_bytes())?;
//         stream.flush()?;
//         return Ok(());
//     }


//      // Check if the request is a POST request
//     if request.starts_with("POST") {
//         // Find the boundary from the Content-Type header
//         if let Some(boundary) = get_boundary(&request) {
//             println!("Boundary: {}", boundary);

//             if let Some(body) = get_body(&request) {
//                 // Use multipart crate to parse the body
//                 let mut multipart = multipart::server::Multipart::with_body(body.as_bytes(), boundary);
                
//                 while let Some(mut field) = multipart.read_entry()? {
//                     // let name = field.name().unwrap_or("unknown");
//                     // let filename = field.filename().unwrap_or("unknown");
//                     let mut file_content = Vec::new();

//                     // Read the content of the file
//                     field.data.read_to_end(&mut file_content)?;

//                     // println!("Field name: {}", name);
//                     // println!("File name: {}", filename);
//                     println!("File content: {:?}", str::from_utf8(&file_content)?);
//                 }

//                 // Send a response back with CORS headers and ensure it's properly flushed
//                 let response = "HTTP/1.1 200 OK\r\n\
//                                 Access-Control-Allow-Origin: *\r\n\
//                                 Content-Length: 13\r\n\r\n\
//                                 Hello, World!";
//                 stream.write_all(response.as_bytes())?;
//                 stream.flush()?;
//             } else {
//                 println!("No body content found.");
//             }
//         } else {
//             println!("No boundary found in Content-Type.");
//         }
//         let retjson=serde_json::to_string(&json!({"ok":"ok"}))?;
//         // Send a response back with CORS headers
//         let response = format!("HTTP/1.1 200 OK\r\n\
//                         Access-Control-Allow-Origin: *\r\n\
//                         Content-Length: 13\r\n\r\n\
//                         {}",retjson);
//         stream.write(response.as_bytes())?;
//         stream.flush()?;
//     }
//     else{
//          // Assuming the request format is "GET /filename HTTP/1.1\r\n", extract filename
//     let mut filename = request.split_whitespace().nth(1).unwrap_or("/");
//     filename = filename.trim_start_matches('/');


//     // println!("---->{}----",filename);
//     if (filename.is_empty()) {
//         filename = ("filegpt.html");
//     }

//     // Check if the file exists and is readable
//     if PROJECT_DIR.contains(filename) {
//         let contents = PROJECT_DIR.get_file(filename).unwrap();
//         let response = format!(
//             "HTTP/1.1  200 OK\r\nContent-Length: {}\r\n\r\n{}",
//             contents.contents().len(),
//             contents.contents_utf8().unwrap()
//         );
//         stream.write(response.as_bytes()).unwrap();
//         stream.flush().unwrap();
//     } else {
//         let response = "HTTP/1.1  404 NOT FOUND\r\n\r\n";
//         stream.write(response.as_bytes()).unwrap();
//         stream.flush().unwrap();
//     }
//     }
//     Ok(())
// }
// use include_dir::{include_dir, Dir};

static PROJECT_DIR: Dir = include_dir!("../out/");
// fn findsize(tf:&include_dir::Dir)->usize{
//     let mut total_size=0;
//     for i in tf.entries(){
//         // if()
//         {
//             if let Some(ed)=i.as_dir(){
//                 total_size+=findsize(ed)
//             }
//             else if let Some(ef)=i.as_file(){
//                 // ef.contents()
//                 total_size += mem::size_of_val(&ef.contents());
//             }
//             // total_size+=i.get_size();
//         }
//     }
//     total_size
// }
#[tauri::command]
async fn show_main_window(window: tauri::Window) {
    window.set_decorations(true).unwrap();
    window.maximize().unwrap();
    window.show().unwrap();
}
#[test]
fn chatuitest(){

        const HOST: &str = "0.0.0.0";
        const PORT: &str = "8477";
        let end_point: String = format!("{}:{}", HOST, PORT);
        let listener = TcpListener::bind(end_point).unwrap();
        println!("Web server is listening at port {}", PORT);
    
        for stream in listener.incoming() {
            let _stream = stream.unwrap();
            handle_connection(_stream);
        }
}
fn main() {
    // println!("{:?}",findsize(&PROJECT_DIR));
    thread::spawn(move || {
        const HOST: &str = "0.0.0.0";
        const PORT: &str = "8477";
        let end_point: String = format!("{}:{}", HOST, PORT);
        let listener = TcpListener::bind(end_point).unwrap();
        println!("Web server is listening at port {}", PORT);

        for stream in listener.incoming() {
            let _stream = stream.unwrap();
            if let Err(e) = handle_connection(_stream) {
                eprintln!("HTTP connection error: {:?}", e);
            }
        }
    });

    let mut g = AppStateStore::new(CACHE_EXPIRY);
    let app = tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            // let resource_path = app_handle.path_resolver();
            let ss = startup(&app_handle).is_ok();
            if ss {
                println!("loaded buttons successfully.")
            } else {
                println!("loading buttons failed")
            }
            Ok(())
        })
        .on_window_event(on_window_event)
        .manage(g)
        // Manage DualViewerStore so dual_* commands can access it via State<DualViewerStore>
        .manage(dual_viewer::DualViewerStore::default())
        .invoke_handler(tauri::generate_handler![
            // getpathfromid,
            filegptendpoint,
            configfolpath,
            listtabs,
            closealltabs,
            getparentpath,
            show_main_window,
            mirror,
            addmark,
            fileop,
            moveop,
            start_file_operation,
            pause_file_operation,
            resume_file_operation,
            getlocalip,
            checkiffile,
            checkforconflicts,
            // backbutton,
            closetab,
            new,
            disablenav,
            searchload,
            // defaulttoopen,
            foldersize,
            files_list_for_miller_col,
            get_path_options,
            get_timestamp,
            // getuniquewindowlabel,
            list_files,
            // load_tab,
            senddriveslist,
            loadfromhtml,
            loadmarkdown,
            loadsearchlist,
            newtab,
            newwindow,
            nosize,
            openpath,
            highlightfile,
            doespathexist,
            otb,
            // zoom_window,
            removemark,
            // populate_try,
            search_try,
            startserver,
            stopserver,
            tabname,
            checker,
            navbrowsetimeline,
            newspecwindow,
            addtotabhistory,
            mountdrive,
            unmountdrive,
            embedfile,
            queryfile,
            fileslist,
            get_installed_apps_command,
            launch_app_command,
            // dual viewer commands
            dual_open,
            dual_request,
            dual_scroll_sync,
            dual_scroll_f1,
            dual_scroll_f2,
            dual_close,
            // whattoload,
            // get_window_label
        ])
        .build(tauri::generate_context!())
        .expect("Failed to start app");

    app.run(|app_handle, e| match e {
        tauri::RunEvent::ExitRequested { api, .. } => {
            // api.prevent_exit();
        }
        tauri::RunEvent::WindowEvent { event, .. } => match event {
            //when closed with knowledge
            tauri::WindowEvent::CloseRequested { api, .. } => {

                //   // api.prevent_close();
                //   // hide(app_handle.app_handle());
            }
            _ => {}
        },
        _ => {}
    });
}
fn on_window_event(event: GlobalWindowEvent) {
    if let WindowEvent::CloseRequested {
        #[cfg(not(target_os = "linux"))]
        api,
        ..
    } = event.event()
    {

        // #[cfg(target_os = "macos")]
        // {
        //     app.hide().unwrap();
        //     api.prevent_close();
        // }
    }
}
//for testing to prevent the window from autoclosing
// fn hide(app: AppHandle) {
//   let window = app.get_window("main").unwrap();
//   window.unminimize().unwrap();
//   window.hide().unwrap();
//   #[cfg(target_os = "macos")]
//   {
//     app.hide().unwrap();
//     set_is_accessory_policy(true);
//   }
// }
// In Rust, define a function that takes a path as an argument and returns a list of possible paths
#[tauri::command]
async fn getparentpath(
    mut path: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<String, ()> {
    match (PathBuf::from(&path).parent()) {
        Some(k) => return Ok(k.to_string_lossy().to_string()),
        None => return Err(()),
    }
}
#[tauri::command]
async fn get_path_options(
    mut path: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<Vec<String>, ()> {
    let mut options = Vec::new();
    let pathasbuf = PathBuf::from(path.clone());
    if (!pathasbuf.exists()) {
        if let Some(parent) = pathasbuf.parent() {
            // Convert parent to OsStr
            path = parent.as_os_str().to_string_lossy().to_string();
        }
    }
    // Use substring instead of path
    if let Ok(entries) = std::fs::read_dir(path.clone()) {
        for entry in entries {
            if let Ok(entry) = entry {
                {
                    options.push(entry.path().to_string_lossy().to_string());
                }
            }
        }
    }
    Ok(options)
}

pub fn opennewwindow(app_handle: &AppHandle, title: &str, label: &str) -> Window {
    println!("{:?}", getwindowlist(app_handle));
    tauri::WindowBuilder::new(
        app_handle,
        label,
        tauri::WindowUrl::App("index.html".into()),
    )
    // .initialization_script(&INIT_SCRIPT)
    .title(title)
    .build()
    .unwrap()
}

pub fn opendialogwindow(app_handle: &AppHandle, title: &str, content: &str, label: &str) {
    app_handle
        .emit_all(
            // label,
            "dialogshow",
            serde_json::to_string(&json!({
              "title":title,
              "content":content,
              // "arguments":arguments
            }))
            .unwrap(),
        )
        .unwrap();
}
pub fn getwindowlist(app_handle: &AppHandle) -> Vec<String> {
    match (app_handle.get_window("main")) {
        Some(iop) => {
            iop.windows()
                .iter()
                .map(|e| {
                    // println!("{}--",e.0);
                    // println!("{}--{:?}",i.0,i.1);
                    e.0.clone()
                })
                .collect::<Vec<String>>()
        }
        None => {
            vec![]
        }
    }
}
// #[tauri::command]
fn getuniquewindowlabel() -> String {
    let now = SystemTime::now();

    let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
    let absolute_date = now_date.format("%d%m%H%M%S").to_string();
    // println!("{absolute_date}");
    absolute_date
}
