// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{io::Read, thread, time::Duration};

use tauri::{Manager, api::file::read_string};
#[tauri::command] // add this attribute
fn read_and_emit(app_handle: tauri::AppHandle) -> Result<(), String> { // change return type to Result
  let content = read_string("/home/roger/.config/LogLinktoDisk/links.md").unwrap(); // use ? instead of unwrap
  app_handle.emit_to(
    "main",
    "message", 
    content
  )
  .map_err(|e| e.to_string()) // convert error to string
}
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn loadmarkdown(name: &str) -> String {
    let mut content=String::new();

    let mut file = std::fs::File::open("/home/roger/.config/LogLinktoDisk/links.md").unwrap();

    file.read_to_string(&mut content).unwrap();
    markdown::to_html_with_options(
        &content ,
        &markdown::Options::gfm()
    ).unwrap()
    // format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main()->Result<(),()> {
    

    tauri::Builder::default()
    .setup(|app| {
                // get an instance of AppHandle
                let app_handle = app.handle();
                thread::spawn(move||{
                read_and_emit(app_handle).unwrap(); // call the command function
                thread::sleep(Duration::from_secs(3));
            });
        Ok(())
    })
    .invoke_handler(tauri::generate_handler![loadmarkdown])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

    Ok(())
}
