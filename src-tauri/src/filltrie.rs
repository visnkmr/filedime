use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock, atomic::{Ordering, AtomicBool}}, thread, io::{BufReader, BufRead}, collections::{HashSet, HashMap}};

use fuzzy_matcher::clangd::fuzzy_match;
use ignore::{Walk, WalkBuilder, WalkState};
use libc::stat;
use rayon::prelude::*;
use serde_json::json;
use tauri::{Window, State, Manager};
// use walkdir::{WalkDir, DirEntry};

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit, 
  lastmodcalc::lastmodified, 
  appstate::{AppStateStore, set_enum_value, wThread, get_enum_value}, openhtml::loadfromhtml,  sendtofrontend::slist, searchfiles::memoisedfm, 
  // loadjs::loadjs
};
#[tauri::command]
pub async fn populate_try(mut path: String, window:&Window,state: &State<'_, AppStateStore>)->Result<(),String>{
  let orig = *state.process_count.lock().unwrap();
  let ignorehiddenfiles=*state.excludehidden.read().unwrap();
  if(path=="drives://"){
    // driveslist(&windowname.clone(),&window.app_handle(),&serde_json::to_string(&populatedrivelist().clone()).unwrap()).unwrap();
    // list_files(windowname, oid, path, ff, window, state);
    match(dirs::home_dir()){
    Some(spath) => {
      path=spath.to_string_lossy().to_string();

    },
    None => {
      return Err("home not found".to_string())
    },
}; 
if(path=="downloads://"){
  // list_files(windowname, oid, path, ff, window, state);
match(dirs::download_dir()){
  Some(spath) => {
    path=spath.to_string_lossy().to_string();
  },
  None => {
    return Err("home not found".to_string())
  },
};
  // return Ok(())
} 
if(path=="documents://"){
  // list_files(windowname, oid, path, ff, window, state);
match(dirs::document_dir()){
  Some(spath) => {
    path=spath.to_string_lossy().to_string();
  },
  None => {
    return Err("home not found".to_string())
  },
};
  // return Ok(())
} 
    // return Ok(())
  } 
  // populate_trie(oid, path, ff, window, state).await;
  // return ;
  

  // thread::spawn(
    // {
      // let st=state.searchtry.clone();
    
    // move||{
      let threads = (num_cpus::get() as f64 * 0.75).round() as usize;

      WalkBuilder::new(&path)
      .threads(threads)
      .hidden(ignorehiddenfiles) // Include hidden files and directories
      .follow_links(false)
      .parents(true)
      // .git_exclude(true)
      // .ignore(true) // Disable the default ignore rules
      // .git_ignore(true) // Respect the .gitignore file
      .build_parallel()
      .run(|| {
            // println!("Populating");

          // let total_bytes = total_bytes.clone();
          // let database = database.clone();
          // let root = root.as_ref().to_owned();
          Box::new(move |entry| {
            match(entry){
              Ok(e)=>{
                if let Some(eft)=(e.file_type()){
                  let mut searchfor=eft.is_file();
                  if(state.includefolderinsearch.read().unwrap().clone()){
                    searchfor = eft.is_file()||eft.is_dir();
                  }
                  if(searchfor)
                  {
                    
                    // println!("{:?}",e.path());
                  // }
                  let i = e.path().to_string_lossy().to_string();
                  let name=e.file_name().to_string_lossy().to_string().to_lowercase();
                  let map=state.stl.clone();
                  let mut map =map.lock().unwrap();
                  if let Some(hs) = map.get_mut(&name) {
                      // If yes, append the value to the existing vector
                      // if(!hs.contains(&i)){
                        hs.insert(i);
                      // }
                  } else {
                      // If no, create a new vector with the value and insert it into the hashmap
                      map.insert(name, HashSet::from_iter(vec![i]));
                  }
                // map.entry(name).or_insert(Vec::new()).push(i);
                } 
                }
              },
              Err(_)=>{
                // println!("unknown filetype");
              }
            }
              WalkState::Continue
          })
      });
        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let endtime = duration.as_secs();
        // println!("stl is {:?  }",state);
        println!("endtime----{}",endtime);
        
  Ok(())
}