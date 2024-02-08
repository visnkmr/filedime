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
              // if *state.process_count.lock().unwrap() != orig { // check if the current count value is different from the original one
              //   return ; // if yes, it means a new command has been invoked and the old one should be canceled
              // }
            // println!("{:?}",e.path());
            
              // if entry.file_type().map_or(false, |t| t.is_file()) {
              //     let metrics = compute_metrics(entry.path(), features).unwrap(); // ?
              //     *total_bytes.lock().unwrap() += metrics.size;
              //     let result = Entry::File(metrics);
              //     let short_path = if entry.path() == root {
              //         Path::new(entry.path().file_name().expect("unreachable"))
              //     } else {
              //         entry.path().strip_prefix(&root).unwrap() // ?
              //     };
              //     database
              //         .lock()
              //         .unwrap()
              //         .insert(short_path.to_owned(), result);
              // }
              WalkState::Continue
          })
      });
//         let walker2 = 
//         WalkBuilder::new(&path)
//         .hidden(true) // Include hidden files and directories
//         .follow_links(false)
//         // .threads(n)
//         .parents(true)
//         .git_exclude(true)
//         .ignore(true) // Disable the default ignore rules
//         .git_ignore(true) // Respect the .gitignore file
//         .build();
//       // WalkDir::new(&path)
//       //   .contents_first(true)
//       //     .min_depth(1) // skip the root directory
//       //     // .max_depth(1) // only look at the immediate subdirectories
//       //     .into_iter()
          
//       //     .filter_entry(
//       //       |e| 
//       //       !e.path_is_symlink() 
//       //       // &&
//       //       // !e
//       //       // .file_name()
//       //       // .to_str()
//       //       // .map(|s| s.starts_with("."))
//       //       // .unwrap_or(false)
//       //       &&
//       //       !is_hidden(e)
//       //       // &&
//       //       // e.file_type().is_file()
//       //         // e.file_type().is_dir()
//       //     );

//         let mut count=RwLock::new(0);
//         set_enum_value(&state.whichthread, wThread::Populating);
//         let stop_flag_local = Arc::new(AtomicBool::new(true));
        
//         let par_walker2 = walker2;
//         // .par_bridge(); // ignore errors
        
//         // let k:HashSet<String>=
//         // let paths:Vec<String>=
//         par_walker2
        
//         // .enumerate()
//         // .into_par_iter()
//         .filter(|(_)|{

//           let local_thread_controller=stop_flag_local.clone();
//           if(!local_thread_controller.load(Ordering::SeqCst)){
//             eprintln!("thread stopped by local controller");
//             return false;
//           }
//             // println!("{:?}",get_enum_value(&state.whichthread) );

//             if let wThread::Populating = get_enum_value(&state.whichthread) 
//             {
//               // eprintln!("addedtosearch"); 
//             } 
//             else 
//             { 
//               local_thread_controller.store(false, Ordering::SeqCst);
//               eprintln!("thread stopped by global controller");
//               return false;
//             }
//         return true;
//         })
//         .filter_map(Result::ok)
//         .for_each(
//           |e|
//           {
//             // thread::sleep(Duration::from_secs(1));
//             println!("Populating");
//             // let local_thread_controller=stop_flag_local.clone();
//             // if(!local_thread_controller.load(Ordering::SeqCst)){
//             //   eprintln!("thread stopped by local controller");
//             //   return ;
//             // }
//             //   if let wThread::Populating = get_enum_value(&state.whichthread) 
//             //   { eprintln!("addedtosearch");} 
//             //   else 
//             //   { 
//             //     local_thread_controller.store(false, Ordering::SeqCst);
//             //     eprintln!("thread stopped by global controller");
//             //     return ;
//             //   }
//           // return true;
            
//           //   window.emit("reloadlist",json!({
//           //     "message": "pariter5",
//           //     "status": "running",
//           // }));
//             if *state.process_count.lock().unwrap() != orig { // check if the current count value is different from the original one
//               return ; // if yes, it means a new command has been invoked and the old one should be canceled
//             }
//           // println!("{:?}",e.path());
//           if let Some(eft)=(e.file_type()){

//             if(!eft.is_dir())
//             {
              
