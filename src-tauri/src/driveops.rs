use tauri::{Manager, Window};

use crate::{
    drivelist::{self, populatedrivelist},
    sendtofrontend::driveslist,
};

#[tauri::command]
pub async fn senddriveslist(windowname: String, window: Window) {
    driveslist(
        &windowname.clone(),
        &window.app_handle(),
        &serde_json::to_string(&populatedrivelist().clone()).unwrap(),
    )
    .unwrap();
}
#[tauri::command]
pub async fn mountdrive(
    windowname: String,
    uuid: String,
    mountpoint: String,
    window: Window,
) -> Result<String, String> {
    let mut returnid = "".to_string();
    println!("trying to mount drive {}", mountpoint);
    if (drivelist::mountdrive(uuid.clone(), mountpoint)) {
        println!("mounted drive");
        driveslist(
            &windowname.clone(),
            &window.app_handle(),
            &serde_json::to_string(&populatedrivelist().clone()).unwrap(),
        )
        .unwrap();
        for ed in populatedrivelist().clone().unwrap() {
            if (ed.uuid == uuid) {
                returnid = ed.mount_point
            }
        }
        return Ok(returnid);
    }
    Err("failed to mount drive".to_string())
}
#[tauri::command]
pub async fn unmountdrive(
    windowname: String,
    uuid: String,
    mountpoint: String,
    window: Window,
) -> Result<String, String> {
    println!("trying to unmount drive {}", uuid);
    if (drivelist::unmountdrive(uuid.clone(), uuid.clone())) {
        println!("unmounted drive");
        driveslist(
            &windowname.clone(),
            &window.app_handle(),
            &serde_json::to_string(&populatedrivelist().clone()).unwrap(),
        )
        .unwrap();
        return Ok(mountpoint);
    }
    Err("failed to mount drive".to_string())
}
