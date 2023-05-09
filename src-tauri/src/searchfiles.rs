use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::HashSet};

use rayon::prelude::*;
// use rust_search::similarity_sort;
use tauri::{Window, State, Manager};
use walkdir::WalkDir;

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit, 
  lastmodcalc::lastmodified, 
  appstate::AppStateStore, openhtml::loadfromhtml, trie::TrieNode, fileitem::{populatefileitem, is_hidden}, partialratio::partial_ratio, 
  // loadjs::loadjs
};

// #[tauri::command]
// async fn  search_trie(path:String,string: String, state: State<'_, AppStateStore>)->Result<(),()>
// {
//   let st=state.st.clone();
//       let mut st=st.lock().unwrap();
//   let string=string.to_lowercase();
//   // println!("fs-----{:?}",st.fuzzy_search(&string,2,5));
//   // println!("fs-----{:?}",st.fuzzy_search(&string,2,5).len());
//   // println!("s--------{:?}",st.search(&string));
//   let tl=parallel_search(st.search(&string,path),string);
//   println!("s--------{:?}",tl.len());
//   if(tl.len()<30){
//     println!("{:?}",tl);
//   }
//   Ok(())
// }
#[tauri::command]
pub async fn  search_try(path:String,string: String,window: Window, state: State<'_, AppStateStore>)->Result<(),()>
//  -> Vec<String> 
 {
  
    // populate_try(path, &state);

 
  
  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("hs----{}",startime);



  let map=state.stl.lock().unwrap();
  if(string.len()<3){
    return Ok(());
  }
  let op=state.st.lock().unwrap().search_trie(&string);
  println!("{}",op.len());
  if(op.len()<10)
  {
// op.split_off(1);
    println!("{:?}",op)
  }

//   let mut results:Vec<String>=map.clone()
//   .par_iter()
//   .flat_map(|(_, y)| y.par_iter())
//   .cloned()
//   .collect();
//   // similarity_sort(&mut results, &string);

//   // Print the sorted results
//   println!("{}",results.len());
//   // if(results.len()<10)
//   {
// results.split_off(1);
//     for path in results {
      
//         println!("{:?}", path);
//     }
//   }

 
  return Ok(());
let update:Vec<u64>=vec![1,2,5,7,10,20,40,65,90,120];

  // if(string.len()>3)
  // {

  //   search_pop(path,string).await;
  // }
  // return Ok(());

  
  let string=string.to_lowercase();
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

// Create a boolean flag to indicate whether the search is done or not
let done = Arc::new(RwLock::new(false));

// Create a clone of the Arc for the other thread
let done_clone = Arc::clone(&done);

// Spawn another thread to read and print the hashset periodically
thread::spawn(move || {
  let mut last_print = Instant::now(); // initialize the last print time to the current time

    loop {

    let msval=update.iter().next().unwrap_or(&120);
      if last_print.elapsed() >= Duration::from_millis(*msval) { 

        // Read the hashset with a read lock
        let ret = ret_clone.read().unwrap();
        
      app_handle.emit_to(
          "main",
          "load-sresults",
          serde_json::to_string(&ret.clone()).unwrap(),
        )
        .map_err(|e| e.to_string()).unwrap();
      
     

              
        // println!("{:?}", *ret);
        println!("{:?}", ret.len());
        // Drop the lock before sleeping
        drop(ret);
        // Check the flag with a read lock
        let done = done_clone.read().unwrap();
        // If the flag is true, break out of the loop
        if *done {
          // app_handle.emit_to(
          //   "main",
          //   "load-complete",
          //   "",
          // )
          // .map_err(|e| e.to_string()).unwrap();
        
            break;
        }
        // Drop the lock before reading the hashset
        drop(done);
        // Sleep for some time
        last_print = Instant::now(); // update the last print time to the current time
      }
        thread::sleep(std::time::Duration::from_millis(30));
    }
});

// Populate the hashset using par_iter and inspect
map.clone()
    .par_iter()
    .filter(|(i, _)| i.contains(&string))
    .flat_map(|(_, y)| y.par_iter())
    .cloned()
    .inspect(|o| {
      let path=Path::new(o);
      let fname=path.file_name().unwrap().to_string_lossy().to_string();
        // Write to the hashset with a write lock
        let mut ret = ret.write().unwrap();
        ret.insert(populatefileitem(fname, path, &state));
        // Drop the lock after inserting
        drop(ret);
    })
    .collect::<String>();

  // Set the flag to true with a write lock
let mut done = done.write().unwrap();
*done = true;

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
// pub struct Searchresults{
//   name:String,
//   path:String,
//   is_dir: bool,
//   size:String,
//   rawfs:u64,
//   lmdate:String,
//   timestamp:i64,
//   foldercon:i32,
//   ftype:String
// }

pub async fn search_pop(path: String,string:String){
  let string=string.to_lowercase();
  // populate_trie(oid, path, ff, window, state).await;
  // return ;
  
  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("hs----{}",startime);
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
            // e.file_name()
            // .to_string_lossy()
            // .to_string().to_lowercase()
            // .contains(&string)
            // &&
            // e.file_type().is_file()
              // e.file_type().is_dir()
          );

        let mut count=RwLock::new(0);
        
        
        let par_walker2 = walker2.par_bridge(); // ignore errors
        
        let k:HashSet<String>=
        par_walker2
        // .enumerate()
        .into_par_iter()  
        .filter_map(
          |i|
          {
          match(i){
            Ok(i) => {
              if((i.file_name()
              .to_string_lossy()
              .to_string().to_lowercase()
              .contains(&string))){
                Some(i.path().to_string_lossy().to_string())
              }
              else{
                None
              }
            },
            Err(_) => None,
          }
        }
        )
        .map(
          |e|
          {
           e
          })
          .collect();

        println!("{}",k.len());
        if(k.len()<20){
          println!("{:?}",k);
        }

        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let endtime = duration.as_secs();
        println!("endtime----{}",endtime-startime);
        
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