//               // println!("{:?}",e.path());
//             // }
//             let i = e.path().to_string_lossy().to_string();
//             let name=e.file_name().to_string_lossy().to_string().to_lowercase();
//             let map=state.stl.clone();
//             let mut map =map.lock().unwrap();
//             if let Some(hs) = map.get_mut(&name) {
//                 // If yes, append the value to the existing vector
//                 // if(!hs.contains(&i)){
//                   hs.insert(i);
//                 // }
//             } else {
//                 // If no, create a new vector with the value and insert it into the hashmap
//                 map.insert(name, HashSet::from_iter(vec![i]));
//             }
//           // map.entry(name).or_insert(Vec::new()).push(i);
//           } 
//           }
// // return true;           // e.path().to_string_lossy().to_string()
//         }
//         );
        // .collect();
        // state.st.lock().unwrap().populate_trie(paths);
        // if(!stop_flag_local.load(Ordering::SeqCst)){
        //   return Ok(())
        // }
        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let endtime = duration.as_secs();
        // println!("stl is {:?  }",state);
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
  Ok(())
}
#[tauri::command]
pub async fn searchwhilepopulate(windowname:String,mut path: String,string:String, window:&Window,state: &State<'_, AppStateStore>)->Result<(),String>{
  let orig = *state.process_count.lock().unwrap();
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
    // return Ok(())
  }
  let files = Arc::new(Mutex::new(Vec::<FileItem>::new())); 
  let files_clone = Arc::clone(&files); 
  let tfsize=Arc::new(Mutex::<u64>::new(0));
  let doneornot=Arc::new(Mutex::<bool>::new(false));
  let doneornot_clone=doneornot.clone();
  let mut nootimes=0;
  let tfsize_clone=tfsize.clone();
  // let (tx, rx) = mpsc::channel();
  let window2=window.clone();
  let app_handle = window.app_handle();
  let string2=string.clone();
  let string3=string.clone();

  let windowname2=windowname.clone();
  let update:Vec<u64>=vec![1,2,5,7,10,20,40,65,90,120];
  let mut countoff=0;
  let mut firsttime=true;
  // spawn a new thread to print the value of the files vector every 200 milliseconds
  let handle=thread::spawn(move|| {
    // let state1=state.clone();
    let mut last_print = Instant::now(); // initialize the last print time to the current time
    loop {
      // let string=string.clone();
      // if &s2.lock().unwrap().process_count.lock().unwrap().clone().abs_diff(orig)>&0 { // check if the current count value is different from the original one
      //   break; // if yes, it means a new command has been invoked and the old one should be canceled
      // }
      nootimes+=1;
      
      let mut msval=&(30 as u64);
      if(firsttime||countoff>1)
      {
        if(countoff>1){
          msval=update.iter().next().unwrap_or(&120);
        }
        
        if last_print.elapsed() >= Duration::from_millis(*msval) { 
          let files = files_clone.lock().unwrap();
          countoff=files.len();
          if(countoff>1){
            firsttime=false;
          }
      let don = doneornot.lock().unwrap();
            // check if 200 milliseconds have passed since the last print
              
              // println!("{}------{}----{}",nootimes,files.len(),fcount);
                //           // push the file item to the vector
                // totsize+=mem::size_of_val(&file);
                // match(files.last()){
                //   Some(file)=>{
                //     println!("{} out of {} \t---{}",files.len(),fcount,file.name);
    
                //   },
                //   None=>{
    
                //   }
                // }
                slist(&windowname,&app_handle,&files.clone(),string2.clone());
                
                // folsize(&windowname.clone(),&app_handle,sizeunit::size(*tfsize.lock().unwrap(),true));
                
                if *don 
                // || nootimes>10
                // || fcount==files.len() 
                {
                println!("total {} files found from {}",files.len(),"unknown");
                // window2.emit("infiniteloader",
                //   json!({
                //       "message": "lfiles",
                //       "status": "stop",
                //       })
                //   );
                // handle.abort();
                // stoptimer(&windowname, &window.app_handle());
                break;
              }
      }
     // lock the mutex and get a reference to the vector
            // println!("Files: {:?}", files); // print the vector value
            last_print = Instant::now(); // update the last print time to the current time
        }
        thread::sleep(Duration::from_millis(30)); // sleep for 10 milliseconds to avoid busy waiting
    }
  })
  ; 
  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("hs----{}",startime);
  // populate_trie(oid, path, ff, window, state).await;
  // return ;
  

  // thread::spawn(
    // {
      // let st=state.searchtry.clone();
    
    // move||{
      let threads = (num_cpus::get() as f64 * 0.75).round() as usize;

      WalkBuilder::new(&path)
      .threads(threads)
      .hidden(true) // Include hidden files and directories
      .follow_links(false)
      // .threads(n)
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
                  
                  if(!eft.is_dir())
                  {
                    
                    // println!("{:?}",e.path());
                  // }
                  let i = e.path().to_string_lossy().to_string();
                  let name=e.file_name().to_string_lossy().to_string().to_lowercase();
                  let map=state.stl.clone();
                  let mut map =map.lock().unwrap();
                //   let mut shouldinclude=if(!false){
                //     memoisedfm(i.clone(), string3)>0
                //  }
                //  else{

                //    i.contains(&string3)
                //  };
                  if let Some(hs) = map.get_mut(&name) {
                      // If yes, append the value to the existing vector
                      // if(!hs.contains(&i)){
                        hs.insert(i.clone());
                        
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
                println!("unknown filetype");
              }
            }
              // if *state.process_count.lock().unwrap() != orig { // check if the current count value is different from the original one
              //   return ; // if yes, it means a new command has been invoked and the old one should be canceled
              // }
            // println!("{:?}",e.path());
            
              // if entry.file_type().map_or(false, |t| t.is_file()) {
              //     let metrics = compute_metrics(entry.path(), features).unwrap(); // ?
              //     *total_bytes.lock().unwrap() += metrics.size;
              //     let result = Entry::File(metrics);
              //     let short_path = if entry.path() == root {
              //         Path::new(entry.path().file_name().expect("unreachable"))
              //     } else {
              //         entry.path().strip_prefix(&root).unwrap() // ?
              //     };
              //     database
              //         .lock()
              //         .unwrap()
              //         .insert(short_path.to_owned(), result);
              // }
              WalkState::Continue
          })
      });
