
use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File, OpenOptions}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::{HashSet, HashMap}};
#[cfg(unix)]
use std::os::unix::fs::OpenOptionsExt;

#[cfg(windows)]
use std::os::windows::fs::OpenOptionsExt;
use ignore::WalkBuilder;
// use image::{GenericImageView, io::Reader};
use rayon::prelude::*;
use serde_json::json;
use tauri::{Window, State, Manager};
// use walkdir::{WalkDir, DirEntry};

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit::{self, find_size}, 
  lastmodcalc::lastmodified, 
  appstate::AppStateStore, SHARED_STATE, 
  // loadjs::loadjs
};

pub fn populatefileitem(name:String,path:&Path,window:&Window)->FileItem{
  // println!("path=-------->{:?}",path);
    // println!("{}",name);
    let state=SHARED_STATE.lock().unwrap();
    let pathtf=path.to_string_lossy().into_owned();
    let ignorehiddenfiles=*state.excludehidden.read().unwrap();
    // println!("-----------{}",path.clone());
  
    // let size = fs::metadata(e.path()).map(|m| m.len()).unwrap_or(0); // get their size
    let size=
    if(!path.is_symlink()){
      find_size(&pathtf,window)
    }
    else{
      0
    };
    // let size=0;
    let mut foldercon=0;
    let threads = (num_cpus::get() as f64 * 0.75).round() as usize;
    if(*state.showfolderchildcount.read().unwrap()){
      if(path.is_dir()){
        let count = WalkBuilder::new(&path)
        .max_depth(Some(1))
        .threads(threads)
        .hidden(ignorehiddenfiles) // Include hidden files and directories
        .follow_links(false)
        .parents(true)
        
        .git_exclude(true)
        .ignore(false) // Disable the default ignore rules
        .git_ignore(true).build()
        .into_iter()
        .filter_map(|entry| entry.ok())
        .par_bridge()
        .filter(|entry| {
        //   window.emit("reloadlist",json!({
        //     "message": "immediatechildcount",
        //     "status": "running",
        // }));
          // entry.file_type().is_file()
          true
        })
        .count();
      foldercon=count as i32;
      }
    }



    // let foldercon=state.foldercon(&path); //counts number of folders using hashmap..slows things down
    let is_dir = fs::metadata(path).map(|m| m.is_dir()).unwrap_or(false); // check if folder
    let mut folderloc=0;
    let mut filetype="Folder".to_string();
    // let mut filesetcollection=HashSet::new();
    let issymlink=path.is_relative() ||path.is_symlink();
    if(issymlink){
      filetype+="symlink";
    }
    if !path.is_dir(){
      //modify here to add more extensions to list linecount
      match(path.extension()){
        Some(g)=>{
          if matches!(g.to_string_lossy().as_ref(),
           "ts" | 
           "tsx" | 
           "js" | 
           "rs" | 
           "html" |
           "kt" |
           "java" |
           "md" |
            "css"|
            "yaml"
          )
          {
            //add a right click context menu option to do this on the tab name uptop
            // folderloc=fs::read_to_string(e.path()).expect("Unable to open file").lines().count();
            // println!("{}",folderloc);
            if let Ok(file) = File::open(path){ // open the file
            let reader = BufReader::new(file); // create a buffered reader
            folderloc=reader.lines().count(); // count the number of lines in the file
            // println!("Number of lines: {}", folderloc); 
            }// print the count
          }
          else if matches!(g.to_string_lossy().as_ref(),
          "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "tif" | "tiff" | "webp"
          )
          {
    #[cfg(not(unix))]
    let f = 
    
    BufReader::new(
      OpenOptions::new()
      .read(true)
    //   .custom_flags( libc::O_NONBLOCK 
    // )
      .open(path).unwrap());
    // #[cfg(unix)]
    // let f = 
    
    // BufReader::new(
    //   OpenOptions::new()
    //   .read(true)
    //   .custom_flags({ libc::O_NONBLOCK } 
    // )
    //   .open(path).unwrap());
 
    // let mut reader = image::io::Reader::new(f);
    //         // println!("image found");
    //         if let Ok(img) = 
    //         // image::image_dimensions(path)
    //        reader.into_dimensions()
    //           {
                
    //             let (width, height) = img;
    //             filedime=
    //             format!("{} x {}", width, height).to_string();
    //             // println!("{filedime}")
    //           }
          }
          filetype=g.to_string_lossy().to_string();
          // if(!state.filesetcollection.read().unwrap().contains(&filetype)){

          //   let mut ft=state.filesetcollection.write().unwrap();
          //   ft.insert(filetype.clone());
          // }
          
  
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
    let mut hm=state.filesetcollection.write().unwrap();
          *hm.entry(filetype.clone()).or_insert(0)+=1;
    let tr;
    let (lmdate,timestamp)=lastmodified(&pathtf);
    FileItem { 
      name:
        name.clone()
      ,
      path:pathtf.clone(),
      is_dir,
      size:{
       tr=if(size>1){
         sizeunit::size(size,true)
        }
        else{
          "".to_string()
        };
          tr.clone() 
      },
      rawfs:size,    
      lmdate:lmdate.clone(),
      timestamp:timestamp,
      foldercon:if(path.is_dir()){
        foldercon
      }
      else{
        folderloc as i32
      },
      ftype: filetype
      ,
  }
  }