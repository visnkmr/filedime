use rayon::prelude::*;
use std::{fs, path::{PathBuf, Path}};
use walkdir::WalkDir;

use crate::fsize::FileSizeFinder;

// A helper function to get the size of a file in bytes
fn file_size(path: &std::path::Path,g:&FileSizeFinder) -> u64 {
    g.find_size(&path.to_string_lossy())
    // g.addsize(&path.to_string_lossy(),fs::metadata(path).map(|m| m.len()).unwrap_or(0))
    // fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

// A function to calculate the total size of a directory and its subdirectories
fn dir_size(path: &String,g:&FileSizeFinder) -> u64 {
    // Create a walkdir iterator over the directory
    let walker = WalkDir::new(path)
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
            let path = entry.path();
            path.is_file() &&
             !path.is_symlink() &&
             !path.to_string_lossy().to_string().contains("/.git")
        })
        // Filter out paths that start with "./.git"
        // .filter(|entry| !entry.path().to_string_lossy().to_string().contains("/.git"))
        // Map each path to its file size
        .map(|entry| file_size(entry.path(),g))
        // Sum up all file sizes
        .sum::<u64>();

    total_size
}

// #[test]
pub fn uio(path:String,g:&FileSizeFinder)->u64 {
    // Get the current directory path
    // let path = PathBuf::from("/home/roger/Downloads/github");
    // Print the total size in bytes
    dir_size(&path,g)
}