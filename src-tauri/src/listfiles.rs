use std::{path::PathBuf, time::{SystemTime, UNIX_EPOCH, Instant, Duration}, fs::{self, File}, sync::{Arc, Mutex, RwLock}, thread, io::{BufReader, BufRead}, collections::{HashSet, HashMap}};

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

#[tauri::command]
pub async fn list_files(oid:String,path: String,ff:String, window: Window, state: State<'_, AppStateStore>) -> Result<(), String> {
  println!("lfiles");
  let testpath=PathBuf::from(path.clone());

  if(path.ends_with(".md")){
    loadmarkdown(path,window,state);
    return Ok(());
  }  
  
  if(path.ends_with(".html")
  ||path.ends_with(".htm")){
    loadfromhtml(path,window,state);
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
          populatefileitem(e,&state)
      })
      .inspect(|file| { // inspect each file and push it to the files vector
        let mut files = files.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
        // let mut tfsize = tfsize.lock().unwrap(); // lock the mutex and get a mutable reference to the vector
        *tfsize_clone.lock().unwrap()+=file.rawfs;
        files.push(file.clone()); // push a clone of the file to the vector
    })
      .collect();
   state.print_cache_size();
    
    
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
    app_handle.emit_to(
      "main",
      "stop-timer",
      "",
    )
    .map_err(|e| e.to_string())?;
  
    populate_try(path, &state).await;

    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}",endtime-startime);
    
    
  Ok(())  
}
#[tauri::command]
pub async fn populate_trie(oid:String,path: String,ff:String, window: Window, state: State<'_, AppStateStore>){
// thread::spawn(
    // {
    
    // move||{
        let walker2 = WalkDir::new(&path)
        .contents_first(true)
          .min_depth(1) // skip the root directory
          // .max_depth(1) // only look at the immediate subdirectories
          .into_iter()
          
          .filter_entry(|e| 
            !e.path_is_symlink() 
          &&
          
          !e.path().to_string_lossy().to_string().contains("/.git/")
            // e.file_type().is_dir()
          ) 
          ;

          let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let endtime = duration.as_secs();
        println!("endtime----{}",endtime);

        let mut count=RwLock::new(0);
        
        
        let par_walker2 = walker2.par_bridge(); // ignore errors
        let k:Vec<(String,String)>=par_walker2
        // .enumerate()
        .into_par_iter()  
        .filter_map(Result::ok)
        .map(
          |e| {
            // let path = e.path().to_string_lossy().to_string();
            let path = PathBuf::from(e.path().to_string_lossy().to_string()).file_stem().unwrap().to_string_lossy().to_string();
            (path.to_lowercase(),e.path().to_string_lossy().to_string().to_lowercase())
          }
        )
        .collect(); // collect into a vec
      let st=state.st.clone();
      let mut st=st.lock().unwrap();
      for (i,j) in k{
        st.insert(&i,&j);
        
      }
      drop(st);
      println!("-------c ----{}",count.read().unwrap());
}
fn is_hidden(entry: &DirEntry) -> bool {
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
        par_walker2
        // .enumerate()
        .into_par_iter()  
        .filter_map(Result::ok)
        .for_each(
          |e|
          {
          // println!("{:?}",e.path());
            if(!e.file_type().is_dir()){
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
        );

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

fn populatefileitem(e:DirEntry,state: &State<'_, AppStateStore>)->FileItem{
  let name = e.file_name().to_string_lossy().into_owned(); // get their names
  // println!("{}",name);
  let path=e.path().to_string_lossy().into_owned();
  // println!("-----------{}",path.clone());

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
}