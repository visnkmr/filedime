#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

const CACHE_EXPIRY:u64=60;

mod appstate;
use appstate::*;
use serde::Deserialize;
use tauri::{GlobalWindowEvent, WindowEvent};
use std::{sync::{Mutex, Arc}, thread, net::{TcpListener, TcpStream}, fs, io::*, path::Path};

use ws::{listen, Message};
use lazy_static::*;
// Use lazy_static to initialize your shared state
lazy_static! {
  static ref SHARED_STATE: Arc<Mutex<AppStateStore>> = Arc::new(Mutex::new(AppStateStore::new(CACHE_EXPIRY)));
}
#[derive(Clone, Debug, Deserialize, PartialEq)]
struct comdes{
    functionname:String,
    arguments:String
}
fn parserecieved(msg:Message)->(String,Vec<String>){
    
  let descomm:comdes=serde_json::from_str(&msg.as_text().unwrap()).unwrap();
  let arguments:Vec<String>=serde_json::from_str(&descomm.arguments).unwrap();
  (descomm.functionname,arguments)
}
fn handle_connection(mut stream: TcpStream) {
  let mut buffer = [0;  1024];
  stream.read(&mut buffer).unwrap();
  let request = String::from_utf8_lossy(&buffer[..]);
  println!("Request: {}", request);

  // Assuming the request format is "GET /filename HTTP/1.1\r\n", extract filename
  let filename = request.split_whitespace().nth(1).unwrap_or("/");
  let filename = filename.trim_start_matches('/');

  // Construct the full path to the file in the 'out' directory
  let path = Path::new("../out").join(filename);

  // Check if the file exists and is readable
  if path.is_file() {
      if let Ok(contents) = fs::read_to_string(path){

        let response = format!(
            "HTTP/1.1  200 OK\r\nContent-Length: {}\r\n\r\n{}",
            contents.len(),
            contents
        );
        stream.write(response.as_bytes()).unwrap();
        stream.flush().unwrap();
      }
      else{
        let response = "HTTP/1.1  404 NOT FOUND\r\n\r\n";
        stream.write(response.as_bytes()).unwrap();
        stream.flush().unwrap();
      }
  } else {
      let response = "HTTP/1.1  404 NOT FOUND\r\n\r\n";
      stream.write(response.as_bytes()).unwrap();
      stream.flush().unwrap();
  }
}
fn main() {
  
  thread::spawn(move||{
    const HOST: &str = "127.0.0.1";
    const PORT: &str = "8477";
    let end_point: String = format!("{}:{}", HOST, PORT);
    let listener = TcpListener::bind(end_point).unwrap();
    println!("Web server is listening at port {}", PORT);

  for stream in listener.incoming() {
      let _stream = stream.unwrap();
      handle_connection(_stream);
      
  }
});
  thread::spawn(move||{
    const HOST: &str = "127.0.0.1";
    const PORT: &str = "8488";
    let end_point: String = format!("{}:{}", HOST, PORT);
    if let Err(error) = listen(end_point, |out| {
      // The handler needs to take ownership of out, so we use move
      move |msg:Message| {
        
          let mut retvec=String::new();
          // Handle messages received on this connection
          println!("Server got message '{}'. ", msg);
          if(msg.is_text()){
            let (functionname,arguments)=parserecieved(msg);
            let state=SHARED_STATE.lock().unwrap();
            let prev=state.cstore.read().unwrap().clone();
            retvec=format!("{}",prev);
            // retvec=format!("{}{:?}",functionname,arguments);
            *state.cstore.write().unwrap()=format!("{}-----{}",prev,arguments.get(2).unwrap().clone());
            drop(state);
            // match(functionname.as_str()){
                 
            //       _=>{
            //         "Error".to_string()
            //       }
            //   };
              println!("{}",retvec)
              
          }
              out.send(retvec)

          // Use the out channel to send messages back
          
      }
  }) {
      // Inform the user of failure
      println!("Failed to create WebSocket due to {:?}", error);
  }
  });
  // loop{

  // }
  let mut g=AppStateStore::new(CACHE_EXPIRY);
  let app=tauri::Builder::default()
    .setup(|app| {
      Ok(())
    })
    
    .on_window_event(on_window_event)
  
    .manage(SHARED_STATE.clone())
    .invoke_handler(
      tauri::generate_handler![
        // getpathfromid,
       
        ]
      )
    .build(tauri::generate_context!())
    .expect("Failed to start app");
  
  app.run(|app_handle, e| match e {
    
    tauri::RunEvent::ExitRequested { api, .. } => {
      // api.prevent_exit();
      
    }
    tauri::RunEvent::WindowEvent { event, .. } => match event {

      //when closed with knowledge
      tauri::WindowEvent::CloseRequested { api, .. } => {
      
      //   // api.prevent_close();
      //   // hide(app_handle.app_handle());
      }
      _ => {}
    },
    _ => {}
  });
}
fn on_window_event(event: GlobalWindowEvent) {
  if let WindowEvent::CloseRequested {
      #[cfg(not(target_os = "linux"))]
      api,
      ..
  } = event.event()
  {

      // #[cfg(target_os = "macos")]
      // {
      //     app.hide().unwrap();
      //     api.prevent_close();
      // }
  }
}
//for testing to prevent the window from autoclosing
// fn hide(app: AppHandle) {
//   let window = app.get_window("main").unwrap();
//   window.unminimize().unwrap();
//   window.hide().unwrap();
//   #[cfg(target_os = "macos")]
//   {
//     app.hide().unwrap();
//     set_is_accessory_policy(true);
//   }
// }
// In Rust, define a function that takes a path as an argument and returns a list of possible paths
