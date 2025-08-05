use std::{
    fs::File,
    io::{BufRead, BufReader},
    path::PathBuf,
    sync::Mutex,
};

use serde::{Deserialize, Serialize};
use syntect::{highlighting::ThemeSet, parsing::SyntaxSet};
use tauri::{AppHandle, Manager, State, Window};

use crate::appstate::AppStateStore;

const WINDOW_SIZE: usize = 60;
const READAHEAD_WINDOWS: usize = 3; // 3 * 60 = 180 lines

#[derive(Clone, Debug)]
struct FileBuffer {
    path: PathBuf,
    // absolute 0-based current top line index for this pane
    top_line: usize,
    // absolute 0-based highlighted line index
    highlight_line: usize,
    // cache window range in absolute lines [cache_start, cache_end)
    cache_start: usize,
    cache_end: usize,
    // cached lines
    cache: Vec<String>,
    // optional handle for efficient seeking (we will re-open when needed)
    // We will not keep file descriptor permanently to avoid locking large files unnecessarily
}

impl FileBuffer {
    fn new(path: PathBuf) -> anyhow::Result<Self> {
        Ok(Self {
            path,
            top_line: 0,
            highlight_line: 0,
            cache_start: 0,
            cache_end: 0,
            cache: Vec::new(),
        })
    }
}

/// Read specific line range [start, end) from file without loading entire file.
/// We will stream lines, skipping until start, then take until end or EOF.
fn read_line_range(path: &PathBuf, start: usize, end: usize) -> anyhow::Result<Vec<String>> {
    let f = File::open(path)?;
    let mut reader = BufReader::new(f);
    // Fast-forward by reading lines
    let mut buf = String::new();
    let mut out = Vec::with_capacity(end.saturating_sub(start));
    let mut idx: usize = 0;
    loop {
        buf.clear();
        let bytes = reader.read_line(&mut buf)?;
        if bytes == 0 {
            break;
        }
        // normalize endings
        if buf.ends_with('\n') {
            buf.pop();
            if buf.ends_with('\r') {
                buf.pop();
            }
        }
        if idx >= start && idx < end {
            out.push(buf.clone());
            if out.len() >= end - start {
                break;
            }
        }
        idx += 1;
        if idx >= end {
            break;
        }
    }
    Ok(out)
}

/// Heuristic to guess syntax for syntect based on filename.
fn guess_syntax<'a>(
    ss: &'a SyntaxSet,
    path: &PathBuf,
) -> Option<&'a syntect::parsing::SyntaxReference> {
    if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
        ss.find_syntax_by_extension(ext)
    } else {
        ss.find_syntax_by_extension("") // force None so caller uses fallback
    }
}

