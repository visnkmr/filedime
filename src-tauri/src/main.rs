#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{io::{Read, Cursor}, thread, time::{Duration, SystemTime, UNIX_EPOCH, self, Instant}, path::{Path, self}, mem, sync::{Arc, Mutex, RwLock}, process::Command, collections::{HashSet, HashMap}, fmt::format};
mod dirsize;
mod fileitem;
mod filltrie;
mod sendtofrontend;
mod lastmodcalc;
mod navtimeline;
mod drivelist;
use chrono::{DateTime, Utc, Local};
use navtimeline::{BrowserHistory, Page};
// use filesize::PathExt;

use ignore::WalkBuilder;
use crate::driveops::*;
use crate::fileops::*;
use prefstore::*;
use rayon::prelude::*;
use reqwest::Error;
use sendtofrontend::{driveslist, lfat, sendbuttonnames, sendprogress};
use serde_json::json;
use syntect::{parsing::SyntaxSet, highlighting::ThemeSet};
use tauri::{Manager, api::{file::read_string, shell}, State, Runtime, CustomMenuItem, Menu, Submenu, MenuItem, window, GlobalWindowEvent, WindowEvent, http::ResponseBuilder};

// use walkdir::WalkDir;
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
// mod recentfiles;
mod bookmarks;
mod openhtml;
// // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod markdown;
mod listfiles;
// mod partialratio;
use lastmodcalc::lastmodified;
use crate::{
  markdown::*, 
  filechangewatcher::*,
  tabinfo::*,
  bookmarks::*,
  listfiles::*,
  openhtml::*, 
  searchfiles::*, 
   filltrie::populate_try, sendtofrontend::loadmarks
};
// mod r  esync;
mod navops;
use crate::navops::*;
mod tabops;
use crate::tabops::*;
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

use std::fs::File;
use std::io::{self,  Write, Seek, SeekFrom};

#[tauri::command]
async fn searchload(path:String,window: Window, state: State<'_, AppStateStore>) -> Result<(),String>{ 
  
  populate_try(path.clone(), &window, &state).await;
  Ok(())
}
   #[tauri::command]
