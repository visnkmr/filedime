use serde::Serialize;
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, sendtofrontend::loadmarks, SHARED_STATE};



#[derive(Clone,Debug,Serialize,Eq, Hash, PartialEq,Default)]
pub struct marks{
    pub path:String,
    pub name: String,
    pub is_dir:bool,
    pub id:String
}
#[tauri::command]
pub async fn removemark(windowname:&str,path:String,id:String,window: Window)->Result<(),()>{
  let mut arguments=Vec::new();
  // arguments.push(windowname);
  arguments.push(path);
  arguments.push(id);
  let app_handle = window.app_handle();
  // let (tx, rx) = mpsc::channel();
  loadmarks(windowname, &app_handle, remove_mark(arguments));
  Ok(())
}
pub fn remove_mark(arguments:Vec<String>)->String{
  let path=arguments.get(0).unwrap();
  let id=arguments.get(1).unwrap();
  let state=SHARED_STATE.lock().unwrap();
  state.removemark(path,id);
  serde_json::to_string(&state.getmarks()).unwrap()
}


#[tauri::command]
pub async fn addmark(windowname:&str,path:String,id:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.addmark(path,id);
  let app_handle = window.app_handle();
  // println!("{:?}",state);
  loadmarks(windowname, &app_handle, serde_json::to_string(&state.getmarks()).unwrap());
  
  Ok(())
}