use std::{io::Read, path::PathBuf};

use tauri::{Manager, State, Window};

use crate::{
    appstate::AppStateStore,
    sendtofrontend::{folsize, sendparentloc},
    sizeunit::{self, find_size},
};

#[tauri::command]
pub fn loadfromhtml(windowname: &str, name: String, window: Window, g: State<AppStateStore>) {
    let mut content = String::new();
    let app_handle = window.app_handle();
    let path = PathBuf::from(name.clone());
    let parent = path.clone();

    let mut file = std::fs::File::open(name).unwrap();

    // folsize(windowname, &app_handle,{
    // sizeunit::size(find_size(&path.to_string_lossy(),&window,&g),true)
    // });

    // sendgparentloc(windowname, &app_handle,parent.parent().unwrap().to_string_lossy().to_string());
    sendparentloc(
        windowname,
        &app_handle,
        parent.to_string_lossy().to_string(),
        &("").to_string(),
    );

    file.read_to_string(&mut content).unwrap();
    // let htmformd=markdown::to_html_with_options(
    //     &content ,
    //     &markdown::Options::gfm()
    // ).unwrap();

    app_handle
        .emit_to(windowname, "load-html", &content)
        .map_err(|e| e.to_string())
        .unwrap_or(println!("failed to send parent loc"));

    // htmformd
}
