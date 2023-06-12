use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::HashSet};

use rayon::prelude::*;
use serde::Serialize;
use serde_json::json;
// use rust_search::similarity_sort;
use tauri::{Window, State, Manager};
use walkdir::WalkDir;

use crate::{
  FileItem,
  appstate::*,
  fileitem::*, 
  // partialratio::*, 
  sendtofrontend::*, lastmodcalc::lastmodified, 
  // loadjs::loadjs
};
use fuzzy_matcher::{*, clangd::fuzzy_match};
#[derive(Clone,Debug,Serialize)]
struct rstr{
  term:String,
  files:HashSet<FileItem>
}
#[tauri::command]
pub async fn recent_files(windowname:String,string: String,window: Window, state: State<'_, AppStateStore>)->Result<(),()>
//  -> Vec<String> 
 {
  let wname=windowname.clone();
  println!("recents");

    // populate_try(path, &state);
    // if(string.len()<3){
    //   return Ok(());
    // }
 
  
  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("hs----{}",startime);


  

  let map=state.stl.lock().unwrap();
//   let op=state.st.lock().unwrap().search_trie(&string);
//   println!("{}",op.len());
//   if(op.len()<10)
//   {
// // op.split_off(1);
//     println!("{:?}",op)
//   }

// //   let mut results:Vec<String>=map.clone()
// //   .par_iter()
// //   .flat_map(|(_, y)| y.par_iter())
// //   .cloned()
// //   .collect();
// //   // similarity_sort(&mut results, &string);

// //   // Print the sorted results
// //   println!("{}",results.len());
// //   // if(results.len()<10)
// //   {
// // results.split_off(1);
// //     for path in results {
      
// //         println!("{:?}", path);
// //     }
// //   }

 
//   return Ok(());
let update:Vec<u64>=vec![1,2,5,7,10,20,40,65,90,120];

  // if(string.len()>3)
  // {

  //   search_pop(path,string).await;
  // }
  // return Ok(());

  
  // let string=string.to_lowercase();
  // search_trie(path,string, state).await;
  // return Ok(());
  
  // thread::spawn({
    // let st=state.searchtry.clone();
    // let vecj=st.lock().unwrap().clone();
    // drop(st);
    // // move||{
    // let strings=parallel_search(vecj,string);
    // let mut gh=Vec::new();
    // let mut ret:HashSet<String>=HashSet::new();




    // let ret:HashSet<String>=
    // map.clone()
    // .par_iter()
    // .filter(
    //   |(i,_)|
    //   i.contains(&string)
    // ).
    // flat_map(
    //   |(_,y)|
    //   {
    //     // if i.contains(&string){
    //       // i.clone()
    //       y.par_iter()
    //     // }
    //   }
    // )
    // .cloned()
    // .inspect(|o|{

    // })
    // .collect();


    let app_handle = window.app_handle();


let m:HashSet<FileItem>=HashSet::new();
// Create a RwLock wrapped in an Arc to share the hashset
let ret = Arc::new(RwLock::new(m));

// Create a clone of the Arc for the other thread
let ret_clone = Arc::clone(&ret);
let ret_clone2 = Arc::clone(&ret);

// Create a boolean flag to indicate whether the search is done or not
let done = Arc::new(RwLock::new(false));
let mut notimes=0;
// Create a clone of the Arc for the other thread
let done_clone = Arc::clone(&done);
starttimer(&windowname,&app_handle);
let string_clone=string.clone();
// Spawn another thread to read and print the hashset periodically
thread::spawn(move || {

  let mut last_print = Instant::now(); // initialize the last print time to the current time
    loop {
      notimes+=1;
      
      let mut msval=1 as u64;
      let ret = ret_clone.read().unwrap();
      if(ret.len()!=0){
        msval=*update.iter().next().unwrap_or(&120);
        
      }
      println!("---->{}",ret.len());
      if last_print.elapsed() >= Duration::from_millis(msval) { 

        // Read the hashset with a read lock
        if(ret.len()!=0){

          slist(&windowname,&app_handle, &ret, string_clone.clone())
        }
      
     

              
        // println!("{:?}", *ret);
        println!("{:?}", ret.len());
        // Check the flag with a read lock
        let done = done_clone.read().unwrap();
        // If the flag is true, break out of the loop
        if *done ||notimes>50 && ret.len()!=0 {
          // app_handle.emit_to(
          //   "main",
          //   "load-sresults",
          //   serde_json::to_string(&ret.clone()).unwrap(),
          // )
          // .map_err(|e| e.to_string()).unwrap();
          // app_handle.emit_to(
          //   "main",
          //   "load-complete",
          //   "",
          // )
          // .map_err(|e| e.to_string()).unwrap();
            
            break;
        }
        // Drop the lock before sleeping
        
        
        // Drop the lock before reading the hashset
        drop(done);
        // Sleep for some time
        last_print = Instant::now(); // update the last print time to the current time
      }
      drop(ret);
        thread::sleep(std::time::Duration::from_millis(30));
    }
});

// Populate the hashset using par_iter and inspect
let u:HashSet<String>=map.clone()
    .par_iter()
    .filter(|(i, _)| {
      // fuzzy_match(&i, &string).unwrap_or(0)>0
      
       (
        is_needed_file(i)||
       is_image_file(i) 
      )
      // true

    })
    .flat_map(|(_, y)| {
      window.emit("reloadlist",json!({
        "message": "pariter4",
        "status": "running",
    }));
      y.par_iter()
    })
    .cloned()
    .filter(|i|{
      !i.contains("node_modules")
    })
    // .inspect(|o| {
    //   // let path=Path::new(o);
    //   // let fname=path.file_name().unwrap().to_string_lossy().to_string();
    //   //   // Write to the hashset with a write lock
    //   //   let mut ret = ret.write().unwrap();
    //   //   fuzzy_match(&fname, &string);
    //   //   ret.insert(populatefileitem(fname, path, &state));
        
    //   //   // Drop the lock after inserting
    //   //   drop(ret);
    // })
    .collect();
  println!("Found {}",u.len());
  
  
  // if(u.len()<2000)
  {
    let mut v: Vec<String> = u.into_par_iter().collect(); // Collect into a vector
    v
    .par_sort_by_key(|ei| { // Sort by key
      lastmodified(ei).1
    });
    v.reverse();
    // v.split_off(100);
    // for (c,ei) in 
    v
    .par_iter().enumerate().try_for_each(|(c,ei)|{
      window.emit("reloadlist",json!({
        "message": "pariter7",
        "status": "running",
    }));
      // if c>150{
      //   return None;
      // }
      // let path=Path::new(&ei);
      //   let fname=path.file_name().unwrap().to_string_lossy().to_string();
      //   let score=fuzzy_match(&fname, &string).unwrap();
      let path=Path::new(&ei);
      let fname=path.file_name().unwrap().to_string_lossy().to_string();
        // Write to the hashset with a write lock
        let mut ret = ret.write().unwrap();
        // fuzzy_match(&fname, &string);
        ret.insert(populatefileitem(fname, path,&window, &state));
        
        // Drop the lock after inserting
        drop(ret);
      println!("{}",ei);
      Some(())
    });
    let wtr=ret_clone2.read().unwrap().clone();
    rflist(&wname,&window.app_handle(), &wtr)
  }
  // Set the flag to true with a write lock
let mut done = done.write().unwrap();
*done = true;
stoptimer(&wname,&window.app_handle());
    // for (i,_) in map.clone(){
    //   // gh.push(i);
    //   if i.contains(&string){
    //     gh.push(i.clone());
    //   }
    // }
    // let o=map.clone();
    // let ret:HashSet<String>=gh.par_iter().flat_map(|u|{
    //   let y=o.get(u).unwrap();
    //   // let f:Vec<String>=
    //   y.par_iter()
    //   // .map(|t|{
    //     // t.clone()
    //   // }).collect();
    //   // f
    // }).cloned().collect();

    // for i in gh{
    //   let y=o.get(&i.clone()).unwrap();
    //   for j in y{
    //     ret.insert(j.clone());
    //   }
    // }
    // let ret = ret.read().unwrap();
    // println!("{:?}",ret.len());
    // if(ret.len()<20){
    //   println!("{:?}",ret);
    // }
    // drop(ret);
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


fn is_image_file(file_name: &str) -> bool {
  let extension = Path::new(file_name)
      .extension()
      .and_then(|ext| ext.to_str())
      .unwrap_or("");
  match extension.to_lowercase().as_str() {
      "jpg" | "jpeg" | "png" | "gif" => true,
      _ => false,
  }
}
fn is_needed_file(file_name: &str) -> bool {
  let extension = Path::new(file_name)
      .extension()
      .and_then(|ext| ext.to_str())
      .unwrap_or("");
  match extension.to_lowercase().as_str() {
      "rs" | "js" | "json" | "toml" => true,
      _ => false,
  }
}