fn lines_to_html(lines: &[String], path: &PathBuf, dark_theme: bool) -> String {
    // Include line numbers directly in the returned HTML so the UI shows them without extra logic.
    // Determine theme
    let ss = SyntaxSet::load_defaults_newlines();
    let ts = ThemeSet::load_defaults();
    let theme = if dark_theme {
        &ts.themes["base16-eighties.dark"]
    } else {
        &ts.themes["InspiredGitHub"]
    };
    let syntax = guess_syntax(&ss, path).unwrap_or_else(|| ss.find_syntax_plain_text());

    use syntect::easy::HighlightLines;
    use syntect::html::{styled_line_to_highlighted_html, IncludeBackground};

    let mut highlighter = HighlightLines::new(syntax, theme);

    // Build a two-column layout: left gutter with numbers, right with code
    // The consumer wraps this HTML; we keep inline, minimal CSS to avoid external dependencies.
    let mut out = String::new();
    out.push_str(
        r#"<div class="dual-code-wrap" style="display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:start;">
<div class="gutter" style="text-align:right;user-select:none;opacity:.7;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">"#,
    );

    // First pass: line numbers
    let total = lines.len();
    for i in 0..total {
        let ln = i + 1;
        if i == 0 {
            out.push_str(r#"<div class="ln hl" style="padding:0 8px;background: rgba(245,158,11,0.18);">"#);
        } else {
            out.push_str(r#"<div class="ln" style="padding:0 8px;">"#);
        }
        out.push_str(&ln.to_string());
        out.push_str("</div>");
    }
    out.push_str("</div>"); // end gutter

    // Second column: highlighted code
    out.push_str(r#"<pre class="codeblock" style="margin:0"><code>"#);

    for (idx, line) in lines.iter().enumerate() {
        let mut line_with_nl = line.clone();
        line_with_nl.push('\n');

        let regions = match highlighter.highlight_line(&line_with_nl, &ss) {
            Ok(r) => r,
            Err(_) => Vec::new(),
        };

        let mut html_line: String = if regions.is_empty() {
            line.replace('&', "&").replace('<', "<").replace('>', ">")
        } else {
            match styled_line_to_highlighted_html(&regions, IncludeBackground::No) {
                Ok(s) => s,
                Err(_) => line.replace('&', "&").replace('<', "<").replace('>', ">"),
            }
        };

        if html_line.ends_with('\n') {
            html_line.pop();
        }

        if idx == 0 {
            out.push_str(r#"<div class="hl" style="background: rgba(245,158,11,0.18)"><span>"#);
            out.push_str(&html_line);
            out.push_str("</span></div>");
        } else {
            out.push_str("<div><span>");
            out.push_str(&html_line);
            out.push_str("</span></div>");
        }
    }

    out.push_str("</code></pre></div>");
    out
}

#[derive(Clone, Debug)]
struct DualState {
    left: FileBuffer,
    right: FileBuffer,
    dark_theme: bool,
}

#[derive(Default)]
pub struct DualViewerStore {
    // key: window label
    map: Mutex<std::collections::HashMap<String, DualState>>,
}

impl DualViewerStore {
    pub fn new() -> Self {
        Self {
            map: Mutex::new(std::collections::HashMap::new()),
        }
    }
}

#[derive(Deserialize)]
pub struct DualOpenArgs {
    pub window_label: String,
    pub file1: String,
    pub file2: String,
    pub dark_theme: bool,
}

#[derive(Deserialize)]
pub struct DualRequestArgs {
    pub window_label: String,
}

#[derive(Deserialize)]
pub struct DualScrollArgs {
    pub window_label: String,
    pub delta: i32, // negative for up, positive for down
}

#[derive(Serialize)]
struct DualChunkPayload {
    window_label: String,
    f1: PaneChunk,
    f2: PaneChunk,
}

#[derive(Serialize)]
struct PaneChunk {
    // absolute indices
    top_line: usize,
    highlight_line: usize,
    // rendered HTML only for the WINDOW_SIZE currently visible block
    // Contains only the slice [top_line, top_line+WINDOW_SIZE) within the cache
    html: String,
    // line numbers for each rendered line in this window (1-based absolute line numbers)
    line_numbers: Vec<usize>,
}

#[derive(Serialize)]
struct DualStatePayload {
    window_label: String,
    top1: usize,
    top2: usize,
    hl1: usize,
    hl2: usize,
}

#[tauri::command]
pub fn dual_open(
    args: DualOpenArgs,
    _window: Window,
    _state: State<'_, AppStateStore>,
    store: State<'_, DualViewerStore>,
) -> Result<(), String> {
    let left = FileBuffer::new(PathBuf::from(&args.file1)).map_err(|e| e.to_string())?;
    let right = FileBuffer::new(PathBuf::from(&args.file2)).map_err(|e| e.to_string())?;
    let mut map = store.map.lock().unwrap();
    map.insert(
        args.window_label.clone(),
        DualState {
            left,
            right,
            dark_theme: args.dark_theme,
        },
    );
    drop(map);

    // Static-export friendly: do not rely on Window/AppHandle during SSG/SSR/export.
    // Do nothing here; frontend can explicitly request chunks at runtime via dual_request.
    Ok(())
}

#[tauri::command]
pub fn dual_request(
    args: DualRequestArgs,
    window: Window,
    store: State<'_, DualViewerStore>,
) -> Result<(), String> {
    // Only emit when a real window/app is available (runtime). During static export, this command won't be called.
    emit_chunk(&window.app_handle(), &store, &args.window_label).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn dual_scroll_sync(
    args: DualScrollArgs,
    window: Window,
    store: State<'_, DualViewerStore>,
) -> Result<(), String> {
    let mut map = store.map.lock().unwrap();
    let Some(state) = map.get_mut(&args.window_label) else {
        return Err("window not found".into());
    };
    apply_delta(&mut state.left, args.delta);
    apply_delta(&mut state.right, args.delta);
    let payload = DualStatePayload {
        window_label: args.window_label.clone(),
        top1: state.left.top_line,
        top2: state.right.top_line,
        hl1: state.left.highlight_line,
        hl2: state.right.highlight_line,
    };
    window
        .app_handle()
        .emit_all("dual_state", &payload)
        .map_err(|e| e.to_string())?;
    drop(map);
    emit_chunk(&window.app_handle(), &store, &args.window_label).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn dual_scroll_f1(
    args: DualScrollArgs,
    window: Window,
    store: State<'_, DualViewerStore>,
) -> Result<(), String> {
    let mut map = store.map.lock().unwrap();
    let Some(state) = map.get_mut(&args.window_label) else {
        return Err("window not found".into());
    };
    apply_delta(&mut state.left, args.delta);
    let payload = DualStatePayload {
        window_label: args.window_label.clone(),
        top1: state.left.top_line,
        top2: state.right.top_line,
        hl1: state.left.highlight_line,
        hl2: state.right.highlight_line,
    };
    window
        .app_handle()
        .emit_all("dual_state", &payload)
        .map_err(|e| e.to_string())?;
    drop(map);
    emit_chunk(&window.app_handle(), &store, &args.window_label).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn dual_scroll_f2(
    args: DualScrollArgs,
    window: Window,
    store: State<'_, DualViewerStore>,
) -> Result<(), String> {
    let mut map = store.map.lock().unwrap();
    let Some(state) = map.get_mut(&args.window_label) else {
        return Err("window not found".into());
    };
    apply_delta(&mut state.right, args.delta);
    let payload = DualStatePayload {
        window_label: args.window_label.clone(),
        top1: state.left.top_line,
        top2: state.right.top_line,
        hl1: state.left.highlight_line,
        hl2: state.right.highlight_line,
    };
    window
        .app_handle()
        .emit_all("dual_state", &payload)
        .map_err(|e| e.to_string())?;
    drop(map);
    emit_chunk(&window.app_handle(), &store, &args.window_label).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn dual_close(
    args: DualRequestArgs,
    _window: Window,
    store: State<'_, DualViewerStore>,
) -> Result<(), String> {
    let mut map = store.map.lock().unwrap();
    map.remove(&args.window_label);
    Ok(())
}

fn apply_delta(buf: &mut FileBuffer, delta: i32) {
    if delta > 0 {
        buf.top_line = buf.top_line.saturating_add(delta as usize);
        buf.highlight_line = buf.top_line; // keep highlight at first visible
    } else if delta < 0 {
        let d = (-delta) as usize;
        buf.top_line = buf.top_line.saturating_sub(d);
        buf.highlight_line = buf.top_line; // keep highlight at first visible
    }
}

fn ensure_cache(buf: &mut FileBuffer) -> anyhow::Result<()> {
    // We want cache to cover [top_line, top_line + WINDOW_SIZE + READAHEAD*WINDOW_SIZE)
    let want_start = buf.top_line;
    let want_end = buf.top_line + WINDOW_SIZE + READAHEAD_WINDOWS * WINDOW_SIZE;
    let need_reload = buf.cache.is_empty() || want_start < buf.cache_start || want_end > buf.cache_end;

    if need_reload {
        let read_start = want_start;
        let read_end = want_end;
        let lines = read_line_range(&buf.path, read_start, read_end)?;
        buf.cache_start = read_start;
        buf.cache_end = read_start + lines.len();
        buf.cache = lines;
    }
    Ok(())
}

fn emit_chunk(app: &AppHandle, store: &State<DualViewerStore>, window_label: &str) -> anyhow::Result<()> {
    let mut map = store.map.lock().unwrap();
    let Some(state) = map.get_mut(window_label) else {
        // no state, ignore
        return Ok(());
    };

    ensure_cache(&mut state.left)?;
    ensure_cache(&mut state.right)?;

    // Slice visible window for each
    let l_from = state.left.top_line.saturating_sub(state.left.cache_start);
    let l_to = (l_from + WINDOW_SIZE).min(state.left.cache.len());
    let l_slice = if l_from < l_to { &state.left.cache[l_from..l_to] } else { &[][..] };
    // Compute line numbers for left pane (1-based absolute)
    let l_count = l_to.saturating_sub(l_from);
    let l_line_numbers: Vec<usize> = (0..l_count)
        .map(|i| state.left.top_line + i + 1)
        .collect();

    let r_from = state.right.top_line.saturating_sub(state.right.cache_start);
    let r_to = (r_from + WINDOW_SIZE).min(state.right.cache.len());
    let r_slice = if r_from < r_to { &state.right.cache[r_from..r_to] } else { &[][..] };
    // Compute line numbers for right pane (1-based absolute)
    let r_count = r_to.saturating_sub(r_from);
    let r_line_numbers: Vec<usize> = (0..r_count)
        .map(|i| state.right.top_line + i + 1)
        .collect();

    let left_html = lines_to_html(l_slice, &state.left.path, state.dark_theme);
    let right_html = lines_to_html(r_slice, &state.right.path, state.dark_theme);

    let payload = DualChunkPayload {
        window_label: window_label.to_string(),
        f1: PaneChunk {
            top_line: state.left.top_line,
            highlight_line: state.left.highlight_line,
            html: inject_highlight(left_html.clone()),
            line_numbers: l_line_numbers,
        },
        f2: PaneChunk {
            top_line: state.right.top_line,
            highlight_line: state.right.highlight_line,
            html: inject_highlight(right_html.clone()),
            line_numbers: r_line_numbers,
        },
    };

    app.emit_all("dual_chunk", &payload)?;
    Ok(())
}

//// Simple wrapper kept for compatibility; now no-op since per-line highlight is embedded.
/// We return the HTML unchanged because lines_to_html already wraps the first line.
fn inject_highlight(html: String) -> String {
    html
}