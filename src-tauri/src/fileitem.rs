
use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::{HashSet, HashMap}};

use rayon::prelude::*;
use tauri::{Window, State, Manager};
use walkdir::{WalkDir, DirEntry};

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit, 
  lastmodcalc::lastmodified, 
  appstate::AppStateStore, openhtml::loadfromhtml, trie::TrieNode, 
  // loadjs::loadjs
};

pub fn populatefileitem(name:String,path:&Path,state: &State<'_, AppStateStore>)->FileItem{
    // println!("{}",name);
    let pathtf=path.to_string_lossy().into_owned();
    // println!("-----------{}",path.clone());
  
    // let size = fs::metadata(e.path()).map(|m| m.len()).unwrap_or(0); // get their size
    let size=
    if(!path.is_symlink()){
      state.find_size(&pathtf)
    }
    else{
      0
    };
    // let size=0;
    let foldercon=0;
    // let foldercon=state.foldercon(&path); //counts number of folders using hashmap..slows things down
    let is_dir = fs::metadata(path).map(|m| m.is_dir()).unwrap_or(false); // check if folder
    // let path = path.to_string_lossy().into_owned(); // get their path
    // fs::metadata(e.path()).map(|m|{
    //   if(!m.is_dir()){
        
    //   }
    // }).unwrap_or(0); .
    let mut folderloc=0;
    let mut filetype="Folder".to_string();
    let issymlink=path.is_relative() ||path.is_symlink();
    if(issymlink){
      filetype+="symlink";
    }
    if !path.is_dir(){
      
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
            "css"
          )
          {
            //add a right click context menu option to do this on the tab name uptop
            // folderloc=fs::read_to_string(e.path()).expect("Unable to open file").lines().count();
            // println!("{}",folderloc);
            if let Ok(file) = File::open(path){ // open the file
            let reader = BufReader::new(file); // create a buffered reader
            folderloc=reader.lines().count(); // count the number of lines in the file
            // println!("Number of lines: {}", count); 
            }// print the count
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
    let (lmdate,timestamp)=lastmodified(&pathtf);
    FileItem { 
      name:name.clone(),
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
      foldercon:foldercon,
      ftype: if(folderloc>0){
        filetype + " (" + &folderloc.to_string() + ")" 
      }
      else{
        filetype
      },
  }
  }

  pub fn is_hidden(entry: &DirEntry) -> bool {
    let g=entry.file_name()
      .to_str()
      .map(|s| s.starts_with("."))
      .unwrap_or(false);
          // if(entry.file_name().to_string_lossy().to_string().contains("apps")){
    // if(!g){
    //   println!("-----------{:?}==={}",entry.path(),g);
    // }
    g
  }