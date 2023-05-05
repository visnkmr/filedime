#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{io::Read, thread, time::{Duration, SystemTime, UNIX_EPOCH, self, Instant}, path::Path, mem, sync::{Arc, Mutex}, process::Command};
mod dirsize;
use filesize::PathExt;
use rayon::prelude::*;
use tauri::{Manager, api::file::read_string, State, Runtime};
use walkdir::WalkDir;
use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tauri::{AppHandle,  Window};
mod appstate;
use appstate::*;
mod sizeunit;
mod trie;
mod filechangewatcher;
// mod loadjs;
mod tabinfo;
mod bookmarks;
mod openhtml;
// // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod markdown;
mod lastmodcalc;
mod listfiles;
use crate::{
  markdown::*, 
  filechangewatcher::*,
  tabinfo::*,
  bookmarks::*,
  listfiles::*,
  openhtml::*
};
mod resync;



// define a struct to represent a file or directory
#[derive(Serialize,Clone,Debug)]
struct FileItem {
  name: String,
  path: String,
  is_dir: bool,
  size:String,
  rawfs:u64,
  lmdate:String,
  timestamp:i64,
  foldercon:i32,
  ftype:String
  // grandparent:String,
  // parent:String
}
const CACHE_EXPIRY:u64=60;

// define a command to list the files and directories in a given path
#[tauri::command]
async fn back(oid:String,window: Window, state: State<'_, AppStateStore>) -> 
  Result<String, String> 
  {
    match(state.getlasthistory(oid)){
      Some(val)=>{
          return Ok(val)
      },
      None=>{
        return Err("no more history".to_string());
      }
    }
    
  }


#[tauri::command]
async fn openpath(path: String) -> Result<(), String> {
  println!("{}",path);
  match(opener::open(path)){
    Ok(g)=>{
      println!("opening")
      
    },Err(e)=>{
      
      println!("error opening file")
    }
  };
  Ok(())
}

#[tauri::command]
async fn nosize(id:String,path:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.nosize();
  list_files(id,path,"newtab".to_string(), window, state).await;
  Ok(())
}

fn main() {
  let mut g=AppStateStore::new(CACHE_EXPIRY);
  tauri::Builder::default()
    .setup(|app| {
      // get an instance of AppHandle
      // let app_handle = app.handle().get_window("main").unwrap();
      // let g=app.state::<FileSizeFinder>();
    //   // spawn a thread to list the files in the current directory on startup
    // //   std::thread::spawn(move || {
    // //     list_files(".".to_string(), app_handle.get_window("main").unwrap());
    // //   });
    //   // set the window flags to remove WS_MAXIMIZEBOX
    //   app_handle.set_window_flags(|flags| flags & !WS_MAXIMIZEBOX)?;
    
      Ok(())
    })
    .manage(g)
    .invoke_handler(
      tauri::generate_handler![
        list_files,
        loadmarkdown,
        get_path_options,
        openpath,
        nosize,
        newtab,
        load_tab,
        back,
        addmark,
        closetab,
        removemark,
        startserver,
        loadfromhtml,
        stopserver
        ]
      )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
// In Rust, define a function that takes a path as an argument and returns a list of possible paths
#[tauri::command]
fn get_path_options(mut path: String) -> Vec<String> {
  let mut options = Vec::new();
  let pathasbuf=PathBuf::from(path.clone());
  if(!pathasbuf.exists()){
    if let Some(parent) = pathasbuf.parent() {
      // Convert parent to OsStr
      path = parent.as_os_str().to_string_lossy().to_string();
    }
  }
          // Use substring instead of path
      if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries {
          if let Ok(entry) = entry {
            {
                options.push(entry.path().to_string_lossy().to_string());
            }
          }
        }
  }
  println!("{:?}",options);
  options
}
