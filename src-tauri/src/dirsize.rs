use rayon::prelude::*;
use serde_json::json;
use tauri::{Window, State};
use std::{fs, path::{PathBuf, Path}};
use ignore::WalkBuilder;

use crate::{appstate::AppStateStore, sizeunit::find_size};

// A helper function to get the size of a file in bytes
fn file_size(path: &std::path::Path,w:&Window,g:&State<'_, AppStateStore>) -> u64 {
    find_size(&path.to_string_lossy(),w,g)
    // g.addsize(&path.to_string_lossy(),fs::metadata(path).map(|m| m.len()).unwrap_or(0))
    // fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

// A function to calculate the total size of a directory and its subdirectories
pub fn dir_size(path: &String,w:&Window,g:&State<'_, AppStateStore>) -> u64 {
    // Create a walkdir iterator over the directory
    let threads = (num_cpus::get() as f64 * 0.75).round() as usize;
    let walker = WalkBuilder::new(path)
    .threads(threads)
    .follow_links(false)
    .git_ignore(true)
    .build()
    // .min_depth(1) // skip the root directory
    //   .max_depth(1)
        // Convert errors into options
        .into_iter()
        
        .filter_map(|e| e.ok());

    // Convert the walkdir iterator into a parallel iterator
    let par_walker = walker.par_bridge();

    // Sum up the sizes of all files in parallel
    let total_size = par_walker
        // Filter out directories and symlinks
        .filter(|entry| {
            // eprintln!("checking size");
            
            let path = entry.path();
            path.is_file() 
            // &&
            //  !path.is_symlink() &&
            //  !path.to_string_lossy().to_string().contains("/.git/")
        })
        // Filter out paths that start with "./.git"
        // .filter(|entry| !entry.path().to_string_lossy().to_string().contains("/.git"))
        // Map each path to its file size
        .map(|entry| {
            // println!("parthread");
            
            // w.emit("reloadlist",json!({
            //     "message": "pariter8",
            //     // "status": entry.path(),
            //     "status": "running",
            // }));
            file_size(entry.path(),w,g)
        })
        // Sum up all file sizes
        .sum::<u64>();
    w.emit("infiniteloader",
      json!({
          "message": "lfiles",
          "status": "stop",
          })
      );

    total_size
}
