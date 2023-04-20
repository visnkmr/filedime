// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{io::Read, thread, time::Duration};

use tauri::{Manager, api::file::read_string};
// #[tauri::command] // add this attribute
// fn read_and_emit(app_handle: tauri::AppHandle) -> Result<(), String> { // change return type to Result
//   let content = read_string("/home/roger/.config/LogLinktoDisk/links.md").unwrap(); // use ? instead of unwrap
//   app_handle.emit_to(
//     "main",
//     "message", 
//     content
//   )
//   .map_err(|e| e.to_string()) // convert error to string
// }
// // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn loadmarkdown(name: &str) -> String {
    let mut content=String::new();

    // let mut file = std::fs::File::open("/home/roger/.config/LogLinktoDisk/links.md").unwrap();
    let mut file = std::fs::File::open(name).unwrap();

    file.read_to_string(&mut content).unwrap();
    markdown::to_html_with_options(
        &content ,
        &markdown::Options::gfm()
    ).unwrap()
    // format!("Hello, {}! You've been greeted from Rust!", name)
}

// fn main()->Result<(),()> {
    

//     tauri::Builder::default()
//     .setup(|app| {
//                 // get an instance of AppHandle
//                 let app_handle = app.handle();
//                 thread::spawn(move||{
//                 read_and_emit(app_handle).unwrap(); // call the command function
//                 thread::sleep(Duration::from_secs(3));
//             });
//         Ok(())
//     })
//     .invoke_handler(tauri::generate_handler![loadmarkdown])
//     .run(tauri::generate_context!())
//     .expect("error while running tauri application");

//     Ok(())
// }
// src-tauri/src/main.rs

use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tauri::{AppHandle,  Window};
mod filesize;
use filesize::*;
mod sizeunit;

// define a struct to represent a file or directory
#[derive(Serialize,Clone,Debug)]
struct FileItem {
  name: String,
  path: String,
  is_dir: bool,
  size:String,
  granparent:String,
  parent:String,
  parentsize:String
}
const CACHE_EXPIRY:u64=60;

// define a command to list the files and directories in a given path
#[tauri::command]
async fn list_files(path: String, window: Window) -> Result<serde_json::Value, String> {
  // get the app handle from the window
 
  let app_handle = window.app_handle();
  // convert the path to a PathBuf
  let path = PathBuf::from(path);
let parent=path.clone();
//    let mut finder = ;
  // check if the path exists and is a directory
  if path.exists() && path.is_dir() {
    // read the entries in the directory
    match fs::read_dir(&path) {
      Ok(entries) => {
        // create an empty vector to store the file items
        let mut files = Vec::new();
        // loop through the entries
        for entry in entries {
          // get the metadata of the entry
          if let Ok(metadata) = entry.as_ref().unwrap().metadata() {
            // get the name and path of the entry
            let name = entry.as_ref().unwrap().file_name().into_string().unwrap();
            let path = entry.as_ref().unwrap().path().to_string_lossy().into_owned();
            // check if the entry is a file or a directory
            let is_dir = metadata.is_dir();
            // create a file item from the entry data
            let file = FileItem { 
                name,
                path:path.clone(),
                is_dir,
                size:sizeunit::size(FileSizeFinder::new(CACHE_EXPIRY).find_size(&path),true),
                granparent:parent.parent().unwrap().to_string_lossy().to_string(),
                parent:parent.to_string_lossy().to_string(),
                parentsize:sizeunit::size(FileSizeFinder::new(CACHE_EXPIRY).find_size(&parent.to_string_lossy().to_string()),true)
            };
            // push the file item to the vector
            files.push(file);
          }
        }
        // sort the vector by name
        files.sort_by(|a, b| a.name.cmp(&b.name));
        // emit an event to the frontend with the vector as payload
        println!("{:?}",serde_json::to_string(&files.clone()).unwrap());
        app_handle.emit_to(
          "main",
          "list-files",
          serde_json::to_string(&files.clone()).unwrap(),
        )
        .map_err(|e| e.to_string())?;
        // return Ok with the vector
        Ok(serde_json::to_value(&files.clone()).unwrap())
      },
      Err(e) => {
        // return Err with the error message
        Err(e.to_string())
      }
    }
  } else {
    // return Err with an invalid path message
    Err("Invalid path".to_string())
  }
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // get an instance of AppHandle
    //   let app_handle = app.handle();
      // spawn a thread to list the files in the current directory on startup
    //   std::thread::spawn(move || {
    //     list_files(".".to_string(), app_handle.get_window("main").unwrap());
    //   });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        list_files,
        loadmarkdown
        ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}