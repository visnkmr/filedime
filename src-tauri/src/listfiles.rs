use std::{path::{PathBuf, Path}, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock, atomic::{Ordering, AtomicBool}}, thread, io::{BufReader, BufRead}, collections::{HashSet, HashMap}};

use ignore::WalkBuilder;
use rayon::prelude::*;
use serde::Serialize;
use serde_json::json;
use tauri::{Window, State, Manager};
// use walkdir::{WalkDir, DirEntry};

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit, 
  lastmodcalc::lastmodified, 
  appstate::{AppStateStore, get_enum_value, wThread, set_enum_value}, 
  openhtml::loadfromhtml, 
  fileitem::populatefileitem, 
  filltrie::populate_try, 
  sendtofrontend::*, startup, opendialogwindow, getuniquewindowlabel, drivelist::{get_drives, get_disks}, 
  // loadjs::loadjs
};


#[tauri::command]
pub async fn checkiffile(path: String) -> Result<(),()> {
  
  if(PathBuf::from(&path).is_file()){
    return Ok(())
  }
  else{
    return Err(())
  }
}
  #[tauri::command]
pub async fn list_files(starttime:String,windowname:String,oid:String,mut path: String,ff:String, window: Window, state: State<'_, AppStateStore>) -> Result<(), String> {
  startup(&window.app_handle());
  println!("lfiles");
  let ignorehiddenfiles=*state.excludehidden.read().unwrap();
  if(path=="drives://"){
    match(dirs::home_dir()){
    Some(spath) => {
      path=spath.to_string_lossy().to_string();
      sendparentloc(&windowname,&window.app_handle(), path.to_string(),&oid)?;

    },
    None => {
      return Err("home not found".to_string())
    },
};
    // return Ok(())
  } 
  else if(path=="downloads://"){
  match(dirs::download_dir()){
    Some(spath) => {
      path=spath.to_string_lossy().to_string();
      sendparentloc(&windowname,&window.app_handle(), path.to_string(),&oid)?;

    },
    None => {
      return Err("home not found".to_string())
    },
  };
    // return Ok(())
  } 
  else if(path=="documents://"){
    // list_files(windowname, oid, path, ff, window, state);
  match(dirs::document_dir()){
    Some(spath) => {
      path=spath.to_string_lossy().to_string();
      sendparentloc(&windowname,&window.app_handle(), path.to_string(),&oid)?;

    },
    None => {
      return Err("home not found".to_string())
    },
  };
    // return Ok(())
  } 
  // window.emit("infiniteloader",
  //       json!({
  //           "message": "lfiles",
  //           "status": "start",
  //           })
  //       );
  
    lct(&windowname, &window.app_handle(), starttime.clone());
  let wname=windowname.clone();
  let testpath=PathBuf::from(path.clone());

  if(!testpath.exists() && path!="drives://"){
    opendialogwindow(&window.app_handle(), "Error #404: File not found", "File not found.",&windowname);
    return Ok(())
  }
  
  // if(path.ends_with(".html")
  // ||path.ends_with(".htm")){
  //   loadfromhtml(&windowname,path,window,state);
  //   return Ok(());
  // }
  
  // if(path.ends_with(".js")){
  //   loadjs(path,window,state);
  //   return Ok(());
  // }

  if(testpath.is_file()){
    openpath(path).await?;
    return Err("Opened file".to_string());
  }

  if(!testpath.is_dir()){
    opendialogwindow(&window.app_handle(), "Error #400: Unknown file type", "unknown file type",&windowname);
    return Ok(())
  }
  window.emit_to(&wname,"reloadlist","resettable").unwrap();
  
  let orig = *state.process_count.lock().unwrap();

  state.filesetcollection.write().unwrap().clear();
  //empty existing filesetcollection
  sendfilesetcollection(&wname,&window.app_handle(),&serde_json::to_string(&*state.filesetcollection.read().unwrap()).unwrap());

  //create new tab
  newtab(&windowname,oid.clone(), path.clone(), ff.clone(), window.clone(), state.clone()).await;
 
let parent=testpath.clone();

  // get the app handle from the window
  let app_handle = window.app_handle();
  sendparentloc(&windowname,&app_handle, parent.to_string_lossy().to_string(),&oid)?;

  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("{:?}----{}",parent,startime);

  starttimer(&windowname,&app_handle)?;
  println!("start timer");
    let threads = (num_cpus::get() as f64 * 0.75).round() as usize;

    //init tree walker to nav file tree
    let walker = 
        WalkBuilder::new(&path)
        
        .max_depth(Some(1))
        .threads(threads)
        .hidden(ignorehiddenfiles) // Include hidden files and directories
        .follow_links(false)
        .parents(true)
        .git_exclude(true)
        .ignore(true) // Disable the default ignore rules
        .git_ignore(true)
        .clone();
      let walker2=walker.clone() // Respect the .gitignore file
        .build(); 
      let walker3 = 
        walker.clone() // Respect the .gitignore file
        .build();

        
        let par_walker2 = walker2.par_bridge(); // ignore errors
        let par_walker3 = walker3.par_bridge(); // ignore errors
        // count the number of items in parallel
        let fcount=par_walker2
        .into_par_iter()
        .filter_map(
          {
            // println!("reading to list files...");
          Result::ok
})
        .count();
  
  println!("read dir done on path");

folcount(&windowname,&app_handle, fcount)?;
println!("folcount sent");


// if let Some(granloc)=parent.parent(){
//   sendgparentloc(&windowname,&app_handle,granloc.to_string_lossy().to_string())?;
// }

set_enum_value(&state.whichthread, wThread::Listing);
let files = Arc::new(Mutex::new(Vec::<FileItem>::new())); 
let files_clone = Arc::clone(&files); 
let tfsize=Arc::new(Mutex::<u64>::new(0));
let doneornot=Arc::new(Mutex::<bool>::new(false));
let doneornot_clone=doneornot.clone();
let tfsize_clone=tfsize.clone();
let window2=window.clone();
let windowname2=windowname.clone();
let windowname3=windowname.clone();

//init random interval to send updates to UI
let update:Vec<u64>=vec![1,2,5,7,10,20,40,65,90,120];
// spawn a new thread to print the value of the files vector every 200 milliseconds
let handle=thread::spawn(move|| {
  let mut last_print = Instant::now(); // initialize the last print time to the current time
  loop {
    let msval=update.iter().next().unwrap_or(&120);

    // check milliseconds passed since the last print
      if last_print.elapsed() >= Duration::from_millis(*msval) { 
          let files = files_clone.lock().unwrap();
          let don = doneornot.lock().unwrap();
          
          folsize(&windowname.clone(),&app_handle,
          serde_json::to_string(&json!({
            "caller":startime,
            "size":sizeunit::size(*tfsize.lock().unwrap(),true)
          })).unwrap(),
          );
          let wn=windowname3.clone();
          progress(&wn,&window2.app_handle(),{
            let pv=files.len() as f32/fcount as f32*100 as f32;
            println!("{}",pv);
            pv as i32});
            processing(&windowname.clone(),&window2.app_handle(),{"loading files".to_string()});
          
          if *don || fcount==files.len() {
            processing(&windowname.clone(),&window2.app_handle(),{"completed ".to_string()});
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
   // lock the mutex and get a reference to the vector
          // println!("Files: {:?}", files); // print the vector value
          last_print = Instant::now(); // update the last print time to the current time
      }
      thread::sleep(Duration::from_millis(30)); // sleep for 10 milliseconds to avoid busy waiting
  }
});

  let walker = par_walker3.into_par_iter()
      .filter_map(|e|{
        e.ok()
      }
      )
    
    .for_each(|e| {
          if(!e.path().to_string_lossy().to_string().eq(&path)){
            // thread::sleep(Duration::from_millis(1000));
            // println!("send to frontend  {:?}",e.file_name().to_string_lossy().to_string());
            let file = populatefileitem(e.file_name().to_string_lossy().to_string(),e.path(),&window,&state);
            let mut files = files.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
            // println!("{:?}",file);
            // println!("added--->{:?}",e);
            *tfsize_clone.lock().unwrap()+=file.rawfs;

            //send each file to frontend
            files.push(file.clone()); // push a clone of the file to the vector
              fileslist(&windowname2.clone(),&window.app_handle(),&serde_json::to_string(&json!({
                "caller":starttime,
                "files":&serde_json::to_string(&file.clone()).unwrap(),
              })).unwrap());
              
          }

          // Ok(()) // return Ok to continue the iteration
      });
      *doneornot_clone.lock().unwrap()=true;
      // .collect();
  //  state.print_cache_size();
    
    
    // wait for the printing thread to finish
    handle.join().unwrap();
  
    let app_handle=window.clone().app_handle();

    folsize(&wname,&app_handle,serde_json::to_string(&json!({
      "caller":startime,
      "size":sizeunit::size(*tfsize_clone.lock().unwrap(),true)
    })).unwrap())?;
    println!("reachedhere");
    // window.emit("infiniteloader",
    //     json!({
    //         "message": "lfiles",
    //         "status": "stop",
    //         })
    //     );

sendfilesetcollection(&wname,&app_handle,&serde_json::to_string(&*state.filesetcollection.read().unwrap()).unwrap());;
    stoptimer(&wname,&app_handle)?;
  
    // if(*state.loadsearchlist.read().unwrap()){
    //   populate_try(path, &window,&state).await;
    // }

    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}",endtime-startime);
    
  
    
  Ok(())  
}
