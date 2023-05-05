use std::{path::PathBuf, io::Read};

use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, sizeunit};

#[tauri::command]
pub fn loadfromhtml(name: String, window: Window,g:State<AppStateStore>)
{
    
    let mut content=String::new();
    let app_handle = window.app_handle();
    let path=PathBuf::from(name.clone());
    let parent=path.clone();

    let mut file = std::fs::File::open(name).unwrap();
    
  
  app_handle.emit_to(
      "main",
      "folder-size",
      {
        sizeunit::size(g.find_size(&path.to_string_lossy()),true)
      },
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send file size"));
  
  app_handle.emit_to(
      "main",
      "grandparent-loc",
      parent.parent().unwrap().to_string_lossy().to_string(),
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send grandparentloc"));
  
  app_handle.emit_to(
      "main",
      "parent-loc",
      parent.to_string_lossy().to_string(),
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send parent loc"));
  
  file.read_to_string(&mut content).unwrap();
  // let htmformd=markdown::to_html_with_options(
  //     &content ,
  //     &markdown::Options::gfm()
  // ).unwrap();

  app_handle.emit_to(
      "main",
      "load-html",
      &content,
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send parent loc"));

  // htmformd
    
}