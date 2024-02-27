use prefstore::clearall;
use serde::Serialize;
use tauri::{Manager, State, Window};

use crate::{appstate::AppStateStore, list_files, sendtofrontend::loadmarks};

#[derive(Clone, Debug, Serialize)]
pub struct tabinfo {
    pub id: String,
    pub path: String,
    pub ff: String,
    pub tabname: String,
    pub history: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct tab {
    pub path: String,
    pub focusfolder: String,
    pub history: Vec<String>,
    pub windowname: String,
}
#[tauri::command]
pub async fn closetab(
    windowname: &str,
    id: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    state.removetab(id, windowname.to_string());
    Ok(())
}
#[tauri::command]
pub async fn newtab(
    windowname: &str,
    oid: String,
    path: String,
    ff: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    state.addtab(
        oid.clone(),
        path.clone(),
        ff.clone(),
        windowname.to_string(),
    );

    println!(
        "added tab {} to window {} for path {}",
        oid, windowname, path
    );

    // listtabs(windowname,window, state).await;
    Ok(())
}
#[tauri::command]
pub async fn closealltabs(state: State<'_, AppStateStore>) -> Result<(), String> {
    clearall("filedime", "tabinfo");
    Ok(())
}
#[tauri::command]
pub async fn listtabs(state: State<'_, AppStateStore>) -> Result<String, String> {
    Ok(serde_json::to_string(&state.listtabs()).unwrap())
}
