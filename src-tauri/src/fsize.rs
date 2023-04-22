// use jwalk::WalkDirGeneric;
use filesize::PathExt;
use tauri::{AppHandle, Manager};
use std::fs::{ReadDir, self};
use std::mem::{size_of_val, self};
use std::path::Path;
use std::collections::HashMap;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use std::sync::RwLock;
// use dirscan::*;

// Use the gio crate
// use gio::prelude::*;

// // A function that takes a path to a file or directory and returns its size in bytes
// fn file_size(path: &str) -> u64 {
//     // Create a GFile object from the path
//     let file = gio::File::for_path(path);
//     // Call g_file_query_info with the file and some attributes and flags
//     let info = file.query_info(
//         gio::FILE_ATTRIBUTE_STANDARD_SIZE,
//         gio::FileQueryInfoFlags::NOFOLLOW_SYMLINKS,
//         None::<&gio::Cancellable>,
//     )
//     .unwrap();
//     // Get the size of the file from info
//     info.size() as u64
// }
// // Another function that takes a path to a file and returns its size in bytes
// fn file_size2(path: &str) -> u64 {
//     // Open the file in read-only mode
//     let file = File::open(path).unwrap();
//     // Get an iterator over the bytes of the file
//     let bytes = file.bytes();
//     // Count the number of bytes and return it
//     bytes.count() as u64
// }
// Define a struct that holds the cache and the expiration time
pub struct FileSizeFinder {
    cache: RwLock<HashMap<String, u64>>,
    expiration: Duration,
    // app_handle:AppHandle
    // size:usize
}

// Import rayon prelude
use rayon::prelude::*;

use crate::{yu, sizeunit};
impl FileSizeFinder {
    pub fn new(expiration: u64) -> Self {
        Self {
            // Wrap the cache in a RwLock
            cache: RwLock::new(HashMap::new()),
            expiration: Duration::from_secs(expiration),
            // app_handle: apphandle
            // size:0
        }
    }
    // pub fn navfolder(&self,path:ReadDir)->u64{
    //     let mut size=0;
    //     for e in path {
    //         let e = e;
    //         let path = e.expect("t").path();
    //         size+=
    //         if path.is_dir() {
    //             self.navfolder(fs::read_dir(path).expect("t"))
    //         } else 
    //         if path.is_file() {
    //             self.find_size(&path.to_string_lossy().to_string())
    //         }
    //         else{
    //             0
    //         }
    //     };
    //     size
    // }
//    pub fn addsize(&self, path: &str,size:u64) -> u64{
//     if let Some(size) = self.cache.read().unwrap().get(path) {
//         //println!("from cache");
//         // Return the cached size
//         return *size;
//     }
//     self.cache.write().unwrap().insert(path.to_string(), size);
//     //println!("added {} to cache", path);
    
//     size

//    }
pub fn find_size(&self, path: &str) -> u64 {
    // Use a single read lock guard to access the cache
    let mut cache = self.cache.read().unwrap();

    if let Some(size) = cache.get(path) {
        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let nowtime = duration.as_secs();
        // Use the same lock guard to get the expiry time
        if let Some(expirytime) = cache.get(&("expiry_".to_string() + &path.to_string())) {
            if nowtime < *expirytime {
                return *size;
            } else {
                println!("expired")
            }
        }
    }

    // Drop the read lock guard before acquiring a write lock guard
    drop(cache);

    let entry_path = Path::new(path);

    let mut size = if entry_path.is_dir() {
        yu::uio(
            entry_path.as_os_str().to_os_string().to_string_lossy().to_string(),
            self,
        )
    } else {
        entry_path.size_on_disk().unwrap_or(0)
    };

    // Use a single write lock guard to update the cache
    let mut cache = self.cache.write().unwrap();
    cache.insert(path.to_string(), size);
    
    // Add the size of the key and the value to the total
    // self.size += mem::size_of_val(&path.to_string());
    // self.size += mem::size_of_val(&size);
       

    let now = SystemTime::now();

    let later = now + (self.expiration);

    let duration = later.duration_since(UNIX_EPOCH).unwrap();

    let expirytime = duration.as_secs();
    cache.insert("expiry_".to_string() + &path.to_string(), expirytime);
    // self.print_cache_size();

    // self.size += mem::size_of_val(&"expiry_".to_string());
    // self.size += mem::size_of_val(&expirytime);

    size
}
    // pub fn find_size3(&self, path: &str) -> u64 {
        
