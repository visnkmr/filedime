use serde::Serialize;
use tauri::{Manager, State, Window};

use crate::{appstate::AppStateStore, sendtofrontend::loadmarks};

#[derive(Clone, Debug, Serialize, Eq, Hash, PartialEq, Default)]
pub struct marks {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub id: String,
}
#[tauri::command]
pub async fn removemark(
    windowname: &str,
    path: String,
    id: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    state.removemark(path, id);
    let app_handle = window.app_handle();
    loadmarks(
        windowname,
        &app_handle,
        serde_json::to_string(&state.getmarks()).unwrap(),
    );
    Ok(())
}

#[tauri::command]
pub async fn addmark(
    windowname: &str,
    path: String,
    id: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    state.addmark(path, id);
    let app_handle = window.app_handle();
    // println!("{:?}",state);
    loadmarks(
        windowname,
        &app_handle,
        serde_json::to_string(&state.getmarks()).unwrap(),
    );

    Ok(())
}
