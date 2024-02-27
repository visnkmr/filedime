use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, RwLock,
    },
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use fuzzy_matcher::clangd::fuzzy_match;
use ignore::{Walk, WalkBuilder, WalkState};
use libc::stat;
use rayon::prelude::*;
use serde_json::json;
use tauri::{Manager, State, Window};
// use walkdir::{WalkDir, DirEntry};

use crate::{
    appstate::{get_enum_value, set_enum_value, wThread, AppStateStore},
    lastmodcalc::lastmodified,
    markdown::loadmarkdown,
    opendialogwindow,
    // loadjs::loadjs
    openhtml::loadfromhtml,
    openpath,
    sendtofrontend::slist,
    sizeunit,
    tabinfo::newtab,
    FileItem,
};
#[tauri::command]
pub async fn populate_try(
    mut path: String,
    window: &Window,
    state: &State<'_, AppStateStore>,
) -> Result<(), String> {
    let ignorehiddenfiles = *state.excludehidden.read().unwrap();
    if (path == "drives://") {
        match (dirs::home_dir()) {
            Some(spath) => {
                path = spath.to_string_lossy().to_string();
            }
            None => return Err("home not found".to_string()),
        };

        // return Ok(())
    } else if (path == "downloads://") {
        match (dirs::download_dir()) {
            Some(spath) => {
                path = spath.to_string_lossy().to_string();
            }
            None => return Err("downloads not found".to_string()),
        };
        // return Ok(())
    } else if (path == "documents://") {
        match (dirs::document_dir()) {
            Some(spath) => {
                path = spath.to_string_lossy().to_string();
            }
            None => return Err("documents not found".to_string()),
        };
        // return Ok(())
    }
    window
        .app_handle()
        .emit_all("start-timer", "")
        .map_err(|e| e.to_string())?;
    opendialogwindow(
        &window.app_handle(),
        "Loading search",
        &format!("{} is being indexed to be searched", path),
        "",
    );
    let threads = (num_cpus::get() as f64 * 0.75).round() as usize;

    WalkBuilder::new(&path)
        .threads(threads)
        .hidden(ignorehiddenfiles) // Include hidden files and directories
        .follow_links(false)
        .parents(true)
        // .git_exclude(true)
        // .ignore(true) // Disable the default ignore rules
        // .git_ignore(true) // Respect the .gitignore file
        .build_parallel()
        .run(|| {
            // println!("Populating the search index into state");
            Box::new(move |entry| {
                match (entry) {
                    Ok(e) => {
                        if let Some(eft) = (e.file_type()) {
                            let mut searchfor = eft.is_file();
                            if (state.includefolderinsearch.read().unwrap().clone()) {
                                searchfor = eft.is_file() || eft.is_dir();
                            }
                            if (searchfor) {
                                // println!("{:?}",e.path());
                                let i = e.path().to_string_lossy().to_string();
                                let name =
                                    e.file_name().to_string_lossy().to_string().to_lowercase();
                                let map = state.stl.clone();
                                let mut map = map.lock().unwrap();
                                if let Some(hs) = map.get_mut(&name) {
                                    // If yes, append the value to the existing vector
                                    // if(!hs.contains(&i)){
                                    hs.insert(i);
                                    // }
                                } else {
                                    // If no, create a new vector with the value and insert it into the hashmap
                                    map.insert(name, HashSet::from_iter(vec![i]));
                                }
                                // map.entry(name).or_insert(Vec::new()).push(i);
                            }
                        }
                    }
                    Err(_) => {
                        // println!("unknown filetype");
                    }
                }
                WalkState::Continue
            })
        });
    window
        .app_handle()
        .emit_all("stop-timer", "")
        .map_err(|e| e.to_string())?;
    opendialogwindow(
        &window.app_handle(),
        "Loaded",
        &format!(
            "total {} file names can be searched",
            state.stl.lock().unwrap().len()
        ),
        "",
    );
    opendialogwindow(
        &window.app_handle(),
        "Ready to search",
        &format!("{} is ready to be searched.", path),
        "",
    );
    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    // println!("stl is {:?  }",state);
    println!("endtime----{}", endtime);

    Ok(())
}
