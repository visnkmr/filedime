use std::{path::PathBuf, io::Read};

use comrak::{markdown_to_html, ComrakOptions};
use serde_json::json;
use tauri::{Window, State, Manager};

use crate::{appstate::AppStateStore, sizeunit::{self, find_size}, sendtofrontend::{folsize, sendparentloc}};

#[tauri::command]
pub async fn loadmarkdown(path: String) -> Result<String,String> {
  let mut content=String::new();
  // let app_handle = window.app_handle();
  let path=PathBuf::from(path.clone());

  let mut file = std::fs::File::open(path).unwrap();
  file.read_to_string(&mut content).unwrap();
  let mut options = ComrakOptions::default();
  options.render.unsafe_ = true;
  let htmformd=markdown_to_html(
    &content ,
    &options);
  Ok(htmformd)
    
}