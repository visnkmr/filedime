use std::{collections::HashMap, time::SystemTime, path::PathBuf, fs, thread};

use filetime::FileTime;
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, listfiles::list_files};

pub fn checkifchanged(lopentime:&mut FileTime,path: &PathBuf)->bool{
   
    let metadata = fs::metadata(&path).expect("failed to read file for metadata.");

    // Get the modification time as a FileTime
    let time = FileTime::from_last_modification_time(&metadata);

    // Compare the seconds and nanoseconds of the FileTime
    if lopentime.seconds() != time.seconds() || lopentime.nanoseconds() != time.nanoseconds() {
        // Update the lopentime
        *lopentime = time;
        return true;
    }
    return false;
}
pub fn initinfo(lopentime:&mut FileTime,path: &PathBuf){
    println!("{:?}",path);
    let metadata = fs::metadata(&path).expect("failed to read file for metadata.");
    
//  let file_name =&path.file_stem().unwrap().to_str().unwrap().to_string();
                // if let Ok(time) = FileTime::from_last_modification_time(&metadata) {
                //     *lopentime=time;
                //         // lopentime.insert(file_name.to_string(),time);
                    
                // } else {
                //     println!("Not supported on this platform");
                // }
    *lopentime = FileTime::from_last_modification_time(&metadata);
                
}
#[tauri::command]
pub async fn sendlog(window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
//   state.removetab(id);
  let app_handle = window.app_handle();
  app_handle.emit_to(
    "main",
    "send-log",
    "changed",
  )
  .map_err(|e| e.to_string()).unwrap();
  Ok(())
}

#[tauri::command]
pub fn stopserver(path:String,state: State<'_, AppStateStore>){
    println!("stop server command send");
    let aborted = state.aborted.clone();
    *aborted.lock().unwrap() = true;
    
}

#[tauri::command]
pub fn startserver(pathstr:String,window: Window,state: State<'_, AppStateStore>){
    println!("start server command recieved");
    let aborted = state.aborted.clone();
    *aborted.lock().unwrap() = false;
    
    let mut lopentime=FileTime::now();
  let app_handle = window.app_handle();

    let path=PathBuf::from(pathstr);
    initinfo(&mut lopentime, &path);
    thread::spawn(
        {
            let aborted = state.aborted.clone();
            let app_handle=app_handle.clone();
        move||{
        
        loop{
            if *aborted.lock().unwrap() {
                println!("stopped");
                app_handle.emit_to(
                    "main",
                    "send-log",
                    "stopped",
                  )
                  .map_err(|e| e.to_string()).unwrap();
                break;
            }

            if(checkifchanged(&mut lopentime, &path))
            {
                println!("started");
                // list_files(oid, pathstr, "dontcare".to_string(), window, state);
                app_handle.emit_to(
                    "main",
                    "send-log",
                    "changed",
                  )
                  .map_err(|e| e.to_string()).unwrap();
            }
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    }
});
}