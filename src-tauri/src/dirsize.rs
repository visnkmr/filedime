use ignore::WalkBuilder;
use rayon::prelude::*;
use serde_json::json;
use std::{
    fs,
    path::{Path, PathBuf}, sync::{RwLock, Arc},
};
use tauri::{State, Window};

use crate::{appstate::AppStateStore, sizeunit::find_size};

// A helper function to get the size of a file in bytes
fn file_size(path: &std::path::Path, g: Arc<RwLock<AppStateStore>>) -> u64 {
    find_size(&path.to_string_lossy(),  g)
    // g.addsize(&path.to_string_lossy(),fs::metadata(path).map(|m| m.len()).unwrap_or(0))
    // fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

// A function to calculate the total size of a directory and its subdirectories
pub fn dir_size(path: &String, g: Arc<RwLock<AppStateStore>>) -> u64 {
    // Create a walkdir iterator over the directory
    let ignorehiddenfiles = *g.read().unwrap().excludehidden.read().unwrap();
    let threads = (num_cpus::get() as f64 * 0.75).round() as usize;
    let walker = WalkBuilder::new(path)
        .threads(threads)
        .hidden(ignorehiddenfiles) // Include hidden files and directories
        .follow_links(false)
        .parents(true)
        .git_exclude(true)
        .ignore(true) // Disable the default ignore rules
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
        })
        // Map each path to its file size
        .map(|entry| {
            // println!("parthread");

            // w.emit("reloadlist",json!({
            //     "message": "pariter8",
            //     // "status": entry.path(),
            //     "status": "running",
            // }));
            file_size(entry.path(), g.clone())
        })
        // Sum up all file sizes
        .sum::<u64>();
    // w.emit(
    //     "infiniteloader",
    //     json!({
    //     "message": "lfiles",
    //     "status": "stop",
    //     }),
    // );

    total_size
}
