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
  trie::TrieNode, 
  fileitem::populatefileitem, 
  filltrie::populate_try, 
  sendtofrontend::*, startup, opendialogwindow, getuniquewindowlabel, drivelist::get_drives, 
  // loadjs::loadjs
};
#[derive(Serialize,Clone,Debug,PartialEq,Hash,Eq)]
struct DriveItem{
  pub name: String,
  pub mount_point: String,
  pub total: String,
  pub free: String,
  pub is_removable: bool,
  pub disk_type: String,
  pub file_system: String,
}
fn populatedrivelist()->Vec<DriveItem>{
  get_drives().unwrap().array_of_drives.iter().map(|ed|{
    
    return DriveItem { 
      name:ed.name.clone(),
      mount_point:ed.mount_point.clone(),
      total:ed.total.clone(),
      free:ed.free.clone(),
      is_removable:ed.is_removable.clone(),
      disk_type:ed.disk_type.clone(),
      file_system:ed.file_system.clone(),
  }
  }).collect::<Vec<DriveItem>>()
}
#[tauri::command]
pub async fn list_files(windowname:String,oid:String,mut path: String,ff:String, window: Window, state: State<'_, AppStateStore>) -> Result<(), String> {
  println!("lfiles");

  if(path=="drives://"){
    // driveslist(&windowname.clone(),&window.app_handle(),&serde_json::to_string(&populatedrivelist().clone()).unwrap()).unwrap();
    // list_files(windowname, oid, path, ff, window, state);
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
  // window.emit("infiniteloader",
  //       json!({
  //           "message": "lfiles",
  //           "status": "start",
  //           })
  //       );
  // Pathresolver::new()
  
  // if(path=="./"){
  //   path="/home/roger/Downloads/github/notes/".to_string();
  // }

  let wname=windowname.clone();
  let testpath=PathBuf::from(path.clone());

  if(!testpath.exists() && path!="drives://"){
    opendialogwindow(&window.app_handle(), "Error #404: File not found", "File not found.",&getuniquewindowlabel());
    return Ok(())
  }
  // if(path.ends_with(".md")){
  //   loadmarkdown(&windowname,path,window,state);
  //   return Ok(());
  // }  
  
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
    return Err("Opened file".to_string());
  }

  if(!testpath.is_dir()  && path!="drives://"){
    opendialogwindow(&window.app_handle(), "Error #400: Unknown file type", "unknown file type",&getuniquewindowlabel());
    return Ok(())
  }
  window.emit_to(&wname,"reloadlist","resettable").unwrap();
  
  let orig = *state.process_count.lock().unwrap();

  state.filesetcollection.write().unwrap().clear();
  sendfilesetcollection(&wname,&window.app_handle(),&serde_json::to_string(&*state.filesetcollection.read().unwrap()).unwrap());


  // else{
  //   match(testpath.read_dir()){
  //     Ok(mut k)=>{
  //       if(k.next().is_none()){
  //         println!("path empty.");
  //         showdialog(&windowname,&window.app_handle(),"path empty");
  //         return Ok(());
  //       }
  //     },
  //     Err(_)=>{

  //     }
  //   }
  // } 
  // state.addtab(oid, path.clone(), ff);
  newtab(&windowname,oid.clone(), path.clone(), ff.clone(), window.clone(), state.clone()).await;
 
  // convert the path to a PathBuf
  // let path = PathBuf::from(path);
let parent=testpath.clone();
  let app_handle = window.app_handle();
  sendparentloc(&windowname,&app_handle, parent.to_string_lossy().to_string(),&oid)?;
println!("parent------{:?}",parent.to_string_lossy().to_string());

  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("{:?}----{}",parent,startime);
  // get the app handle from the window

  starttimer(&windowname,&app_handle)?;
  println!("start timer");
  loadhistory(&windowname,&app_handle,
    serde_json::to_string(
      &state.gettab(&oid,windowname.clone()).2
    ).unwrap())?;
    println!("load history");
    let threads = (num_cpus::get() as f64 * 0.75).round() as usize;

    // let mut fcount;
    let walker = 
        WalkBuilder::new(&path)
        .max_depth(Some(1))
        .threads(threads)
        .hidden(true) // Include hidden files and directories
        .follow_links(false)
        .parents(true)
        
        .git_exclude(true)
        .ignore(false) // Disable the default ignore rules
        .git_ignore(true).clone();
      let walker2=walker.clone() // Respect the .gitignore file
        .build(); 
      let walker3 = 
        walker.clone() // Respect the .gitignore file
        .build();
      // WalkDir::new(&path)
      //   .contents_first(true)
      //     .min_depth(1) // skip the root directory
      //     // .max_depth(1) // only look at the immediate subdirectories
      //     .into_iter()
          
      //     .filter_entry(
      //       |e| 
      //       !e.path_is_symlink() 
      //       // &&
      //       // !e
      //       // .file_name()
      //       // .to_str()
      //       // .map(|s| s.starts_with("."))
      //       // .unwrap_or(false)
      //       &&
      //       !is_hidden(e)
      //       // &&
      //       // e.file_type().is_file()
      //         // e.file_type().is_dir()
      //     );

        
        let par_walker2 = walker2.par_bridge(); // ignore errors
        let par_walker3 = walker3.par_bridge(); // ignore errors
        
        // let k:HashSet<String>=
        // let paths:Vec<String>=
        let fcount=par_walker2
        
        // .enumerate()
        .into_par_iter()
        
        .filter_map(
          {
            println!("reading to list files...");
          Result::ok
})
        .count();
  // match(fs::read_dir(&path)){
  //   Ok(rv)=>{
  //     fcount=rv.par_bridge()
  //     .filter(|e|{
  //       match(e){
  //         Ok(rv)=>{
  //           !rv.file_name().to_string_lossy().to_string().ends_with(".git")
  //         },
  //         Err(_)=>{
  //           false
  //         }
  //       }
  //     }) // create a parallel iterator from a sequential one
  //     .count();
  //   },
  //   _=>{
  //     println!("failed to read file");
  //     stoptimer(&windowname, &window.app_handle())?;
  //     return Err("Cannot open the file/folder".to_string())
  //   }
    
  // }
  println!("read dir done on path");

          ; // count the number of items in parallel
// let fcount=fs::read_dir(&path).unwrap().count();
// println!("folders---{}",fcount);
folcount(&windowname,&app_handle, fcount)?;
println!("folcount sent");


if let Some(granloc)=parent.parent(){
  sendgparentloc(&windowname,&app_handle,granloc.to_string_lossy().to_string())?;
}
set_enum_value(&state.whichthread, wThread::Listing);
// let s1=Arc::new(Mutex::new(state));
// let s2=Arc::clone(&s1);
// let mut tfsize=0;
let files = Arc::new(Mutex::new(Vec::<FileItem>::new())); 
let files_clone = Arc::clone(&files); 
let tfsize=Arc::new(Mutex::<u64>::new(0));
let doneornot=Arc::new(Mutex::<bool>::new(false));
let doneornot_clone=doneornot.clone();
let mut nootimes=0;
let tfsize_clone=tfsize.clone();
// let (tx, rx) = mpsc::channel();
let window2=window.clone();
let windowname2=windowname.clone();
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
          let don = doneornot.lock().unwrap();
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
            
              // fileslist(&&windowname,&app_handle,&serde_json::to_string(&files.clone()).unwrap());
          
          folsize(&windowname.clone(),&app_handle,sizeunit::size(*tfsize.lock().unwrap(),true));
          
          if *don || fcount==files.len() {
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

set_enum_value(&state.whichthread, wThread::Listing);
let stop_flag_local = Arc::new(AtomicBool::new(true));

// thread::spawn(move || {
//   thread::sleep(Duration::from_secs(1));
//   set_enum_value((&state.whichthread), wThread::None)
// });
//    let mut finder = ;
  let walker = par_walker3 // only look at the immediate subdirectories
      .into_par_iter()
      
      // .filter_entry(|e| e.file_type().is_dir()) // only yield directories
      .filter_map(|e|{

        e.ok()
      }
      )
    .filter(|(_)|{

      let local_thread_controller=stop_flag_local.clone();
      if(!local_thread_controller.load(Ordering::SeqCst)){
        eprintln!("thread stopped by local controller");
        return false;
      }
      let mut global_thread_controller= true;
      // println!("{:?}",get_enum_value(&state.whichthread) );

        if let wThread::Listing = get_enum_value(&state.whichthread) 
        { global_thread_controller= true; } 
        else 
        { global_thread_controller= false; }
      if !global_thread_controller {
        local_thread_controller.store(false, Ordering::SeqCst);
        eprintln!("thread stopped by global controller");
        return false;
    }
    return true;
    })
    // .filter(|rv|{
    //       !rv.file_name().to_string_lossy().to_string().ends_with(".git")

    // })
    // .filter(
    //    |entry| {
    //    let path = entry.path();
    //    path.is_file() 
    //    &&
    //    !path.is_symlink() 
    //    &&
    //    !path.to_string_lossy().to_string().contains("/.git")
    // })
    .for_each_with(Arc::clone(&state.whichthread),|(threadcontroller),e| {
      // if let wThread::Listing= get_enum_value(&threadcontroller){
            window.emit("reloadlist",json!({
                "message": "pariter1",
                "status": "running",
            }));
            
          // }
          // else{
          //   return
          // }

          // println!("{}",e.file_name().to_string_lossy().to_string());
        //  println!("{:?}",e);
          // if(e.file_name().to_string_lossy().to_string().ends_with(".git"))
          // {
          //   println!(".git folder found. skipping it");
          //   return Err("error"); // return an error to stop the iteration
          // }
          
          let file = populatefileitem(e.file_name().to_string_lossy().to_string(),e.path(),&window,&state);
          let mut files = files.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
          // println!("{:?}",file);
          // println!("added--->{:?}",e);
          *tfsize_clone.lock().unwrap()+=file.rawfs;
          files.push(file.clone()); // push a clone of the file to the vector
          // if files.len()<100
          // {
            fileslist(&windowname2.clone(),&window.app_handle(),&serde_json::to_string(&file.clone()).unwrap()).unwrap();
            progress(&windowname2.clone(),&window.app_handle(),files.len() as i32);
          // }

          // Ok(()) // return Ok to continue the iteration
      })
      ;
      // println!("{:?}",i);
      // if let Err(e) = i {
      //     println!("Error: {:?}", e);
      // }
      *doneornot_clone.lock().unwrap()=true;
      // .collect();
   state.print_cache_size();
    
    
    // wait for the printing thread to finish (it won't unless you terminate it)
    handle.join().unwrap();
  
    let app_handle=window.clone().app_handle();
    // fileslist(&wname,&app_handle.clone(),&serde_json::to_string(&files.lock().unwrap().clone()).unwrap())?;
  
    folsize(&wname,&app_handle,sizeunit::size(*tfsize_clone.lock().unwrap(),true))?;
    // sort the vector by name
    // files.sort_by(|a, b| a.name.cmp(&b.name));
    // emit an event to the frontend with the vector as payload
    println!("reachedhere");
    // window.emit("infiniteloader",
    //     json!({
    //         "message": "lfiles",
    //         "status": "stop",
    //         })
    //     );
          // let io=fscs.clone();
          // drop(fscs);
          sendfilesetcollection(&wname,&app_handle,&serde_json::to_string(&*state.filesetcollection.read().unwrap()).unwrap());
    // loadcomplete(&wname, &app_handle);
    // println!("{:?}",serde_json::to_string(&files.clone()).unwrap());
    stoptimer(&wname,&app_handle)?;
  
    if(*state.loadsearchlist.read().unwrap()){
      populate_try(path, &window,&state).await;
    }

    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}",endtime-startime);
    
  startup(&window.app_handle());
    
  Ok(())  
}
