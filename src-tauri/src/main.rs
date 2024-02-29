#![warn(clippy::disallowed_types)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

const CACHE_EXPIRY: u64 = 60;

mod appstate;
use appstate::*;
use serde::{Deserialize, Serialize};
use tokio::sync::{};
use std::{
    fs,
    io::*,
    net::{TcpListener, TcpStream},
    path::Path, sync::{Arc, mpsc, Mutex, RwLock}, thread, collections::HashMap,
};
use tauri::{GlobalWindowEvent, WindowEvent};

use lazy_static::*;
use ws::{listen, Message};

use crate::listfiles::list_file;
// Use lazy_static to initialize your shared state
lazy_static! {
    static ref SHARED_STATE: Arc<Mutex<AppStateStore>> =
        Arc::new(Mutex::new(AppStateStore::new(CACHE_EXPIRY)));
}
#[derive(Serialize, Clone, Debug, PartialEq, Hash, Eq)]
pub struct FileItem {
    name: String,
    path: String,
    is_dir: bool,
    size: String,
    rawfs: u64,
    lmdate: String,
    timestamp: i64,
    foldercon: i32,
    ftype: String, // grandparent:String,
                   // parent:String
}
#[derive(Clone, Debug, Deserialize, PartialEq)]
struct comdes {
    functionname: String,
    arguments: String,
}
fn parserecieved(msg: Message) -> (String, Vec<String>) {
    let descomm: comdes = serde_json::from_str(&msg.as_text().unwrap()).unwrap();
    let arguments: Vec<String> = serde_json::from_str(&descomm.arguments).unwrap();
    (descomm.functionname, arguments)
}
fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
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
        if let Ok(contents) = fs::read_to_string(path) {
            let response = format!(
                "HTTP/1.1  200 OK\r\nContent-Length: {}\r\n\r\n{}",
                contents.len(),
                contents
            );
            stream.write(response.as_bytes()).unwrap();
            stream.flush().unwrap();
        } else {
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
    

    thread::spawn(move || {
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
    let out_shared = Arc::new(Mutex::new(HashMap::new())); // Use HashMap to store state for each connection

let out_shared_clone = Arc::clone(&out_shared);
    let (tx, rx) = mpsc::channel::<(String,Vec<String>)>();
    // let out_shared = Arc::new(Mutex::new(None));

    // let out_shared_clone = Arc::clone(&out_shared);
    thread::spawn(move || {
        const HOST: &str = "127.0.0.1";
        const PORT: &str = "8488";
        let end_point: String = format!("{}:{}", HOST, PORT);
        if let Err(error) = listen(end_point, |out| {
            let mut out_lock = out_shared_clone.lock().unwrap();
            let state = Arc::new(RwLock::new(AppStateStore::default()));
            let connid=out.connection_id().clone();
            out_lock.insert(connid.to_string(),(out.clone(), state.clone()));
            // let state_clone = state.clone();
            // *out_lock = Some(out.clone());
            let tx_clone=tx.clone();
            // let outc=(out.clone());
            // The handler needs to take ownership of out, so we use move
            move |msg: Message| { 
               
                // let mut retvec = String::new();
                // Handle messages received on this connection
                println!("Server got message '{}'. ", msg);
                if (msg.is_text()) {
                    let (functionname, arguments) = parserecieved(msg);
                    if functionname == "list_files" {
                        list_file(connid.to_string(),tx_clone.clone(), arguments,state.clone()).unwrap();
                    }
                    else if(functionname=="print_state"){
                        tx_clone.clone().send((connid.to_string(),vec![])).unwrap();
                    }
                }
                // out.send(retvec)
               Ok(())
                // Use the out channel to send messages back
            }
        }) {
            // Inform the user of failure
            println!("Failed to create WebSocket due to {:?}", error);
        }
    });
    thread::spawn(move || {
        loop {
            match (rx.recv()) {
                Ok(whatrecieved) => {
                    // Assuming `whatrecieved` contains information to identify the connection
                // For demonstration, let's assume `whatrecieved` is a tuple of (connection_id, message)
                let (connection_id, message) = whatrecieved;

                    let out_lock = out_shared.lock().unwrap();
                    if let Some((sender,state)) = out_lock.get(&connection_id) {
                        // Convert the message to a string and send it
                        if(message.is_empty()){
                            println!("{:?}",state);
                        }
                        else{
                            let message_str = serde_json::to_string(&message).unwrap();
                            sender.send(message_str).unwrap();
                        }
                    } else {
                        println!("WebSocket connection with ID {} not established yet.", connection_id);
                    }
                  
                }
                Err(_) => {}
            }
        }
    });
    // loop{

    // }
    let mut g = AppStateStore::new(CACHE_EXPIRY);
    let app = tauri::Builder::default()
        .setup(|app| Ok(()))
        .on_window_event(on_window_event)
        .manage(SHARED_STATE.clone())
        .invoke_handler(tauri::generate_handler![
            // getpathfromid,
            listfiles::list_files
        ])
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
mod dirsize;
mod fileitem;
mod lastmodcalc;
mod listfiles;
mod sendtofrontend;

mod sizeunit;
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
