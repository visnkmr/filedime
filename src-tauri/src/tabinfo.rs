use serde::Serialize;
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, list_files};


#[derive(Clone,Debug,Serialize)]
pub struct tabinfo{
    pub id:String,
    pub path:String,
    pub ff:String,
    pub tabname:String,
    pub history:Vec<String>
}

#[derive(Clone,Debug,Serialize)]
pub struct tab{
    pub path:String,
    pub focusfolder:String,
    pub history:Vec<String>
}

#[tauri::command]
pub async fn load_tab(oid:String,window: Window, state: State<'_, AppStateStore>) -> Result<(), String> {
  let (path,_,_)=state.gettab(oid.clone());
  println!("loadtab");
  list_files(oid, path, "newtab".to_string(), window, state).await?;
Ok(())
}
#[tauri::command]
pub async fn closetab(id:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.removetab(id);
  let app_handle = window.app_handle();
  app_handle.emit_to(
    "main",
    "list-tabs",
    serde_json::to_string(&state.gettabs()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  Ok(())
}
#[tauri::command]
pub async fn listtabs(window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  let app_handle = window.app_handle();
  // println!("{:?}",state);
  app_handle.emit_to(
    "main",
    "list-tabs",
    serde_json::to_string(&state.gettabs()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
app_handle.emit_to(
  "main",
  "load-marks",
  serde_json::to_string(&state.getmarks()).unwrap(),
)
.map_err(|e| e.to_string()).unwrap();
Ok(())
}
#[tauri::command]
pub async fn newtab(oid:String,path:String,ff:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.addtab(oid.clone(), path.clone(), ff.clone());
  listtabs(window, state).await;
  Ok(())
}