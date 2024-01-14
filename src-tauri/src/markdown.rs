use std::{path::PathBuf, io::Read};

use comrak::{markdown_to_html, ComrakOptions};
use serde_json::json;
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, sizeunit::{self, find_size}, sendtofrontend::{folsize, sendparentloc}};

#[tauri::command]
pub fn loadmarkdown(windowname:&str,name: String, window: Window,g:State<AppStateStore>) -> Result<String,String> {
  let mut content=String::new();
  let app_handle = window.app_handle();
  let path=PathBuf::from(name.clone());
  let mut filename="";
  if let Some(filenameosstr)=path.file_name(){
    filename=filenameosstr.to_str().unwrap();
  }
  let parent=path.clone();

  let mut file = std::fs::File::open(name).unwrap();
    
  
  
  folsize(windowname,&app_handle,sizeunit::size(find_size(&path.to_string_lossy(),&window,&g),true))?;
  sendparentloc(windowname,&app_handle,parent.to_string_lossy().to_string(),&("").to_string())?;
  file.read_to_string(&mut content).unwrap();
  // let htmformd=markdown::to_html_with_options(
  //     &content ,
  //     &markdown::Options::gfm()
  // ).unwrap();
  let mut options = ComrakOptions::default();
  options.render.unsafe_ = true;
  // options.render.hardbreaks = true;



  let htmformd=markdown_to_html(
    &content ,
    &options);

  app_handle.emit_to(
      windowname,
      "load-markdown",
      serde_json::to_string(&json!({
        "htmlfmd":htmformd,
        "filename":filename
      })).unwrap(),
    )
    .map_err(|e| e.to_string()).unwrap_or(println!("failed to send parent loc"));

  // Ok(content)
  Ok(htmformd)
    
}