use std::{path::PathBuf, io::Read};

use comrak::{markdown_to_html, ComrakOptions};
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, sizeunit, sendtofrontend::{folsize, sendparentloc}};

#[tauri::command]
pub fn loadmarkdown(name: String, window: Window,g:State<AppStateStore>) -> Result<String,String> {
  let mut content=String::new();
  let app_handle = window.app_handle();
  let path=PathBuf::from(name.clone());
  let parent=path.clone();

  let mut file = std::fs::File::open(name).unwrap();
    
  
  
  folsize(&app_handle,sizeunit::size(g.find_size(&path.to_string_lossy()),true))?;
  sendparentloc(&app_handle,parent.to_string_lossy().to_string())?;
  file.read_to_string(&mut content).unwrap();
  // let htmformd=markdown::to_html_with_options(
  //     &content ,
  //     &markdown::Options::gfm()
  // ).unwrap();
  let htmformd=markdown_to_html(
    &content ,
    &ComrakOptions::default());

  app_handle.emit_to(
      "main",
      "load-markdown",
      &htmformd,
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send parent loc"));

  Ok(htmformd)
    
}