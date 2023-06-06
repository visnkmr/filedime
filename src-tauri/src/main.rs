#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{io::Read, thread, time::{Duration, SystemTime, UNIX_EPOCH, self, Instant}, path::{Path, self}, mem, sync::{Arc, Mutex, RwLock}, process::Command, collections::HashSet};
mod dirsize;
mod fileitem;
mod filltrie;
mod sendtofrontend;
use chrono::{DateTime, Utc, Local};
use filesize::PathExt;
use rayon::prelude::*;
use tauri::{Manager, api::file::read_string, State, Runtime, SystemTray, SystemTrayMenu, CustomMenuItem, Menu, Submenu, MenuItem, window};
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
mod recentfiles;
mod bookmarks;
mod openhtml;
// // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod markdown;
mod lastmodcalc;
mod listfiles;
// mod partialratio;
use crate::{
  markdown::*, 
  filechangewatcher::*,
  tabinfo::*,
  bookmarks::*,
  listfiles::*,
  openhtml::*, 
  searchfiles::*, 
  recentfiles::*
};
mod trie;
// mod r  esync;



// define a struct to represent a file or directory
#[derive(Serialize,Clone,Debug,PartialEq,Hash,Eq)]
pub struct FileItem {
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
async fn backbutton(oid:String,window: Window, state: State<'_, AppStateStore>) -> 
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
async fn otb(path:String) {
  // state.getactivepath(path);
  println!("{}",path);
  let args = format!("exo-open --working-directory {} --launch TerminalEmulator",path);
  let args: Vec<_> = args.split(" ").collect();

  let output = Command::new(args[0])
          .args(&args[1..])
          // .stdout(Stdio::piped())
          .spawn()
          .unwrap();
        println!("{:?}",output);
}
// #[tauri::command]
// fn get_window_label() -> String {
//   let window = tauri::Window::current().unwrap();
//   window.label().to_string()
// }
#[tauri::command]
async fn nosize(windowname:&str,id:String,path:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.togglenosize();
  list_files(windowname.to_string(),id,path,"newtab".to_string(), window, state).await;
  Ok(())
}

#[tauri::command] 
async fn folcount(windowname:&str,id:String,path:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.togglefolcount();
  list_files(windowname.to_string(),id,path,"newtab".to_string(), window, state).await;
  Ok(())
}

#[tauri::command]
async fn whattoload(windowname:&str,id:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  // state.togglefolcount();
  // state.addtab(id.clone(),"./".to_string(), "newtab".to_string(),windowname.to_string());//move to where you open new window
  let whichpath=state.gettab(&id).0;
  println!("{}",whichpath);
  list_files(windowname.to_string(),id,whichpath,"".to_string(), window, state).await;
  Ok(())
}
#[tauri::command]
async fn newwindow(id:String,path:String,ff:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
   let absolute_date=getuniquewindowlabel();
  state.addtab(id.clone(), path.clone(), "newtab".to_string(),absolute_date.clone());
  let filename=PathBuf::from(path.clone());
  let mut wname="";
  if let Some(fname)=filename.file_name(){
    wname=fname.to_str().unwrap();
  }
  opennewwindow(&window.app_handle(),&wname,&absolute_date);
  // listtabs(windowname,window, state).await;
  // list_files(absolute_date.to_string(),id,path,"".to_string(), window, state).await;

  Ok(())
}

#[tauri::command]
async fn loadsearchlist(windowname:&str,id:String,path:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.togglelsl();
  list_files(windowname.to_string(),id,path,"newtab".to_string(), window, state).await;
  Ok(())
}

fn main() {
  // let open_terminal = CustomMenuItem::new("otb", "Open terminal here".to_string());
  // let reload = CustomMenuItem::new("reload", "Reload".to_string());
  // let hide_size = CustomMenuItem::new("no-size", "Hide size".to_string());
  // let toggle_search = CustomMenuItem::new("t-search", "Toggle search".to_string());
  // let hide_child_count = CustomMenuItem::new("fol-count", "Hide child count".to_string());
  // let back = CustomMenuItem::new("back-button", "Back".to_string());
  // let forward = CustomMenuItem::new("forward-button", "Forward".to_string());
  // let recent = CustomMenuItem::new("recent", "Recent".to_string());
  
  let menu = Menu::new()
  // .add_submenu(Submenu::new("File", Menu::new()
  //     .add_item(open_terminal)
  //     .add_item(reload)
  //     .add_item(hide_size)
      
  // ))
  .add_submenu(Submenu::new("Window", Menu::new()
  .add_item(CustomMenuItem::new("close", "Close"))
      
  ))
  .add_item(CustomMenuItem::new("custom", "Custom"))
  .add_item(CustomMenuItem::new("quit", "Quit"))
    // .add_item(toggle_search)
    // .add_item(hide_child_count)
    // .add_item(back)
    // .add_item(forward)
    // .add_item(recent)
    ;
  let mut g=AppStateStore::new(CACHE_EXPIRY);

  // let mut g=Arc::new(Mutex::new(AppStateStore::new(CACHE_EXPIRY)));

  tauri::Builder::default()
    .setup(|app| {
      // println!("{:?}",app);
      
      // let handle = app.handle();
    // std::thread::spawn(move || {
    //   let window = tauri::WindowBuilder::new(
    //     &handle,
    //     "label",
    //     tauri::WindowUrl::App("index.html".into())
    //   ).build().unwrap();
    // });
    // let window = tauri::WindowBuilder::new(app, "label", tauri::WindowUrl::App("index.html".into()))
    // .build()
    // .unwrap();
    let app_handle = app.handle();
    let tray_id = "my-tray";
    SystemTray::new()
      .with_id(tray_id)
      .with_menu(
        SystemTrayMenu::new()
          .add_item(CustomMenuItem::new("quit", "Quit"))
          .add_item(CustomMenuItem::new("open", "Open"))
      )
      .on_event({
        
        move |event| {
        match event{
            tauri::SystemTrayEvent::MenuItemClick { tray_id, id,.. } => {
            let mut gk=AppStateStore::new(CACHE_EXPIRY);
              
              if(id=="quit"){
                

                std::process::exit(0);
              }
              else{
                // println!("{:?}",gk);
                let absolute_date=getuniquewindowlabel();
                opennewwindow(&app_handle,"uio",&absolute_date)

                
                // tauri::Builder::new()
                // // .manage(gk)
                // .invoke_handler(
                //   tauri::generate_handler![
                //     list_files,
                //     ]
                //   )
                // .run(tauri::generate_context!())
                // .expect("error while running tauri application");
              }  
            },
            _ =>{
              //on right click on tray icon on windows this is triggered.
            },
        }
        // let tray_handle = app_handle.tray_handle_by_id(tray_id).unwrap();
        
      }
    })
      .build(app)?;
    
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
    .menu(menu)
    .on_menu_event(|event| {
      match event.menu_item_id() {
        "quit" => {
          std::process::exit(0);
        }
        "close" => {
          event.window().close().unwrap();
        }
        "otb"=>{
          // otb(event.window().label(),g);

        }
        _ => {}
      }
    })
    .manage(g)
    .invoke_handler(
      tauri::generate_handler![
        list_files,
        loadmarkdown,
        get_path_options,
        openpath,
        nosize,
        folcount,
        loadsearchlist,
        newtab,
        load_tab,
        backbutton,
        addmark,
        closetab,
        removemark,
        startserver,
        loadfromhtml,
        whattoload,
        stopserver,
        search_try,
        recent_files,
        newwindow,
        otb
        // get_window_label
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
pub fn opennewwindow(app_handle:&AppHandle,title:&str,label:&str){
  println!("{:?}",getwindowlist(app_handle));

  // let INIT_SCRIPT= [r#"
  //             console.log("poiu");
  //              let kpg="#,pathtt,r#"
  //                 "#].concat();
                tauri::WindowBuilder::new(
                  app_handle,
                  label,
                  tauri::WindowUrl::App("index.html".into())
                )
                // .initialization_script(&INIT_SCRIPT)
                .title(title).build().unwrap();
}
// pub fn opennewtab(app_handle:&AppHandle,title:&str,pathtt:&str){
//                 let now = SystemTime::now();
                

//                 let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
//                 let absolute_date = now_date.format("%d%m%H%M%S").to_string();
//                 println!("{absolute_date}");
//                 tauri::WindowBuilder::new(
//                   app_handle,
//                   absolute_date,
//                   tauri::WindowUrl::App("index.html".into())
//                 )
//                 .title(title).build().unwrap();
// }

pub fn getwindowlist(app_handle:&AppHandle)->Vec<String>{
  let iop=app_handle.get_window("main").unwrap();
  iop.windows().iter().map(|e|{
    // println!("{}--",e.0);
    // println!("{}--{:?}",i.0,i.1);
    e.0.clone()
  }).collect::<Vec<String>>()
}
fn getuniquewindowlabel()->String{
  let now = SystemTime::now();

                let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
                let absolute_date = now_date.format("%d%m%H%M%S").to_string();
                // println!("{absolute_date}");
                absolute_date
}