    //      // Check if the size is cached
    //      if let Some(size) = self.cache.read().unwrap().get(path) {
    //         // Return the cached size
    //         return *size;
    //     }

    //     // Get the path of the entry
    //     let entry_path = Path::new(path);

    //     // Get the size of the entry using filesize crate
    //     let mut size = entry_path.size_on_disk().unwrap_or(0);

    //     // If the entry is a directory, walk the directory tree in parallel using jwalk
    //     if entry_path.is_dir() {
    //         size = fs::read_dir(path).unwrap()
    //         // .par_bridge()
    //         .map(|entry| {
                
    //             self.find_size( &entry.unwrap().path().to_string_lossy().to_string())
    //         })
    //         .sum();
    //        //     //println!("Name: {}", path.unwrap().path().display())
           
    //     }
    //     //     size += WalkDir::new(entry_path)
    //     //         .process_read_dir(|_depth, _path, _read_dir_state, children| {
    //     //             // For each entry in the directory
    //     //             for entry in children.iter_mut() {
    //     //                 // Get the path of the entry
    //     //                 let child_path = entry.path().to_string_lossy().to_string();
    //     //                 // Recursively find the size of the entry
    //     //                 let child_size = self.find_size(&child_path);
    //     //                 // Store the size in the entry state
    //     //                 entry.state = child_size;
    //     //                 // Add the size to the total size
    //     //                 size += child_size;
    //     //             }
    //     //         })
    //     //         .build()
    //     //         .run(|| ())
    //     //         .into_iter()
    //     //         .map(|entry| entry.state)
    //     //         .sum::<u64>();
    //     // }
    //     // //println!("{}--{}",path,size);
    //     // Use write method to get a lock guard
    //     self.cache.write().unwrap().insert(path.to_string(), size);

        
    //     size
    // }

    
    pub fn clear_cache(&mut self) {
        
        let now = Instant::now();

        
        // Use write method to get a lock guard
        self.cache.write().unwrap().retain(|_, &mut v| {
            
            let duration = Duration::from_secs(v);
            
            let instant = now.checked_sub(duration).unwrap();
            
            now.duration_since(instant) < self.expiration
        });
    }
    // Add a method to print the total size of the cache
  pub fn print_cache_size(&self)
//   ->(u64,u64) 
  {
    // Use a single read lock guard to access the cache
    let cache = self.cache.read().unwrap();

    // Initialize a variable to store the total size
    let mut total_size = 0;

    // Initialize a mutable reference to the cache iterator
    let mut cache_iter = cache.iter();

    // let mut folsize=0;
    // Loop until the iterator returns None
    while let Some((key, value)) = cache_iter.next() {
        // Add the size of the key and the value to the total
        total_size += mem::size_of_val(key);
        total_size += mem::size_of_val(value);
        // if !key.starts_with("expiry_"){
        //     folsize+=value;

        // }

    }

    // self.app_handle.emit_to(
    //     "main",
    //     "folder-size",
    //     {
    //       sizeunit::size(folsize,true)
    //     },
    //   )
    //   .map_err(|e| e.to_string()).unwrap();

    println!("cache:{}----numfolders:{}",sizeunit::size(total_size as u64,true),cache.len() as u64);

    // Print the total size in bytes
    // println!("The cache size is {} bytes", total_size);
    // (total_size as u64,cache.len() as u64)
  }
}


// use std::path::PathBuf;
// use rayon::prelude::*;
// // use filesize::PathExt;
// #[test]
// fn tryu() {
//     let path = PathBuf::from("/home/roger/Downloads/github");
//     let total_size = path
//         .read_dir()
//         .unwrap()
        
//         .par_bridge()
//         .filter_map(|entry| {
//             let path = entry.unwrap().path();
//             if path.is_file() && !path.is_symlink() {
//                 Some(path)
//             } 
//             // else if path.is_dir() {
                
//             // }
//             else{
//                 None
//             }
//         })
//         .filter(|path| !path.starts_with("./.git"))
//         .map(|path| path.size_on_disk().unwrap())
//         .sum::<u64>();

//     //println!("Total size: {}", total_size);
// }