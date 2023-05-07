use std::{path::PathBuf, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::HashSet};

use rayon::prelude::*;
use tauri::{Window, State, Manager};
use walkdir::WalkDir;

use crate::{markdown::loadmarkdown, 
  openpath, 
  tabinfo::newtab, 
  FileItem, sizeunit, 
  lastmodcalc::lastmodified, 
  appstate::AppStateStore, openhtml::loadfromhtml, trie::TrieNode, 
  // loadjs::loadjs
};

#[tauri::command]
pub async fn searchandlist(oid:String,path: String,ff:String, window: Window, state: State<'_, AppStateStore>) -> Result<(), String> {
  println!("snlist");
  let testpath=PathBuf::from(path.clone());

  // state.addtab(oid, path.clone(), ff);
  newtab(oid.clone(), path.clone(), ff.clone(), window.clone(), state.clone()).await;
  
  // convert the path to a PathBuf
  // let path = PathBuf::from(path);
let parent=testpath.clone();
  let app_handle = window.app_handle();

  app_handle.emit_to(
    "main",
    "parent-loc",
    parent.to_string_lossy().to_string(),
  )
  .map_err(|e| e.to_string()).unwrap();

println!("parent------{:?}",parent.to_string_lossy().to_string());

  let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("{:?}----{}",parent,startime);
  // get the app handle from the window

  let app_handle2 = app_handle.clone();
  app_handle.emit_to(
    "main",
    "start-timer",
    "",
  )
  .map_err(|e| e.to_string())?; 

app_handle.emit_to(
    "main",
    "load-hist",
    serde_json::to_string(&state.gettab(oid.clone()).2).unwrap(),
  )
  .map_err(|e| e.to_string())?;
  let fcount = fs::read_dir(&path)
          .unwrap()
          .par_bridge() // create a parallel iterator from a sequential one
          .count(); // count the number of items in parallel
// let fcount=fs::read_dir(&path).unwrap().count();
// println!("folders---{}",fcount);
app_handle.emit_to(
  "main",
  "folder-count",
  fcount,
)
.map_err(|e| e.to_string())?;
if let Some(granloc)=parent.parent(){
  app_handle.emit_to(
  "main",
  "grandparent-loc",
  granloc.to_string_lossy().to_string(),
)
.map_err(|e| e.to_string())?;
}



// let mut tfsize=0;
let files = Arc::new(Mutex::new(Vec::<FileItem>::new())); 
let files_clone = Arc::clone(&files); 
let tfsize=Arc::new(Mutex::<u64>::new(0));
let tfsize_clone=tfsize.clone();
// let (tx, rx) = mpsc::channel();
let update:Vec<u64>=vec![1,2,5,7,10,20,40,65,90,120];
// spawn a new thread to print the value of the files vector every 200 milliseconds
let handle=thread::spawn(move || {
  
  let mut last_print = Instant::now(); // initialize the last print time to the current time
  loop {
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
            app_handle2.emit_to(
              "main",
              "list-files",
              serde_json::to_string(&files.clone()).unwrap(),
            )
            .map_err(|e| e.to_string()).unwrap();
          
          app_handle2.emit_to(
              "main",
              "folder-size",
              {
                sizeunit::size(*tfsize.lock().unwrap(),true)
              },
            )
            .map_err(|e| e.to_string()).unwrap();
          if(fcount==files.len()){
            break;
          }
   // lock the mutex and get a reference to the vector
          // println!("Files: {:?}", files); // print the vector value
          last_print = Instant::now(); // update the last print time to the current time
      }
      thread::sleep(Duration::from_millis(30)); // sleep for 10 milliseconds to avoid busy waiting
  }
});
//    let mut finder = ;
  let walker = WalkDir::new(&path)
      .min_depth(1) // skip the root directory
      .max_depth(1) // only look at the immediate subdirectories
      .into_iter()
      
      // .filter_entry(|e| e.file_type().is_dir()) // only yield directories
      .filter_map(|e| e.ok());
    let par_walker = walker.par_bridge(); // ignore errors
    let files: Vec<FileItem>=par_walker
    .into_par_iter()
  //   .filter(
    //    |entry| {
    //    let path = entry.path();
    //    path.is_file() 
    //    &&
    //    !path.is_symlink() 
    //    &&
    //    !path.to_string_lossy().to_string().contains("/.git")
  // })
    .map(|(e)| {
          // if(e.file_name().to_string_lossy().to_string().contains(".git"))
          // {
          //   return FileItem{
              
          //   };
          // }
          let name = e.file_name().to_string_lossy().into_owned(); // get their names
          // println!("{}",name);
          let path=e.path().to_string_lossy().into_owned();
          println!("-----------{}",path.clone());
          // let size = fs::metadata(e.path()).map(|m| m.len()).unwrap_or(0); // get their size
          let size=
          if(!e.path().is_symlink()){
            state.find_size(&path)
          }
          else{
            0
          };
          // let size=0;
          let foldercon=0;
          // let foldercon=state.foldercon(&path); //counts number of folders using hashmap..slows things down
          let is_dir = fs::metadata(e.path()).map(|m| m.is_dir()).unwrap_or(false); // check if folder
          let path = e.path().to_string_lossy().into_owned(); // get their path
          // fs::metadata(e.path()).map(|m|{
          //   if(!m.is_dir()){
              
          //   }
          // }).unwrap_or(0); .
          let mut folderloc=0;
          let mut filetype="Folder".to_string();
          let issymlink=e.path().is_relative() ||e.path().is_symlink();
          if(issymlink){
            filetype+="symlink";
          }
          if !e.path().is_dir(){
            
            match(e.path().extension()){
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
                  if let Ok(file) = File::open(e.path()){ // open the file
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
          let (lmdate,timestamp)=lastmodified(&path);
          FileItem { 
            name:name.clone(),
            path:path.clone(),
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
      })
      .inspect(|file| { // inspect each file and push it to the files vector
        let mut files = files.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
        // let mut tfsize = tfsize.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
        *tfsize_clone.lock().unwrap()+=file.rawfs;
        files.push(file.clone()); // push a clone of the file to the vector
    })
      .collect();
   state.print_cache_size();
    
    // populate_try(oid, path, ff, window, state).await;
    
    // wait for the printing thread to finish (it won't unless you terminate it)
    handle.join().unwrap();
    app_handle.emit_to(
      "main",
      "list-files",
      serde_json::to_string(&files.clone()).unwrap(),
    )
    .map_err(|e| e.to_string())?;
  
  app_handle.emit_to(
      "main",
      "folder-size",
      {
        sizeunit::size(*tfsize_clone.lock().unwrap(),true)
      },
    )
    .map_err(|e| e.to_string())?;
    // sort the vector by name
    // files.sort_by(|a, b| a.name.cmp(&b.name));
    // emit an event to the frontend with the vector as payload
    println!("reachedhere");
    // println!("{:?}",serde_json::to_string(&files.clone()).unwrap());
    

    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}",endtime-startime);
    
    app_handle.emit_to(
      "main",
      "stop-timer",
      "",
    )
    .map_err(|e| e.to_string())?;
  Ok(())  
}