//         let walker2 = 
//         WalkBuilder::new(&path)
//         .hidden(true) // Include hidden files and directories
//         .follow_links(false)
//         // .threads(n)
//         .parents(true)
//         .git_exclude(true)
//         .ignore(true) // Disable the default ignore rules
//         .git_ignore(true) // Respect the .gitignore file
//         .build();
//       // WalkDir::new(&path)
//       //   .contents_first(true)
//       //     .min_depth(1) // skip the root directory
//       //     // .max_depth(1) // only look at the immediate subdirectories
//       //     .into_iter()
          
//       //     .filter_entry(
//       //       |e| 
//       //       !e.path_is_symlink() 
//       //       // &&
//       //       // !e
//       //       // .file_name()
//       //       // .to_str()
//       //       // .map(|s| s.starts_with("."))
//       //       // .unwrap_or(false)
//       //       &&
//       //       !is_hidden(e)
//       //       // &&
//       //       // e.file_type().is_file()
//       //         // e.file_type().is_dir()
//       //     );

//         let mut count=RwLock::new(0);
//         set_enum_value(&state.whichthread, wThread::Populating);
//         let stop_flag_local = Arc::new(AtomicBool::new(true));
        
//         let par_walker2 = walker2;
//         // .par_bridge(); // ignore errors
        
//         // let k:HashSet<String>=
//         // let paths:Vec<String>=
//         par_walker2
        
//         // .enumerate()
//         // .into_par_iter()
//         .filter(|(_)|{

//           let local_thread_controller=stop_flag_local.clone();
//           if(!local_thread_controller.load(Ordering::SeqCst)){
//             eprintln!("thread stopped by local controller");
//             return false;
//           }
//             // println!("{:?}",get_enum_value(&state.whichthread) );

//             if let wThread::Populating = get_enum_value(&state.whichthread) 
//             {
//               // eprintln!("addedtosearch"); 
//             } 
//             else 
//             { 
//               local_thread_controller.store(false, Ordering::SeqCst);
//               eprintln!("thread stopped by global controller");
//               return false;
//             }
//         return true;
//         })
//         .filter_map(Result::ok)
//         .for_each(
//           |e|
//           {
//             // thread::sleep(Duration::from_secs(1));
//             println!("Populating");
//             // let local_thread_controller=stop_flag_local.clone();
//             // if(!local_thread_controller.load(Ordering::SeqCst)){
//             //   eprintln!("thread stopped by local controller");
//             //   return ;
//             // }
//             //   if let wThread::Populating = get_enum_value(&state.whichthread) 
//             //   { eprintln!("addedtosearch");} 
//             //   else 
//             //   { 
//             //     local_thread_controller.store(false, Ordering::SeqCst);
//             //     eprintln!("thread stopped by global controller");
//             //     return ;
//             //   }
//           // return true;
            
//           //   window.emit("reloadlist",json!({
//           //     "message": "pariter5",
//           //     "status": "running",
//           // }));
//             if *state.process_count.lock().unwrap() != orig { // check if the current count value is different from the original one
//               return ; // if yes, it means a new command has been invoked and the old one should be canceled
//             }
//           // println!("{:?}",e.path());
//           if let Some(eft)=(e.file_type()){

//             if(!eft.is_dir())
//             {
              
//               // println!("{:?}",e.path());
//             // }
//             let i = e.path().to_string_lossy().to_string();
//             let name=e.file_name().to_string_lossy().to_string().to_lowercase();
//             let map=state.stl.clone();
//             let mut map =map.lock().unwrap();
//             if let Some(hs) = map.get_mut(&name) {
//                 // If yes, append the value to the existing vector
//                 // if(!hs.contains(&i)){
//                   hs.insert(i);
//                 // }
//             } else {
//                 // If no, create a new vector with the value and insert it into the hashmap
//                 map.insert(name, HashSet::from_iter(vec![i]));
//             }
//           // map.entry(name).or_insert(Vec::new()).push(i);
//           } 
//           }
// // return true;           // e.path().to_string_lossy().to_string()
//         }
//         );
        // .collect();
        // state.st.lock().unwrap().populate_trie(paths);
        // if(!stop_flag_local.load(Ordering::SeqCst)){
        //   return Ok(())
        // }
        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let endtime = duration.as_secs();
        // println!("stl is {:?  }",state);
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
  Ok(())
}

