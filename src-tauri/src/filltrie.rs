use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::{HashSet, HashMap}};

use rayon::prelude::*;
use tauri::{Window, State, Manager};
use walkdir::{WalkDir, DirEntry};

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit, 
  lastmodcalc::lastmodified, 
  appstate::AppStateStore, openhtml::loadfromhtml, trie::TrieNode, fileitem::{populatefileitem, is_hidden}, 
  // loadjs::loadjs
};

// #[tauri::command]
// pub async fn populate_trie(oid:String,path: String,ff:String, window: Window, state: State<'_, AppStateStore>){
// // thread::spawn(
//     // {
    
//     // move||{
//         let walker2 = WalkDir::new(&path)
//         .contents_first(true)
//           .min_depth(1) // skip the root directory
//           // .max_depth(1) // only look at the immediate subdirectories
//           .into_iter()
          
//           .filter_entry(|e| 
//             !e.path_is_symlink() 
//           &&
          
//           !e.path().to_string_lossy().to_string().contains("/.git/")
//             // e.file_type().is_dir()
//           ) 
//           ;

//           let now = SystemTime::now();
//         let duration = now.duration_since(UNIX_EPOCH).unwrap();
//         let endtime = duration.as_secs();
//         println!("endtime----{}",endtime);

//         let mut count=RwLock::new(0);
        
        
//         let par_walker2 = walker2.par_bridge(); // ignore errors
//         let k:Vec<(String,String)>=par_walker2
//         // .enumerate()
//         .into_par_iter()  
//         .filter_map(Result::ok)
//         .map(
//           |e| {
//             // let path = e.path().to_string_lossy().to_string();
//             let path = PathBuf::from(e.path().to_string_lossy().to_string()).file_stem().unwrap().to_string_lossy().to_string();
//             (path.to_lowercase(),e.path().to_string_lossy().to_string().to_lowercase())
//           }
//         )
//         .collect(); // collect into a vec
//       let st=state.st.clone();
//       let mut st=st.lock().unwrap();
//       for (i,j) in k{
//         st.insert(&i,&j);
        
//       }
//       drop(st);
//       println!("-------c ----{}",count.read().unwrap());
// }

#[tauri::command]
pub async fn populate_try(path: String, state: &State<'_, AppStateStore>){
  
  // populate_trie(oid, path, ff, window, state).await;
  // return ;
  

  // thread::spawn(
    // {
      // let st=state.searchtry.clone();
    
    // move||{
        let walker2 = WalkDir::new(&path)
        // .contents_first(true)
          .min_depth(1) // skip the root directory
          // .max_depth(1) // only look at the immediate subdirectories
          .into_iter()
          
          .filter_entry(
            |e| 
            !e.path_is_symlink() 
            // &&
            // !e
            // .file_name()
            // .to_str()
            // .map(|s| s.starts_with("."))
            // .unwrap_or(false)
            &&
            !is_hidden(e)
            // &&
            // e.file_type().is_file()
              // e.file_type().is_dir()
          );

        let mut count=RwLock::new(0);
        
        
        let par_walker2 = walker2.par_bridge(); // ignore errors
        
        // let k:HashSet<String>=
        let paths:Vec<String>=par_walker2
        // .enumerate()
        .into_par_iter()  
        .filter_map(Result::ok)
        .map(
          |e|
          {
          // // println!("{:?}",e.path());
          //   if(!e.file_type().is_dir()){
          //     // println!("{:?}",e.path());
          //   // }
          //   let i = e.path().to_string_lossy().to_string();
          //   let name=e.file_name().to_string_lossy().to_string().to_lowercase();
          //   let map=state.stl.clone();
          //   let mut map =map.lock().unwrap();
          //   if let Some(hs) = map.get_mut(&name) {
          //       // If yes, append the value to the existing vector
          //       // if(!hs.contains(&i)){
          //         hs.insert(i);
          //       // }
          //   } else {
          //       // If no, create a new vector with the value and insert it into the hashmap
          //       map.insert(name, HashSet::from_iter(vec![i]));
          //   }
          // // map.entry(name).or_insert(Vec::new()).push(i);
          // } 
          e.path().to_string_lossy().to_string()
        }
        ).collect();
        state.st.lock().unwrap().populate_trie(paths);

        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let endtime = duration.as_secs();
        println!("endtime----{}",endtime);
        
        // .collect(); // collect into a vec
        // let mut st=st.lock().unwrap();
        // *st=(k.clone());
        // println!("-------c ----{}",count.read().unwrap());
        // drop(st);
        
        // for i in k{
        //   let name=PathBuf::from(&i).file_name().unwrap().to_string_lossy().to_string().to_lowercase();
        //   map.entry(name).or_insert(Vec::new()).push(i);

        // }
        // let map: HashMap<String, Vec<String>> = par_walker2
        // .into_par_iter()
        // .filter_map(Result::ok) // ignore errors
        // .map(|e| e.path().to_string_lossy().into_owned()) // get path as string
        // .with_key(|path| {
        //     PathBuf::from(path) // convert to PathBuf
        //         .file_name() // get file name
        //         .unwrap() // unwrap the Option
        //         .to_string_lossy() // convert to string
        //         .to_string() // convert to owned string
        //         .to_lowercase() // convert to lowercase
        // }) // use custom key function
        // .into_par_iter() // convert to parallel iterator
        // .from_par_iter(); // create hashmap from parallel iterator
      // }
    // }
  // );
  
}
