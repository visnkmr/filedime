use serde::Serialize;
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore};

#[derive(Clone,Debug,Serialize)]
pub struct marks{
    pub path:String,
    pub name: String,
}
#[tauri::command]
pub async fn removemark(path:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.removemark(path);
  let app_handle = window.app_handle();
  app_handle.emit_to(
    "main",
    "load-marks",
    serde_json::to_string(&state.getmarks()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  Ok(())
}


#[tauri::command]
pub async fn addmark(path:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.addmark(path);
  let app_handle = window.app_handle();
  println!("{:?}",state);
  app_handle.emit_to(
    "main",
    "load-marks",
    serde_json::to_string(&state.getmarks()).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  Ok(())
}