async fn mirror(functionname:String,arguments: Vec<String>,window: Window){
  window.get_focused_window().unwrap().emit("mirror", serde_json::to_string(&json!({
    "functionname":functionname,
    "arguments":arguments
  })).unwrap());
}

 #[derive(Serialize)]
  struct existingfileinfo{
    sourcepath:String,
    destpath:String,
    existingfilesize:String,
    existingdate:String,
    srcfilesize:String,
    srcfiledate:String
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
async fn highlightfile(path:String,theme:String)->Result<String,String>{
  let syntax_set = SyntaxSet::load_defaults_newlines();
    let theme_set = ThemeSet::load_defaults();
    // let dark="dark".to_string();
    // let theme = "dark"; // or "light"

    let th = 
      if(theme=="dark".to_string()){
        &theme_set.themes["base16-ocean.dark"]
      }
      else{
        &theme_set.themes["base16-ocean.light"]
      };
      // &theme_set.themes["base16-ocean.light"];
  match(syntect::html::highlighted_html_for_file(&path, &syntax_set, th)){
    Ok(src) => {
      Ok(src)
    },
    Err(e) => {
      Err(e.to_string())
    },
}
 
}
#[tauri::command]
async fn openpath(path: String) -> Result<(), String> {
  println!("{}",path);
  if(is_appimage(path.clone())){
    let output = Command::new(path)
        .output()
        .expect("Failed to execute command");

    if !output.status.success() {
        eprintln!("Command executed with error: {}", String::from_utf8_lossy(&output.stderr));
    } else {
        println!("Command executed successfully: {}", String::from_utf8_lossy(&output.stdout));
    }
  }
  else
  {match(opener::open(path)){
    Ok(g)=>{
      println!("opening")
      
    },Err(e)=>{
      
      println!("error opening file")
    }
  };}
  Ok(())
}
fn is_appimage(path: String) -> bool {
  #[cfg(target_os = "linux")]
  {
    let path=Path::new(&path);
    let metadata = fs::metadata(&path).unwrap();
    let bval=if metadata.is_file() {
        if let Some(ext) = path.extension() {
            ext == "AppImage"
        } else {
            false
        }
    } else {
        false
    };
    return bval
  }
  false
}
#[cfg(target_os = "windows")]
#[tauri::command]
async fn check_if_installed(appname:&str) -> Result<bool, String> {
  let output = Command::new("cmd")
      .args(["/C", appname])
      .output()
      .expect("cmd Not found");

  Ok(output.status.success())
}
fn startup(window: &AppHandle) -> Result<(),()>{
  //define format for adding custom button as extensions to ui
  if cfg!(target_os = "linux"){

    getcustom("filedime", "custom_scripts/terminal_open.fds", "exo-open --working-directory %f --launch TerminalEmulator");
  }
  else if cfg!(target_os = "windows"){
    getcustom("filedime", "custom_scripts/terminal_open.fds", "cmd /k cd %f");
  }
  
  let mut buttonnames=Vec::new();
  // println!("{:?}",getallcustomwithin("filedime", "custom_scripts","fds"));
  for (i,j) in getallcustomwithin("filedime", "custom_scripts","fds"){
    buttonnames.push(i.clone().replace("_", " "));
    // println!("name of file{:?}",i);//filename
    // println!("{:?}",j);//contents
  }
  sendbuttonnames(&window.app_handle(),&buttonnames).unwrap();
  Ok(())
}
#[tauri::command]
async fn otb(bname:String,path:String,state: State<'_, AppStateStore>)->Result<(),()> {
  let folder_path=&path;
  // state.getactivepath(path);
  println!("{}",path);

//  #[cfg(target_os = "windows")]
//   Command::new("cmd /C %d && cd %f && start cmd")

//   #[cfg(target_os = "linux")]
//   Command::new("sh -c gnome-terminal --working-directory=%f")

  // #[cfg(not(any(target_os = "windows", target_os = "linux")))]
  // Command::new("sh -c open -a Terminal %f")

  if(!Path::new(&path).is_dir()){
    return Err(())
  }
  // let mut script1=getcustom("filedime", "custom_scripts/terminal_open.fds", "");
  let mut args = state.buttonnames.get(&bname.replace(" ","_")).unwrap().clone();
  args=args.replace("%f",&path);
  // format!("exo-open --working-directory {} --launch TerminalEmulator",path);
  let args: Vec<_> = args.split(" ").collect();
  println!("{:?}",args);

  let output = Command::new(args[0])
          .args(&args[1..])
          // .stdout(Stdio::piped())
          .spawn()
          .unwrap();
        println!("{:?}",output);
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
async fn nosize(windowname:String,togglewhat:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  // println!("loading toggle rust---->1");

  match(togglewhat.as_str()){
    "size"=>{
      state.togglenosize()
    },
    "excludehidden"=>{
      println!("togglehidden");
      state.togglehidden()
    },
    "includefolder"=>{
      state.toggleif();
    },
    "folcount"=>{
      state.togglefolcount();
    },
    "sessionsave"=>{
      savecustom("filedime", "storevals/savetabs.set", 
      {
        let truechecker=getcustom("filedime", "storevals/savetabs.set", "false");
        match(truechecker.as_str()){
        "true"=>{
            false
        },
        _=>true
        }
      });
    },
    "loadmarks"=>{
      loadmarks(&windowname, &window.app_handle(), serde_json::to_string(&state.getmarks()).unwrap());
    },
    _=>{

      }

  }
  // list_files(windowname.to_string(),id,path,"newtab".to_string(), window, state).await;
  // println!("loading toggle rust---->2");

  Ok(())
}
//manually test using ramdisk
//copies files from source to destination based on if there are any changes present



// #[tauri::command]
// fn getpathfromid(id:String,state: State<'_, AppStateStore>)->String{
//   state.gettab(&id).0
// }
// #[tauri::command]
// async fn whattoload(windowname:&str,window: Window,state: State<'_, AppStateStore>)->Result<String,()>{
//   // state.togglefolcount();
//   // state.addtab(id.clone(),"./".to_string(), "newtab".to_string(),windowname.to_string());//move to where you open new window
//   let whichpath=state.gettabfromwinlabel(&windowname.to_string()).unwrap();
//   println!("{}",whichpath.0);
//   list_files(windowname.to_string(),whichpath.1,whichpath.0.clone(),"".to_string(), window, state).await.unwrap();
//   Ok(whichpath.0)
// }
#[tauri::command]
async fn newwindow(path:String,ff:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
   let absolute_date=getuniquewindowlabel();
  // state.addtab(id.clone(), path.clone(), "newtab".to_string(),absolute_date.clone());
  let filename=PathBuf::from(path.clone());
  let mut wname="";
  if let Some(fname)=filename.file_name(){
    wname=fname.to_str().unwrap();
  }
  let nwindow=opennewwindow(&window.app_handle(),&wname,&absolute_date);
  println!("new winodw==============");
  // whattoload(&absolute_date, id, nwindow, state).await;
  // listtabs(windowname,window, state).await;
  // list_files(absolute_date.to_string(),id,path,"".to_string(), window, state).await;

  Ok(())
}
#[tauri::command]
async fn newspecwindow(winlabel:String,name:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  if(winlabel=="settings"){

    tauri::WindowBuilder::new(
      &window.app_handle(),
      winlabel,
      tauri::WindowUrl::App("settings.html".into())
    )
    // .initialization_script(&INIT_SCRIPT)
    .title(name).build().unwrap();
  }
  else{
    opennewwindow(&window.app_handle(),&name,&winlabel);
  }
  Ok(())
}

#[tauri::command]
 fn configfolpath(window:Window,state: State<'_, AppStateStore>)->String{
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
        &window,
        &state,
    ),true)),
    // "arguments":arguments
  })).unwrap()
  
}
  #[tauri::command]
