#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{io::Read, thread, time::{Duration, SystemTime, UNIX_EPOCH, self, Instant}, path::Path, mem, sync::{Arc, Mutex}, process::Command, collections::HashSet};
mod dirsize;
use filesize::PathExt;
use partialratio::partial_ratio;
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
mod searchfiles;
mod filechangewatcher;
// mod loadjs;
mod tabinfo;
mod bookmarks;
mod openhtml;
// // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod markdown;
mod lastmodcalc;
mod listfiles;
mod partialratio;
use crate::{
  markdown::*, 
  filechangewatcher::*,
  tabinfo::*,
  bookmarks::*,
  listfiles::*,
  openhtml::*
};
mod trie;
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
        stopserver,
        search_try
        ]
      )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
// In Rust, define a function that takes a path as an argument and returns a list of possible paths
#[tauri::command]
async fn get_path_options(mut path: String, window: Window, state: State<'_, AppStateStore>) -> Result<Vec<String>,()> {
  let mut options = Vec::new();
  let pathasbuf=PathBuf::from(path.clone());
  if(!pathasbuf.exists()){
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
  
  // println!("{:?}",k.find_all(&path));
  // println!("{:?}",options);
  Ok(options)
}// In Rust, define a function that takes a path as an argument and returns a list of possible paths
#[tauri::command]
async fn  search_trie(path:String,string: String, state: State<'_, AppStateStore>)->Result<(),()>
{
  let st=state.st.clone();
      let mut st=st.lock().unwrap();
  let string=string.to_lowercase();
  // println!("fs-----{:?}",st.fuzzy_search(&string,2,5));
  // println!("fs-----{:?}",st.fuzzy_search(&string,2,5).len());
  // println!("s--------{:?}",st.search(&string));
  let tl=parallel_search(st.search(&string,path),string);
  println!("s--------{:?}",tl.len());
  if(tl.len()<30){
    println!("{:?}",tl);
  }
  Ok(())
}
#[tauri::command]
async fn  search_try(path:String,string: String, state: State<'_, AppStateStore>)->Result<(),()>
//  -> Vec<String> 
 {
  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("hs----{}",startime);
  let string=string.to_lowercase();
  // search_trie(path,string, state).await;
  // return Ok(());
  
  // thread::spawn({
    // let st=state.searchtry.clone();
    // let vecj=st.lock().unwrap().clone();
    // drop(st);
    // // move||{
    // let strings=parallel_search(vecj,string);
    let mut map=state.stl.lock().unwrap();
    // let mut gh=Vec::new();
    // let mut ret:HashSet<String>=HashSet::new();
    let gh:Vec<String>=map.clone().par_iter().
    filter(|(i,_)|
      i.contains(&string)).
    map(|(i,_)|{
        // if i.contains(&string){
          i.clone()
        // }
      }).collect();
    // for (i,_) in map.clone(){
    //   // gh.push(i);
    //   if i.contains(&string){
    //     gh.push(i.clone());
    //   }
    // }
    let o=map.clone();
    let ret:HashSet<String>=gh.par_iter().flat_map(|u|{
      let y=o.get(u).unwrap();
      // let f:Vec<String>=
      y.par_iter()
      // .map(|t|{
        // t.clone()
      // }).collect();
      // f
    }).cloned().collect();

    // for i in gh{
    //   let y=o.get(&i.clone()).unwrap();
    //   for j in y{
    //     ret.insert(j.clone());
    //   }
    // }
    println!("{:?}",ret.len());
    if(ret.len()<10){
      println!("{:?}",ret);
    }
    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}",endtime-startime);

  // }
//  });
 Ok(())
  // strings
  
  // println!("{:?}",options);
  // options
}
// Define a function that takes a vector of strings and a string as parameters
fn parallel_search(k: HashSet<String>, h: String) -> Vec<String> {
  // while true{

  // };
  // Create a parallel iterator over the vector k
  k.par_iter()
      // Filter out the elements that do not contain h
      .filter(|s| 
        partial_ratio(s, &h)>80
        // s.contains(&h)
      )
      // .filter(|s| s.contains(&h))
      // Collect the filtered elements into a new vector
      .cloned()
      .collect()
}
