#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{io::Read, thread, time::{Duration, SystemTime, UNIX_EPOCH, self, Instant}, path::Path, mem, sync::{Arc, Mutex}};
mod yu;
use filesize::PathExt;
use rayon::prelude::*;
use tauri::{Manager, api::file::read_string, State, Runtime};
use walkdir::WalkDir;
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
fn loadmarkdown(name: String, window: Window,g:State<FileSizeFinder>) -> String {
    let mut content=String::new();
    let app_handle = window.app_handle();
    let path=PathBuf::from(name.clone());
    let parent=path.clone();

    // let mut file = std::fs::File::open("/home/roger/.config/LogLinktoDisk/links.md").unwrap();
    let mut file = std::fs::File::open(name).unwrap();
    
  
  app_handle.emit_to(
      "main",
      "folder-size",
      {
        sizeunit::size(g.find_size(&path.to_string_lossy()),true)
      },
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send file size"));
  
  app_handle.emit_to(
      "main",
      "grandparent-loc",
      parent.parent().unwrap().to_string_lossy().to_string(),
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send grandparentloc"));
  
  app_handle.emit_to(
      "main",
      "parent-loc",
      parent.to_string_lossy().to_string(),
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send parent loc"));
  file.read_to_string(&mut content).unwrap();
  let htmformd=markdown::to_html_with_options(
      &content ,
      &markdown::Options::gfm()
  ).unwrap();

  app_handle.emit_to(
      "main",
      "load-markdown",
      &htmformd,
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send parent loc"));

  htmformd
    
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
mod fsize;
use fsize::*;
mod sizeunit;

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
async fn back(oid:String,window: Window, state: State<'_, FileSizeFinder>) -> 
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
async fn load_tab(oid:String,window: Window, state: State<'_, FileSizeFinder>) -> Result<(), String> {
  let (path,_,_)=state.gettab(oid.clone());
  println!("loadtab");
  list_files(oid, path, "newtab".to_string(), window, state).await?;
Ok(())
}
#[tauri::command]
async fn list_files(oid:String,path: String,ff:String, window: Window, state: State<'_, FileSizeFinder>) -> Result<(), String> {
  // println!("{}",path);
  println!("lfiles");
  let testpath=PathBuf::from(path.clone());
  // println!("{}",testpath.);
 
  

  if(path.ends_with(".md")){
    loadmarkdown(path,window,state);
    return Ok(());
  }

  if(testpath.is_file()){
    openpath(path).await?;
    return Ok(());
  }

  if(!testpath.is_dir()){

    return Ok(())
  }
  else{
    match(testpath.read_dir()){
      Ok(mut k)=>{
        if(k.next().is_none()){
          println!("path empty.");
          return Ok(());
        }
      },
      Err(_)=>{

      }
    }
  } 
  // state.addtab(oid, path.clone(), ff);
  newtab(oid.clone(), path.clone(), ff.clone(), window.clone(), state.clone()).await;
  
  // convert the path to a PathBuf
  let path = PathBuf::from(path);
let parent=path.clone();
  let app_handle = window.app_handle();

  app_handle.emit_to(
    "main",
    "parent-loc",
    parent.to_string_lossy().to_string(),
  )
  .map_err(|e| e.to_string()).unwrap();
println!("parent------{:?}",parent.to_string_lossy().to_string());
  let now = SystemTime::now();
  
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  
  let startime = duration.as_secs();
  
  println!("{:?}----{}",parent,startime);

  // get the app handle from the window
 
  let app_handle2 = app_handle.clone();
  app_handle.emit_to(
    "main",
    "start-timer",
    "",
  )
  .map_err(|e| e.to_string())?; 

app_handle.emit_to(
    "main",
    "load-hist",
    serde_json::to_string(&state.gettab(oid).2).unwrap(),
  )
  .map_err(|e| e.to_string())?;


let fcount=fs::read_dir(&path).unwrap().count();
// println!("folders---{}",fcount);
app_handle.emit_to(
  "main",
  "folder-count",
  fcount,
)
.map_err(|e| e.to_string())?;
app_handle.emit_to(
  "main",
  "grandparent-loc",
  parent.parent().unwrap().to_string_lossy().to_string(),
)
.map_err(|e| e.to_string())?;


// let mut tfsize=0;
let files = Arc::new(Mutex::new(Vec::<FileItem>::new())); 
let files_clone = Arc::clone(&files); 
let tfsize=Arc::new(Mutex::<u64>::new(0));
let tfsize_clone=tfsize.clone();
// let (tx, rx) = mpsc::channel();
let update:Vec<u64>=vec![1,2,5,7,10,20,40,65,90,120];
// spawn a new thread to print the value of the files vector every 200 milliseconds
let handle=thread::spawn(move || {
  
  let mut last_print = Instant::now(); // initialize the last print time to the current time
  loop {
    let msval=update.iter().next().unwrap_or(&120);

      if last_print.elapsed() >= Duration::from_millis(*msval) { 
        // check if 200 milliseconds have passed since the last print
          let files = files_clone.lock().unwrap();
            //           // push the file item to the vector
            // totsize+=mem::size_of_val(&file);
  //           // totsize+=mem::size_of_val(&name);
  //           // totsize+=mem::size_of_val(&path);
  //           // totsize+=mem::size_of_val(&is_dir);
  //           // totsize+=mem::size_of_val(&tr);
  //           // totsize+=mem::size_of_val(&size);
  //           // totsize+=mem::size_of_val(&lmdate);
  //           // totsize+=mem::size_of_val(&timestamp);
  //           // totsize+=mem::size_of_val(&foldercon);
            match(files.last()){
              Some(file)=>{
                // println!("{} out of {} \t---{}",files.len(),fcount,file.name);

              },
              None=>{

              }
            }
            app_handle2.emit_to(
              "main",
              "list-files",
              serde_json::to_string(&files.clone()).unwrap(),
            )
            .map_err(|e| e.to_string()).unwrap();
          
          app_handle2.emit_to(
              "main",
              "folder-size",
              {
                sizeunit::size(*tfsize.lock().unwrap(),true)
              },
            )
            .map_err(|e| e.to_string()).unwrap();
          if(fcount==files.len()){
            break;
          }
   // lock the mutex and get a reference to the vector
          // println!("Files: {:?}", files); // print the vector value
          last_print = Instant::now(); // update the last print time to the current time
      }
      thread::sleep(Duration::from_millis(30)); // sleep for 10 milliseconds to avoid busy waiting
  }
});
//    let mut finder = ;
  let walker = WalkDir::new(&path)
      .min_depth(1) // skip the root directory
      .max_depth(1) // only look at the immediate subdirectories
      .into_iter()
      
      // .filter_entry(|e| e.file_type().is_dir()) // only yield directories
      .filter_map(|e| e.ok());
    let par_walker = walker.par_bridge(); // ignore errors
    let files: Vec<FileItem>=par_walker
    .into_par_iter()
    .map(|(e)| {
          
          let name = e.file_name().to_string_lossy().into_owned(); // get their names
          // println!("{}",name);
          let path=e.path().to_string_lossy().into_owned();
          // let size = fs::metadata(e.path()).map(|m| m.len()).unwrap_or(0); // get their size
          let size=
          if(!e.path().is_symlink()){
            state.find_size(&path)
          }
          else{
            0
          };
          // let size=0;
          let foldercon=0;
          // let foldercon=state.foldercon(&path); //counts number of folders using hashmap..slows things down
          let is_dir = fs::metadata(e.path()).map(|m| m.is_dir()).unwrap_or(false); // check if folder
          let path = e.path().to_string_lossy().into_owned(); // get their path
          // fs::metadata(e.path()).map(|m|{
          //   if(!m.is_dir()){
              
          //   }
          // }).unwrap_or(0); .
          let mut folderloc=0;
          let mut filetype="Folder".to_string();
          let issymlink=e.path().is_relative() ||e.path().is_symlink();
          if(issymlink){
            filetype+="symlink";
          }
          if !e.path().is_dir(){
          //   let extension = Path::new(&path)
          //   .extension()
          //   .and_then(|os_str| os_str.to_str());
          // filetype=extension.unwrap();
            // folderloc=match(extension){
            //   Some("rs")=>{
            //     fs::read_to_string(e.path()).expect("Unable to open file").lines().count()
            //   },
            //   _=>{
            //     0
            //   }
            // };
            
            match(e.path().extension()){
              Some(g)=>{
                if g.to_string_lossy().to_string()=="rs"{
                  folderloc=fs::read_to_string(e.path()).expect("Unable to open file").lines().count();
                  // println!("{}",folderloc);
                }
                filetype=g.to_string_lossy().to_string();

              },
              None=>{
                // filetype=infer::get_from_path(e.path()).unwrap().unwrap().extension().to_string();
                if(issymlink){
                  filetype="symlink".to_string();
                  match(fs::metadata(path.clone())){
                    Ok(_) => {
                      filetype+=" valid"
                    },
                    Err(_)=>{
                      filetype+=" invalid"

                    }
                  };
                  
                }
                else{
                  filetype="unknown".to_string();
                  
                }
              }
            }
          }
          let tr;
          let (lmdate,timestamp)=lastmodified(&path);
          // let filetype=infer::get_from_path(&path).unwrap().unwrap().mime_type();
          
          
          // (name, size, path);
          FileItem { 
            name:name.clone(),
            path:path.clone(),
            is_dir,
            size:{
             tr=if(size>1){
                // tfsize+=size;
                // println!("{}",tfsize);
               sizeunit::size(size,true)
              }
              else{
                "".to_string()
              };
              if(folderloc>0){
                tr.clone() + " (" + &folderloc.to_string() + ")" 
              }
              else{
                tr.clone() 

              }
            },
            rawfs:size,    
            lmdate:lmdate.clone(),
            timestamp:timestamp,
            foldercon:foldercon,
            ftype:filetype,
            // grandparent:parent.parent().unwrap().to_string_lossy().to_string(),
            // parent:parent.to_string_lossy().to_string()
            //tfsize
            // {
            //   let size=FileSizeFinder::new(CACHE_EXPIRY).find_size(&parent.to_string_lossy().to_string());
            //   let tr=if(size>1){
                
            //    sizeunit::size(size,true)
            //   }
            //   else{
            //     "".to_string()
            //   };
            //   tr
            // }
        }
      })
      .inspect(|file| { // inspect each file and push it to the files vector
        let mut files = files.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
        // let mut tfsize = tfsize.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
        *tfsize_clone.lock().unwrap()+=file.rawfs;
        files.push(file.clone()); // push a clone of the file to the vector
    })
      .collect(); // collect into a vec
    // wait for the printing thread to finish (it won't unless you terminate it)
    handle.join().unwrap();
    app_handle.emit_to(
      "main",
      "list-files",
      serde_json::to_string(&files.clone()).unwrap(),
    )
    .map_err(|e| e.to_string())?;
  
  app_handle.emit_to(
      "main",
      "folder-size",
      {
        sizeunit::size(*tfsize_clone.lock().unwrap(),true)
      },
    )
    .map_err(|e| e.to_string())?;
    // sort the vector by name
    // files.sort_by(|a, b| a.name.cmp(&b.name));
    // emit an event to the frontend with the vector as payload
    println!("reachedhere");
    // println!("{:?}",serde_json::to_string(&files.clone()).unwrap());
    
   state.print_cache_size();
    let now = SystemTime::now();

    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    
    let endtime = duration.as_secs();
    
    println!("endtime----{}",endtime-startime);
    
    app_handle.emit_to(
      "main",
      "stop-timer",
      "",
    )
    .map_err(|e| e.to_string())?;
  Ok(())
  // // check if the path exists and is a directory
  // if path.exists() && path.is_dir() {
  //   // read the entries in the directory
  //   match fs::read_dir(&path) {
  //     Ok(entries) => {
  //       // create an empty vector to store the file items
  //       let mut files:Vec<FileItem> = Vec::new();
  //       let mut count=0;
  //       let mut totsize=0;
  //       let mut now = Instant::now();
        // let update:Vec<u64>=vec![20,40,60,80];

  //       let mut firsttime=true;
  //       let mut folderloc=0;
  //       // loop through the entries
  //       for entry in entries {
  //         count+=1;
          // let msval=update.iter().next().unwrap_or(&90);
  //         // get the metadata of the entry
  //         if let Ok(metadata) = entry.as_ref().unwrap().metadata() {
  //           // get the name and path of the entry
  //           let name = entry.as_ref().unwrap().file_name().into_string().unwrap();
  //           let path = entry.as_ref().unwrap().path().to_string_lossy().into_owned();
  //           if !entry.as_ref().unwrap().path().is_dir(){
  //             match(entry.as_ref().unwrap().path().extension()){
  //               Some(g)=>{
  //                 if g.to_string_lossy().to_string()=="rs"{
  //                   folderloc=fs::read_to_string(entry.as_ref().unwrap().path()).expect("Unable to open file").lines().count();
  //                   println!("{}",folderloc);
  //                 }

  //               },
  //               None=>{

  //               }
  //             }
  //           }
            
  //           // check if the entry is a file or a directory
  //           let is_dir = metadata.is_dir();
  //           // let csizebefore=state.print_cache_size();
  //           let size=state.find_size(&path);
  //           let foldercon=state.foldercon(&path);
  //           let mut tr;
  //           // let size=0;
  //           // println!("{}---{}",path,foldercon);
  //           let (lmdate,timestamp)=lastmodified(&path);
  //           // create a file item from the entry data
  //           let file = FileItem { 
  //               name:name.clone(),
  //               path:path.clone(),
  //               is_dir,
  //               size:{
  //                tr=if(size>1){
  //                   tfsize+=size;
  //                   // println!("{}",tfsize);
  //                  sizeunit::size(size,true)
  //                 }
  //                 else{
  //                   "".to_string()
  //                 };
  //                 if(folderloc>0){
  //                   tr.clone() + " (" + &folderloc.to_string() + ")"
  //                 }
  //                 else{
  //                   tr.clone()

  //                 }
  //               },
  //               rawfs:size,    
  //               lmdate:lmdate.clone(),
  //               timestamp:timestamp,
  //               foldercon:foldercon
  //               // grandparent:parent.parent().unwrap().to_string_lossy().to_string(),
  //               // parent:parent.to_string_lossy().to_string()
  //               //tfsize
  //               // {
  //               //   let size=FileSizeFinder::new(CACHE_EXPIRY).find_size(&parent.to_string_lossy().to_string());
  //               //   let tr=if(size>1){
                    
  //               //    sizeunit::size(size,true)
  //               //   }
  //               //   else{
  //               //     "".to_string()
  //               //   };
  //               //   tr
  //               // }
  //           };
  //           // push the file item to the vector
  //           totsize+=mem::size_of_val(&file);
  //           // totsize+=mem::size_of_val(&name);
  //           // totsize+=mem::size_of_val(&path);
  //           // totsize+=mem::size_of_val(&is_dir);
  //           // totsize+=mem::size_of_val(&tr);
  //           // totsize+=mem::size_of_val(&size);
  //           // totsize+=mem::size_of_val(&lmdate);
  //           // totsize+=mem::size_of_val(&timestamp);
  //           // totsize+=mem::size_of_val(&foldercon);
  //           println!("{}-----{} out of {} \t{}--{}",sizeunit::size(totsize as u64,true),count,fcount,name,path);
  //           files.push(file);
  //           let elapsed = now.elapsed();
            
  //           if elapsed.ge(&Duration::from_millis(*msval)) || firsttime || (count%20==0 && elapsed.ge(&Duration::from_millis(20)))
  //           {
  //             firsttime=false;
  //           //Todo move to a separate function and call after every select interval instead of count%10
  //             app_handle.emit_to(
  //               "main",
  //               "list-files",
  //               serde_json::to_string(&files.clone()).unwrap(),
  //             )
  //             .map_err(|e| e.to_string())?;
            
  //           app_handle.emit_to(
  //               "main",
  //               "folder-size",
  //               {
  //                 sizeunit::size(tfsize,true)
  //               },
  //             )
  //             .map_err(|e| e.to_string())?;
  //           }
          
  //           now = Instant::now();
  //         }

  //       }
        

        
        
  //     // app_handle.emit_to(
  //     //         "main",
  //     //         "list-files",
  //     //         serde_json::to_string(&files.clone()).unwrap(),
  //     //       )
  //     //       .map_err(|e| e.to_string())?;
          
          
  //       // return Ok with the vector
  //       // Ok(serde_json::to_value(&files.clone()).unwrap())
  //       Ok(())
  //     },
  //     Err(e) => {
  //       // return Err with the error message
  //       Err(e.to_string())
  //     }
  //   }
  // } else {
    
  //   // return Err with an invalid path message
  //   Err("Invalid path".to_string())
  // }
  
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
async fn nosize(id:String,path:String,window: Window,state: State<'_, FileSizeFinder>)->Result<(),()>{
  state.nosize();
  list_files(id,path,"newtab".to_string(), window, state).await;
  Ok(())
}

// #[tauri::command]
// async fn addtab(oid:String,path:String,ff:String,window: Window,state: State<'_, FileSizeFinder>)->Result<(),()>{
//   state.addtab(oid.clone(), path.clone(), ff.clone());
//   listtabs(oid, path, ff, window, state).await;

// Ok(())
// }

#[tauri::command]
async fn closetab(id:String,window: Window,state: State<'_, FileSizeFinder>)->Result<(),()>{
  state.removetab(id);
  let app_handle = window.app_handle();
  app_handle.emit_to(
    "main",
    "list-tabs",
    serde_json::to_string(&state.gettabs()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  Ok(())
}
#[tauri::command]
async fn removemark(path:String,window: Window,state: State<'_, FileSizeFinder>)->Result<(),()>{
  state.removemark(path);
  let app_handle = window.app_handle();
  app_handle.emit_to(
    "main",
    "load-marks",
    serde_json::to_string(&state.getmarks()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  Ok(())
}
#[tauri::command]
async fn listtabs(window: Window,state: State<'_, FileSizeFinder>)->Result<(),()>{
  let app_handle = window.app_handle();
  // println!("{:?}",state);
  app_handle.emit_to(
    "main",
    "list-tabs",
    serde_json::to_string(&state.gettabs()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
app_handle.emit_to(
  "main",
  "load-marks",
  serde_json::to_string(&state.getmarks()).unwrap(),
)
.map_err(|e| e.to_string()).unwrap();
Ok(())
}

#[tauri::command]
async fn addmark(path:String,window: Window,state: State<'_, FileSizeFinder>)->Result<(),()>{
  state.addmark(path);
  let app_handle = window.app_handle();
  println!("{:?}",state);
  app_handle.emit_to(
    "main",
    "load-marks",
    serde_json::to_string(&state.getmarks()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  Ok(())
}
#[tauri::command]
async fn newtab(oid:String,path:String,ff:String,window: Window,state: State<'_, FileSizeFinder>)->Result<(),()>{
  state.addtab(oid.clone(), path.clone(), ff.clone());
  listtabs(window, state).await;
  
  

  // state.nosize();
  // list_files(path, window, state).await;
  Ok(())
}
use chrono::{DateTime, Local, Utc};
fn lastmodified(path:&str)->(String,i64){
  match(fs::metadata(path)){
    Ok(mp) => {
      // let metadata = fs::metadata(path.clone()).unwrap();
      let modified = mp.modified().unwrap();
      
    
    // get the metadata of the path
    
    // get the last modification time
    
    // get the current system time
    let now = SystemTime::now();
    
    // get the difference between now and modified
    let diff = now.duration_since(modified).unwrap();
    
    // create a duration of 7 days
    let seven_days = Duration::from_secs(7 * 24 * 60 * 60);
    let one_day = Duration::from_secs(1 * 24 * 60 * 60);
    
    // check if diff is less than or equal to seven_days
  //   let date = if diff <= seven_days {
  //     // format modified as a relative date
  //     let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);
  //     // let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
  //     let relative_date = modified_date.format("%R %a").to_string();
  //     println!("{} was modified {}", path, relative_date);
  //     relative_date
  // } else {
  //     // format modified as a UNIX timestamp
  //     let modified_date = DateTime::<Utc>::from(modified);
  //     let unix_timestamp = modified_date.timestamp();
  //     println!("{} was modified at {}", path, unix_timestamp);
  //     unix_timestamp.to_string()
  // };
  let timestamp;
  let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);
  timestamp=modified_date.timestamp();
  // timestamp=format!("{}",modified_date.timestamp());
  let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
  let relative_date = modified_date.format("%R %a").to_string();
  let absolute_date = modified_date.format("%d-%m-%y %H:%S").to_string();
  let date=if diff <= seven_days && diff > one_day {
    // format modified as a relative date
    let diff = now_date.signed_duration_since(modified_date);

    // get the number of days in the difference
    let days = diff.num_days();
    // println!("{} was modified {}", path, days);
    // relative_date
    format!("{} day(s) ago @ {} ",days,relative_date)
    // println!("{} was modified {}", path, relative_date);
    // relative_date
} else if diff <= one_day {
  // format modified as a relative date
  // let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);

  // // let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
  // let relative_date = modified_date.format("%R").to_string();
  
  // println!("{} was modified {}", path, relative_date);
  relative_date
} else{
    // format modified as an absolute date
    // let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);
    // println!("{} was modified on {}", path, absolute_date);
    absolute_date
};
    (date,timestamp)
  },
  Err(_) => {
    ("".to_string(),0)
  },
}
}
fn main() {
  let mut g=FileSizeFinder::new(CACHE_EXPIRY);
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
    .invoke_handler(tauri::generate_handler![
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
        removemark
        ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
// In Rust, define a function that takes a path as an argument and returns a list of possible paths
#[tauri::command]
fn get_path_options(mut path: String) -> Vec<String> {
  // let whereto=path.clone();
  // let app_handle=window.app_handle();
  // Use some logic to generate a list of possible paths based on the input path
  // For example, use std::fs::read_dir to list the files in a directory
  let mut options = Vec::new();
  let pathasbuf=PathBuf::from(path.clone());
  if(!pathasbuf.exists()){
    if let Some(parent) = pathasbuf.parent() {
      // Convert parent to OsStr
      path = parent.as_os_str().to_string_lossy().to_string();
    }
  }
  // if let Some(index) = path.rfind('/') {
  //   // Get the substring from 0 to index
  //       if let Some(substring) = path.get(0..index+1) {
          // Use substring instead of path
      if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries {
          if let Ok(entry) = entry {
            // if let Ok(file_name) = entry.path().to_string_lossy().to_string()
            {
              // if(!entry.path().is_file()){

                options.push(entry.path().to_string_lossy().to_string());
              // }
            }
          }
        }
      // }
    // }
  }
  // app_handle.emit_to(
  //   "main",
  //   "pop-datalist",
  //   options.clone(),
  // )
  // .map_err(|e| e.to_string()).unwrap();
  // Return the list of possible paths
  println!("{:?}",options);
  options
}