fn tabname(path:String)->String{
  let p=path.clone();
  let result=
  if let Some(h)=PathBuf::from(&path).file_stem(){
    let tabname=h.to_string_lossy().to_string();
    if(tabname==""){path}else{tabname}
}
else{
    path
};
println!(" found tabname of ------> {} as {}",p,result);

result
}
#[tauri::command]
async fn foldersize(path:String,window: Window,state: State<'_, AppStateStore>)->Result<String,()>{
  let sizetosend=
  dirsize::dir_size(
      &path.to_string(),
      &window,
      &state,
  );
  Ok(sizeunit::size(sizetosend,true))
}
#[tauri::command]
async fn loadsearchlist(windowname:&str,id:String,path:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  // state.togglelsl();
  populate_try(path, &window,&state);
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
async fn checker()-> Result<String, String>{
  let url = "https://cdn.jsdelivr.net/gh/vishnunkmr/quickupdates/filedimeversion.txt";
    match(reqwest::get(url).await){
        Ok(response) => {
          
          // Ensure the response is successful
          if response.status().is_success() {
              // Read the response body as text
              let body = response.text().await.unwrap_or_default();
              println!("Response data: {}", body);
              return Ok(body)
          } else {
              println!("Failed to fetch data. Status: {}", response.status());
              Err("Could not check for updates".to_string())
          }
        },
        Err(_) => {
              Err("Could not check for updates".to_string())
        },
    }

}
fn main() {
  
  // init();
  // let open_terminal = CustomMenuItem::new("otb", "Open terminal here".to_string());
  // let reload = CustomMenuItem::new("reload", "Reload".to_string());
  // let hide_size = CustomMenuItem::new("nosize", "Hide size".to_string());
  // // let toggle_search = CustomMenuItem::new("tsearch", "Toggle search".to_string());
  // let hide_child_count = CustomMenuItem::new("folcount", "Hide child count".to_string());
  // // let back = CustomMenuItem::new("back-button", "Back".to_string());
  // // let forward = CustomMenuItem::new("forward-button", "Forward".to_string());
  // let recent = CustomMenuItem::new("recent", "Recent".to_string());
  
  // let menu = Menu::new()
  // .add_submenu(Submenu::new("File", Menu::new()
  //     // .add_item(open_terminal)
  //     .add_item(hide_size)
  //     .add_item(reload)
  //     // .add_item(toggle_search)
  //     .add_item(hide_child_count)
      
  // ))
  
  // .add_submenu(Submenu::new("Window", Menu::new()
  // .add_item(CustomMenuItem::new("close", "Close"))
 
      
  // ))

  // .add_item(CustomMenuItem::new("Learn More", "Learn More"))
  // .add_item(CustomMenuItem::new("quit", "Quit"))
   
  //   // .add_item(back)
  //   // .add_item(forward)
  //   .add_item(recent)
  //   ;
  let mut g=AppStateStore::new(CACHE_EXPIRY);

  // let mut g=Arc::new(Mutex::new(AppStateStore::new(CACHE_EXPIRY)));

  let app=tauri::Builder::default()
    .setup(|app| {
      
      // let main_window=app.get_window("main").unwrap();
      // main_window
      // .on_menu_event(|event| {
      //   match event.menu_item_id() {
      //     "reload" => {
      //       std::process::exit(0);
      //     }
      //     "close" => {
      //       // main_window.close();
      //       // event.window().close().unwrap();
      //     }
      //     "otb"=>{
      //       // otb(event.window().label(),g);
  
      //     }
      //     "Learn More" => {
      //         let url = "https://github.com/visnkmr/iomer";
      //         // shell::open(&event.shell_scope(), url.to_string(), None).unwrap();
      //       }
      //     _ => {}
      //   }
      // });
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
    // let uwl=&getuniquewindowlabel();
    // tauri::WindowBuilder::new(
    //                   &app_handle,
    //                   uwl,
    //                   tauri::WindowUrl::App("dialog.html".into())
    //                 )
                    
    //                 .inner_size(320.0, 320.0)
    //                 // .initialization_script(&INIT_SCRIPT)
    //                 .title("error")
    //                 .build()
    //                 .unwrap();
    // // let uwl=getuniquewindowlabel();
    // opendialogwindow(&app_handle, "Error #404: File not found","File not found",&uwl);
    
    // opendialogwindow(&app_handle, "dialog","",&getuniquewindowlabel() );
    let ss=startup(&app_handle).is_ok();
    if ss {
      println!("loaded buttons successfully.")
    }else{
      println!("loading buttons failed")
    }
    // let tray_id = "my-tray";
    // SystemTray::new()
    //   .with_id(tray_id)
    //   .with_menu(
    //     SystemTrayMenu::new()
    //       .add_item(CustomMenuItem::new("quit", "Quit"))
    //       .add_item(CustomMenuItem::new("open", "Open"))
    //   )
    //   .on_event({
        
    //     move |event| {
    //     match event{
    //         tauri::SystemTrayEvent::MenuItemClick { tray_id, id,.. } => {
    //         let mut gk=AppStateStore::new(CACHE_EXPIRY);
              
    //           if(id=="quit"){
                

    //             std::process::exit(0);
    //           }
    //           else{
    //             // newwindow(id, path, ff, window, state);
    //             // println!("{:?}",gk);
    //             let absolute_date=getuniquewindowlabel();
    //             opennewwindow(&app_handle,"uio",&absolute_date);

    //             // tauri::Builder::new()
    //             // // .manage(gk)
    //             // .invoke_handler(
    //             //   tauri::generate_handler![
    //             //     list_files,
    //             //     ]
    //             //   )
    //             // .run(tauri::generate_context!())
    //             // .expect("error while running tauri application");
    //           }  
    //         },
    //         _ =>{
    //           //on right click on tray icon on windows this is triggered.
    //         },
    //     }
    //     // let tray_handle = app_handle.tray_handle_by_id(tray_id).unwrap();
        
    //   }
    // })
      // .build(app)?;
    
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
    // .menu(menu)
    // .on_menu_event(|event| {
    //   match event.menu_item_id() {
    //     "quit" => {
    //       std::process::exit(0);
    //     }
    //     "close" => {
    //       event.window().close().unwrap();
    //     }
    //     "reload"=>{
    //       event.window().emit("reloadlist","reload").unwrap();
    //       // otb(event.window().label(),g);
    //     }
    //     "nosize"=>{
    //       event.window().emit("reloadlist","nosize").unwrap();
    //       // otb(event.window().label(),g);
    //     }
    //     "folcount"=>{
    //       event.window().emit("reloadlist","folcount").unwrap();
    //     }
    //     "recent"=>{
    //       event.window().emit("reloadlist","recent").unwrap();
    //     }
    //     // "tsearch"=>{
    //     //   event.window().emit("reloadlist","tsearch").unwrap();
    //     // }
    //     "Learn More" => {
    //         let url = "https://github.com/visnkmr/iomer";
    //         shell::open(&event.window().shell_scope(), url.to_string(), None).unwrap();
    //       }
    //     _ => {}
    //   }
    // })
    .on_window_event(on_window_event)
  //   .register_uri_scheme_protocol("image", move |app, request| {
  //     let res_not_img = ResponseBuilder::new()
  //       .status(404)
  //       .body(Vec::new());
  
  //     if request.method() != "GET" { return res_not_img; }
  
  //     let uri = request.uri();
  
  //     // Parse the URI to get the image file path, width, height, and quality
  //     // This depends on the exact format of your URIs
  //     let params = parse_uri(uri);
  //     let ag1="/home/roger/Downloads/scrsht.png".to_string();
  //     let img_path = params.get("path").unwrap_or(&ag1);
  //     let width = params.get("width").unwrap_or(&"100".to_string()).parse::<u32>().unwrap_or(100);
  //     let height = params.get("height").unwrap_or(&"100".to_string()).parse::<u32>().unwrap_or(100);
  //     let quality = params.get("quality").unwrap_or(&"40".to_string()).parse::<u8>().unwrap_or(40);
  
  //     // Open the image file
  //     let img = image::open(img_path).unwrap();
  
  //     // Resize and adjust the quality
  //     let img = img.resize(width, height, image::imageops::FilterType::Nearest);
  //     let mut buffer = Cursor::new(Vec::new());
  //     img.write_to(&mut buffer, image::ImageOutputFormat::Jpeg(quality)).unwrap();
  
  //     // Create the HTTP response
  //     ResponseBuilder::new()
  //      .mimetype("image/png")
  //      .body(buffer.into_inner())
  //     //  .unwrap();
  //  })
    .manage(g)
    .invoke_handler(
      tauri::generate_handler![
        // getpathfromid,
        configfolpath,
        listtabs,
        closealltabs,
        getparentpath,
        mirror,
        fileop_with_progress,
        addmark,
        fileop,
        checkforconflicts,
        // backbutton,
        closetab,
        new,
        disablenav,
        searchload,
        // defaulttoopen,
        foldersize,
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
        ]
      )
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
async fn getparentpath(mut path: String, window: Window, state: State<'_, AppStateStore>) -> Result<String,()> {
  match(PathBuf::from(&path).parent()){
    Some(k) => return Ok(k.to_string_lossy().to_string()),
    None => return Err(()),
}
  
}
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
  // let searchthrough=state.stl.lock().unwrap();
  // let map=searchthrough.clone();
  // let filescount=map.len();
  // drop(searchthrough);

  // for i in map{
  //   for j in i.1{

  //     options.push(j)
  //   }
  // }
  
  // println!("{:?}",k.find_all(&path));
  // println!("{:?}",options);
  Ok(options)
}
          // Use substring instead of path
     // In Rust, define a function that takes a path as an argument and returns a list of possible paths
pub fn opennewwindow(app_handle:&AppHandle,title:&str,label:&str)->Window{
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
                .title(title).build().unwrap()
}

pub fn opendialogwindow(app_handle:&AppHandle,title:&str,content:&str,label:&str){
  // println!("{:?}",getwindowlist(app_handle));
  // let menu = Menu::new();

  // // let INIT_SCRIPT= [r#"
  // //             console.log("poiu");
  // //              let kpg="#,pathtt,r#"
  // //                 "#].concat();
  // println!("create window ======>{}",label);
  //               tauri::WindowBuilder::new(
  //                 app_handle,
  //                 label,
  //                 tauri::WindowUrl::App("dialog.html".into())
  //               )
                
  //               .inner_size(320.0, 320.0)
  //               .menu(menu)
  //               // .initialization_script(&INIT_SCRIPT)
  //               .title(title)
  //               .build()
  //               .unwrap();
  //             println!("dialog opened ======>{}",label);
              app_handle.emit_all(
                // label,
                "dialogshow",
                serde_json::to_string(&json!({
                  "title":title,
                  "content":content,
                  // "arguments":arguments
                })).unwrap(),
              ).unwrap();
              
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
  match(app_handle.get_window("main")){
    Some(iop) => {
      iop.windows().iter().map(|e|{
        // println!("{}--",e.0);
        // println!("{}--{:?}",i.0,i.1);
        e.0.clone()
      }).collect::<Vec<String>>()
      
    },
    None => {
      vec![]
    },
}
  
}
// #[tauri::command]
fn getuniquewindowlabel()->String{
  let now = SystemTime::now();

                let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
                let absolute_date = now_date.format("%d%m%H%M%S").to_string();
                // println!("{absolute_date}");
                absolute_date
}

