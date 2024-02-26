use prefstore::clearall;
use serde::Serialize;
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, list_files, sendtofrontend::loadmarks, SHARED_STATE};


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
    pub history:Vec<String>,
    pub windowname:String
}
#[tauri::command]
pub async fn closetab(windowname:&str,id:String,window: Window,state: State<'_, AppStateStore>)->Result<(),()>{
  state.removetab(id,windowname.to_string());
  Ok(())
}
fn add_tab(arguments:Vec<String>){
 let oid=arguments.get(0).unwrap();
 let path=arguments.get(1).unwrap();
 let windowname=arguments.get(2).unwrap();
 let state=SHARED_STATE.lock().unwrap();
 state.addtab(oid.clone(), path.clone(), "".to_string(),windowname.clone());

  
}
#[tauri::command]
pub async fn newtab(windowname:&str,oid:String,path:String)->Result<(),()>{
  let mut arguments=vec![];
  arguments.push(oid.clone());
  arguments.push(path.clone());
  arguments.push(windowname.to_string());
  add_tab(arguments);
  println!("added tab {} to window {} for path {}",oid,windowname,path);
  // listtabs(windowname,window, state).await;
  Ok(())
}
#[tauri::command]
pub async fn closealltabs(state: State<'_, AppStateStore>) -> Result<(),String>{
  clearall("filedime","tabinfo");
  Ok(())
}#[tauri::command]
pub async fn listtabs(state: State<'_, AppStateStore>) -> Result<String,String>{
  Ok(serde_json::to_string(&state.listtabs()).unwrap())
}
