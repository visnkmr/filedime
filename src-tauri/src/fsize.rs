// use jwalk::WalkDirGeneric;
use filesize::PathExt;
use serde::Serialize;
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
pub struct cachestore{
    size:u64,
    expirytime: u64,
}
#[derive(Clone,Debug)]
pub struct tab{
    path:String,
    focusfolder:String,
    history:Vec<String>
}

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
    cstore:RwLock<HashMap<String,cachestore>>,
    nosize:RwLock<bool>,
    tabs:RwLock<HashMap<String,tab>>,
    expiration:Duration
    // app_handle:AppHandle
    // size:usize
}

// Import rayon prelude
use rayon::prelude::*;
#[derive(Clone,Debug,Serialize)]
pub struct tabinfo{
    id:String,
    path:String,
    ff:String,
    history:Vec<String>
}
use crate::{yu, sizeunit};
impl FileSizeFinder {
    pub fn addtab(&self,id:String,path:String,ff:String){
        println!("{}---{}---{}",id,path,ff);
        let mut tabhist=Vec::new();
        match(self.tabs.read().unwrap().get(&id)){
            Some(tabi)=>{
                let tabprevurl=tabi.path.clone();
                tabhist=tabi.history.clone();
                tabhist.push(tabprevurl);
            },
            None=>{

            }
        }
        
        // drop(tabi);
        let mut tabs=self.tabs.write().unwrap();
        // let tname=tabs.get(&id).unwrap().path.clone();
        // if(tname == path){
        //     return;
        // }
        tabs.insert(id,tab {
             path: path, 
             focusfolder: ff,
            history: tabhist});
    }
    pub fn gettabs(&self)->Vec<tabinfo>{
        let mut tvecs=Vec::new();
        let binding = self.tabs.read().unwrap();
        let mut hi=binding.iter();
        while let Some(ei)=hi.next(){
            tvecs.push(tabinfo{
                id:ei.0.clone(),
                path:ei.1.path.clone(),
                ff:ei.1.focusfolder.clone(),
                history:ei.1.history.clone()
            })
        }
        tvecs
        // self.tabs.read().unwrap().clone()
    }
    pub fn gettab(&self,id:String)->(String,String){
        let tab= self.tabs.read().unwrap().get(&id).unwrap().clone();
        return (tab.path,tab.focusfolder)
    }
    pub fn new(expiration: u64) -> Self {
        Self {
            // Wrap the cache in a RwLock
            cstore:RwLock::new(HashMap::new()),
            nosize:RwLock::new(true),
            tabs:RwLock::new(HashMap::new()),
            expiration:Duration::from_secs(expiration)
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
    let cstore=self.cstore.read().unwrap();

    // let k=0;
    // if(k==0){
    //     return 0;
    // }
    // Use a single read lock guard to access the cache
    let cache = cstore;

    if let Some(cstore) = cache.get(path) {
        let size=cstore.size;
        let expirytime=cstore.expirytime;
        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let nowtime = duration.as_secs();
        // Use the same lock guard to get the expiry time
        // if let Some(expirytime) = cache.get(&("expiry_".to_string() + &path.to_string())) {
            if nowtime < expirytime {
                return size;
            } else {
                println!("expired")
            }
        // }
    }

    // Drop the read lock guard before acquiring a write lock guard
    drop(cache);

    let entry_path = Path::new(path);

    let mut size = if entry_path.is_dir() {
        let nosize=self.nosize.read().unwrap();
        if(*nosize){
            0 as u64
        }
        else{
            yu::uio(
                entry_path.as_os_str().to_os_string().to_string_lossy().to_string(),
                self,
            )

        }
    } else {
        entry_path.size_on_disk().unwrap_or(0)
        
        // let metadata = entry_path.symlink_metadata().unwrap();
        // entry_path.size_on_disk_fast(&metadata).unwrap_or(0)
    };

    if(size!=0){
        // Use a single write lock guard to update the cache
        let  cstore=self.cstore.write().unwrap();
    
        let mut cache = cstore;
        
        
        let now = SystemTime::now();
        
        let later = now + (self.expiration);
        
        let duration = later.duration_since(UNIX_EPOCH).unwrap();
        
        let expirytime = duration.as_secs();
        // cache.insert("expiry_".to_string() + &path.to_string(), expirytime);
        cache.insert(path.to_string(), cachestore { size: size, expirytime: expirytime });
    }
    
    // Add the size of the key and the value to the total
    // self.size += mem::size_of_val(&path.to_string());
    // self.size += mem::size_of_val(&size);
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

    
    pub fn clear_cache(&self) {
        
        let now = Instant::now();

    let mut cstore=self.cstore.write().unwrap();
        let mut cache=cstore;
        // Use write method to get a lock guard
        cache.retain(|_, v| {
            
            let duration = Duration::from_secs(v.expirytime);
            
            let instant = now.checked_sub(duration).unwrap();
            
            now.duration_since(instant) < self.expiration
        });
    }
    // Add a method to print the total size of the cache
  pub fn print_cache_size(&self)
  ->i32
//   ->(u64,u64) 
  {
    let cstore=self.cstore.read().unwrap();

    // Use a single read lock guard to access the cache
    let cache = cstore;

    // Initialize a variable to store the total size
    let mut total_size = 0;
    let mut total_key_size = 0;
    let mut total_value_size = 0;

    // Initialize a mutable reference to the cache iterator
    let mut cache_iter = cache.iter();

    // let mut folsize=0;
    // Loop until the iterator returns None
    while let Some((key, value)) = cache_iter.next() {
        // Add the size of the key and the value to the total
        total_size += mem::size_of_val(key);
        total_key_size += mem::size_of_val(&value.expirytime);
        total_key_size += mem::size_of_val(&value.size);
        // if(!key.contains("expiry")){
        //     total_key_size+=mem::size_of_val(key);
        // }
        // total_size += mem::size_of_val(value);
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

    println!("cache:{}----numfolders:{}---onlynamesize:{}",sizeunit::size(total_size as u64,true),cache.len() as u64,sizeunit::size(total_key_size as u64,true));
    cache.len() as i32
    // Print the total size in bytes
    // println!("The cache size is {} bytes", total_size);
    // (total_size as u64,cache.len() as u64)
  }
  pub fn nosize(&self){
    let shouldsize;
    {

        shouldsize=!*self.nosize.read().unwrap();
    }
    let mut setsize=self.nosize.write().unwrap();
    *setsize=shouldsize;
    // {
    //     println!("{:?}",*self.nosize.read().unwrap())
    // }
  }
  pub fn foldercon(&self,path:&str)
  ->i32
//   ->(u64,u64) 
  {
    let cstore=self.cstore.write().unwrap();

    // Use a single read lock guard to access the cache
    let cache = cstore;

    // Initialize a variable to store the total size
    let mut total_size = 0;
    // let mut total_key_size = 0;
    // let mut total_value_size = 0;

    // Initialize a mutable reference to the cache iterator
    let mut cache_iter = cache.iter();

    // let mut folsize=0;
    // Loop until the iterator returns None
    while let Some((key, _)) = cache_iter.next() {
        if(key.starts_with(path))
        {
            total_size += 1;
        }
        // Add the size of the key and the value to the total
        
        // if(!key.contains("expiry")){
        //     total_key_size+=mem::size_of_val(key);
        // }
        // total_size += mem::size_of_val(value);
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

    // println!("cache:{}----numfolders:{}---onlynamesize:{}",sizeunit::size(total_size as u64,true),cache.len() as u64,sizeunit::size(total_key_size as u64,true));
    total_size
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