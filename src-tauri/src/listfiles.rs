use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::{HashSet, HashMap}};

use rayon::prelude::*;
use tauri::{Window, State, Manager};
use walkdir::{WalkDir, DirEntry};

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit, 
  lastmodcalc::lastmodified, 
  appstate::AppStateStore, 
  openhtml::loadfromhtml, 
  trie::TrieNode, 
  fileitem::populatefileitem, 
  filltrie::populate_try, 
  sendtofrontend::*, 
  // loadjs::loadjs
};

#[tauri::command]
pub async fn list_files(windowname:String,oid:String,path: String,ff:String, window: Window, state: State<'_, AppStateStore>) -> Result<(), String> {
  let orig = *state.process_count.lock().unwrap();
  println!("lfiles");
  let wname=windowname.clone();
  let testpath=PathBuf::from(path.clone());

  if(path.ends_with(".md")){
    loadmarkdown(&windowname,path,window,state);
    return Ok(());
  }  
  
  if(path.ends_with(".html")
  ||path.ends_with(".htm")){
    loadfromhtml(&windowname,path,window,state);
    return Ok(());
  }
  
  // if(path.ends_with(".js")){
  //   loadjs(path,window,state);
  //   return Ok(());
  // }

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
  newtab(&windowname,oid.clone(), path.clone(), ff.clone(), window.clone(), state.clone()).await;
  
  // convert the path to a PathBuf
  // let path = PathBuf::from(path);
let parent=testpath.clone();
  let app_handle = window.app_handle();
  sendparentloc(&windowname,&app_handle, parent.to_string_lossy().to_string())?;
println!("parent------{:?}",parent.to_string_lossy().to_string());

  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("{:?}----{}",parent,startime);
  // get the app handle from the window

  starttimer(&windowname,&app_handle)?;
  loadhistory(&windowname,&app_handle,
    serde_json::to_string(
      &state.gettab(oid.clone()).2
    ).unwrap())?;

  let fcount = fs::read_dir(&path)
          .unwrap()
          .par_bridge() // create a parallel iterator from a sequential one
          .count(); // count the number of items in parallel
// let fcount=fs::read_dir(&path).unwrap().count();
// println!("folders---{}",fcount);
folcount(&windowname,&app_handle, fcount)?;

if let Some(granloc)=parent.parent(){
  sendgparentloc(&windowname,&app_handle,granloc.to_string_lossy().to_string())?;
}

// let s1=Arc::new(Mutex::new(state));
// let s2=Arc::clone(&s1);
// let mut tfsize=0;
let files = Arc::new(Mutex::new(Vec::<FileItem>::new())); 
let files_clone = Arc::clone(&files); 
let tfsize=Arc::new(Mutex::<u64>::new(0));
let mut nootimes=0;
let tfsize_clone=tfsize.clone();
// let (tx, rx) = mpsc::channel();
let update:Vec<u64>=vec![1,2,5,7,10,20,40,65,90,120];
// spawn a new thread to print the value of the files vector every 200 milliseconds
let handle=thread::spawn(move|| {
  // let state1=state.clone();
  let mut last_print = Instant::now(); // initialize the last print time to the current time
  loop {
    // if &s2.lock().unwrap().process_count.lock().unwrap().clone().abs_diff(orig)>&0 { // check if the current count value is different from the original one
    //   break; // if yes, it means a new command has been invoked and the old one should be canceled
    // }
    nootimes+=1;
    let msval=update.iter().next().unwrap_or(&120);

      if last_print.elapsed() >= Duration::from_millis(*msval) { 
        // check if 200 milliseconds have passed since the last print
          let files = files_clone.lock().unwrap();
            //           // push the file item to the vector
            // totsize+=mem::size_of_val(&file);
            // match(files.last()){
            //   Some(file)=>{
            //     println!("{} out of {} \t---{}",files.len(),fcount,file.name);

            //   },
            //   None=>{

            //   }
            // }
            
              fileslist(&&windowname,&app_handle,&serde_json::to_string(&files.clone()).unwrap());
          
          folsize(&&windowname,&app_handle,sizeunit::size(*tfsize.lock().unwrap(),true));
          if(fcount==files.len() || nootimes>20){
            // handle.abort();
            break;
          }
   // lock the mutex and get a reference to the vector
          // println!("Files: {:?}", files); // print the vector value
          last_print = Instant::now(); // update the last print time to the current time
      }
      thread::sleep(Duration::from_millis(30)); // sleep for 10 milliseconds to avoid busy waiting
  }
})
;
//    let mut finder = ;
  let walker = WalkDir::new(&path)
      .min_depth(1) // skip the root directory
      .max_depth(1) // only look at the immediate subdirectories
      .into_iter()
      
      // .filter_entry(|e| e.file_type().is_dir()) // only yield directories
      .filter_map(|e| e.ok());
    let par_walker = walker.par_bridge(); // ignore errors
    // let files: Vec<FileItem> =
     if let Ok(i)=par_walker
    .into_par_iter()
    // .filter(
    //    |entry| {
    //    let path = entry.path();
    //    path.is_file() 
    //    &&
    //    !path.is_symlink() 
    //    &&
    //    !path.to_string_lossy().to_string().contains("/.git")
    // })
    .try_for_each(|(e)| {
          // println!("{}",e.file_name().to_string_lossy().to_string());
          if(e.file_name().to_string_lossy().to_string().ends_with(".git"))
          {
            return Err(()); // return an error to stop the iteration
          }
          
          let file = populatefileitem(e.file_name().to_string_lossy().to_string(),e.path(),&state);
          let mut files = files.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
          *tfsize_clone.lock().unwrap()+=file.rawfs;
          files.push(file.clone()); // push a clone of the file to the vector
          Ok(()) // return Ok to continue the iteration
      }){

      }
      // .collect();
   state.print_cache_size();
    
    
    // wait for the printing thread to finish (it won't unless you terminate it)
    handle.join().unwrap();
  
    let app_handle=window.app_handle();
    fileslist(&wname,&app_handle.clone(),&serde_json::to_string(&files.lock().unwrap().clone()).unwrap())?;
  
    folsize(&wname,&app_handle,sizeunit::size(*tfsize_clone.lock().unwrap(),true))?;
    // sort the vector by name
    // files.sort_by(|a, b| a.name.cmp(&b.name));
    // emit an event to the frontend with the vector as payload
    println!("reachedhere");
    loadcomplete(&wname, &app_handle);
    // println!("{:?}",serde_json::to_string(&files.clone()).unwrap());
    stoptimer(&wname,&app_handle)?;
  
    if(*state.loadsearchlist.read().unwrap()){
      populate_try(path, &state).await;
    }

    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}",endtime-startime);
    
    
  Ok(())  
}
