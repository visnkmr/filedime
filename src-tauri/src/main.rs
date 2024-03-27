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
mod filltrie;
mod lastmodcalc;
mod navtimeline;
mod sendtofrontend;
use chrono::{DateTime, Local, Utc};
use local_ip_address::local_ip;
// use get_size::GetSize;
use navtimeline::{BrowserHistory, Page};
// use filesize::PathExt;

use crate::driveops::*;
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
    openhtml::*, searchfiles::*, sendtofrontend::loadmarks, tabinfo::*,
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
fn filegptendpoint(endpoint: String) -> Result<String, String> {
    if (endpoint == "") {
        Ok(getcustom(
            "filedime",
            "gpt/filegpt.endpoint",
            "http://localhost:8694",
        ))
    } else {
        savecustom("filedime", "gpt/filegpt.endpoint", endpoint.clone());
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
fn startup(window: &AppHandle) -> Result<(), ()> {
    //define format for adding custom button as extensions to ui
    if cfg!(target_os = "linux") {
        // getcustom(
        //     "filedime",
        //     "custom_scripts/terminal_open.fds",
        //     "exo-open --working-directory %f --launch TerminalEmulator",
        // );
    } else if cfg!(target_os = "windows") {
        getcustom(
            "filedime",
            "custom_scripts/terminal_open.fds",
            "cmd /k cd %f",
        );
    }

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
#[tauri::command]
async fn otb(bname: String, path: String, state: State<'_, AppStateStore>) -> Result<(), ()> {
    // state.getactivepath(path);
    println!("{}", path);

    if (!Path::new(&path).is_dir()) {
        return Err(());
    }
    let mut args = state
        .buttonnames
        .get(&bname.replace(" ", "_"))
        .unwrap()
        .clone();
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
    if (winlabel == "settings") {
        tauri::WindowBuilder::new(
            &window.app_handle(),
            winlabel,
            tauri::WindowUrl::App("settings.html".into()),
        )
        .title(name)
        .build()
        .unwrap();
    } else {
        opennewwindow(&window.app_handle(), &name, &winlabel);
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
    let url = "https://cdn.jsdelivr.net/gh/vishnunkmr/quickupdates/filedimeversion.txt";
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
fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();
    let request = String::from_utf8_lossy(&buffer[..]);
    println!("Request: {}", request);
    // Assuming the request format is "GET /filename HTTP/1.1\r\n", extract filename
    let mut filename = request.split_whitespace().nth(1).unwrap_or("/");
    filename = filename.trim_start_matches('/');
    // println!("---->{}----",filename);
    if (filename.is_empty()) {
        filename = ("filegpt.html");
    }

    // Check if the file exists and is readable
    if PROJECT_DIR.contains(filename) {
        let contents = PROJECT_DIR.get_file(filename).unwrap();
        let response = format!(
            "HTTP/1.1  200 OK\r\nContent-Length: {}\r\n\r\n{}",
            contents.contents().len(),
            contents.contents_utf8().unwrap()
        );
        stream.write(response.as_bytes()).unwrap();
        stream.flush().unwrap();
    } else {
        let response = "HTTP/1.1  404 NOT FOUND\r\n\r\n";
        stream.write(response.as_bytes()).unwrap();
        stream.flush().unwrap();
    }
}
use include_dir::{include_dir, Dir};

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
            handle_connection(_stream);
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
