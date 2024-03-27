#![warn(clippy::disallowed_types)]
use filesize::PathExt;
use prefstore::{clearall, clearcustom, getallcustomwithin, getcustom, savecustom};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::mem::{self};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicI16, AtomicI64, AtomicI8, Ordering};
// use std::sync::mpsc::{Sender, Receiver};
use crate::bookmarks::*;
use crate::navtimeline::BrowserHistory;
use crate::tabinfo::*;
use rustc_hash::{FxHashMap, FxHashSet};
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
#[derive(Clone, Debug)]
// Use the gio crate
// use gio::prelude::*;
pub struct cachestore {
    pub size: u64,
    pub expirytime: u64,
}

#[derive(Debug)]
pub struct AppStateStore {
    // pub filegptendpoint:String,
    pub cstore: RwLock<FxHashMap<String, cachestore>>,
    pub includefolderinsearch: RwLock<bool>,
    pub nosize: RwLock<bool>,
    pub excludehidden: RwLock<bool>,
    // pub filesetcollection: RwLock<HashMap<String, i32>>,
    pub history: RwLock<HashMap<String, BrowserHistory>>,
    pub showfolderchildcount: RwLock<bool>,
    pub loadsearchlist: RwLock<bool>,
    tabs: RwLock<FxHashSet<String>>,
    pub expiration: Duration,
    pub whichthread: Arc<AtomicI8>,
    pub searchcounter: Arc<AtomicI16>,
    pub starttime: Arc<AtomicI64>,
    bookmarks: RwLock<HashSet<marks>>,
    // messagetothread: RwLock<String>,
    // recents: Vec<String>,
    pub aborted: Arc<Mutex<bool>>,
    // filechanged: Arc<Mutex<bool>>,
    pub searchtry: Arc<Mutex<HashSet<String>>>,
    // pub st:Arc<Mutex<TrieNode>>,
    pub stl: Arc<Mutex<FxHashMap<String, HashSet<String>>>>,
    pub process_count: Arc<Mutex<i32>>,
    pub buttonnames: HashMap<String, String>,
    // tx: Mutex<Option<Sender<String>>>,
    // rx: Mutex<Option<Receiver<String>>>,
    // tx:(RwLock<Sender<String>>),
    // rx:RwLock<Receiver<String>>
    // app_handle:AppHandle
    // size:usize
}
#[derive(Debug)]
pub enum wThread {
    None,
    Populating,
    Searching,
    Listing,
}
pub fn set_enum_value(atomic_enum: &AtomicI8, value: wThread) {
    let mapped_value = match value {
        wThread::None => 0,
        wThread::Populating => 1,
        wThread::Searching => 2,
        wThread::Listing => 3,
    };

    atomic_enum.store(mapped_value, Ordering::SeqCst);
}
pub fn get_enum_value(atomic_enum: &AtomicI8) -> wThread {
    match atomic_enum.load(Ordering::SeqCst) {
        0 => wThread::None,
        1 => wThread::Populating,
        2 => wThread::Searching,
        3 => wThread::Listing,
        _ => wThread::None,
    }
}

use crate::{dirsize, sizeunit};
impl AppStateStore {
    pub fn new(expiration: u64) -> Self {
        // let (tx, rx) = mpsc::channel::<String>();

        Self {
            // filegptendpoint:getcustom("filedime", "gpt/filegpt.endpoint", "http://localhost:8694"),
            // Wrap the cache in a RwLock
            cstore: RwLock::new(FxHashMap::default()),
            includefolderinsearch: RwLock::new({
                let truechecker =
                    getcustom("filedime", "storevals/includefolderinsearch.set", "false");
                match (truechecker.as_str()) {
                    "true" => true,
                    _ => false,
                }
            }),
            whichthread: Arc::new(AtomicI8::new(0)),
            searchcounter: Arc::new(AtomicI16::new(0)),
            starttime: Arc::new(AtomicI64::new(0)),
            nosize: RwLock::new(true),
            excludehidden: RwLock::new({
                let truechecker = getcustom("filedime", "storevals/excludehidden.set", "false");
                match (truechecker.as_str()) {
                    "true" => true,
                    _ => false,
                }
            }),
            history: RwLock::new(HashMap::new()),
            // filesetcollection: RwLock::new(HashMap::new()),
            showfolderchildcount: RwLock::new(false),
            loadsearchlist: RwLock::new(false),
            tabs: RwLock::new({
                let truechecker = getcustom("filedime", "storevals/savetabs.set", "false");
                let mut fxhs = FxHashSet::default();
                match (truechecker.as_str()) {
                    "true" => {
                        for (_, content) in getallcustomwithin("filedime", "tabs", "tabinfo") {
                            fxhs.insert(content);
                        }
                    }
                    _ => match (dirs::home_dir()) {
                        Some(dn) => {
                            fxhs.insert(dn.to_string_lossy().to_string());
                        }
                        None => {}
                    },
                }
                clearall("filedime/tabs/", "tabinfo");
                fxhs
            }),
            expiration: Duration::from_secs(expiration),
            bookmarks: RwLock::new({
                let mut fxhs = HashSet::default();
                for (id, path) in getallcustomwithin("filedime", "bookmarks", "mark") {
                    fxhs.insert(marks {
                        path: path.clone(),
                        name: PathBuf::from(path.clone())
                            .file_stem()
                            .unwrap()
                            .to_string_lossy()
                            .to_string(),
                        is_dir: fs::metadata(Path::new(&path))
                            .map(|m| m.is_dir())
                            .unwrap_or(false),
                        id: id,
                    });
                }
                fxhs
            }),
            // messagetothread: RwLock::new(String::new()),
            // recents: Vec::new(),
            aborted: Arc::new(Mutex::new(false)),
            // filechanged: Arc::new(Mutex::new(false)),
            searchtry: Arc::new(Mutex::new(HashSet::new())),
            // st:Arc::new(Mutex::new(TrieNode::new())),
            stl: Arc::new(Mutex::new(FxHashMap::default())),
            process_count: Arc::new(Mutex::new(0)),
            buttonnames: {
                let mut buttonnames = HashMap::new();
                for (i, j) in getallcustomwithin("filedime", "custom_scripts", "fds") {
                    buttonnames.insert(i.clone(), j.clone());
                }
                buttonnames
            },
        }
    }
    pub fn addmark(&self, path: String, id: String) {
        savecustom("filedime", format!("bookmarks/{}.mark", id), path.clone());
        let pof = path.clone();
        let pathoffile = Path::new(&pof);
        self.bookmarks.write().unwrap().insert(marks {
            path: path.clone(),
            name: PathBuf::from(path)
                .file_stem()
                .unwrap()
                .to_string_lossy()
                .to_string(),
            is_dir: fs::metadata(pathoffile)
                .map(|m| m.is_dir())
                .unwrap_or(false),
            id: id,
        });
    }
    pub fn listtabs(&self) -> FxHashSet<String> {
        let tabs = self.tabs.read().unwrap().clone();
        tabs
    }
    pub fn addtab(&self, id: String, path: String, mut ff: String, windowname: String) {
        savecustom("filedime", format!("tabs/{}.tabinfo", id), path.clone());
        println!("{}---{}---{}", id, path, ff);

        let mut tabs = self.tabs.write().unwrap();
        tabs.insert(path);
    }
    pub fn removetab(&self, id: String, windowname: String) {
        clearcustom("filedime", format!("tabs/{}.tabinfo", id));
        // println!("{}---{}---{}",id,path,ff);

        let mut tabs = self.tabs.write().unwrap();
        tabs.remove(&(windowname + "." + &id));
    }
    pub fn removemark(&self, path: String, id: String) {
        clearcustom("filedime", format!("bookmarks/{}.mark", id));
        // println!("{}---{}---{}",id,path,ff);

        let mut marks = self.bookmarks.write().unwrap();
        marks.retain(|s| s.path != path);
    }
    pub fn getmarks(&self) -> HashSet<marks> {
        self.bookmarks.read().unwrap().clone()
    }
    // pub fn find_size(&self, path: &str) -> u64 {
    //     // return 0 as u64;
    //     let cstore=self.cstore.read().unwrap();

    //     // let k=0;
    //     // if(k==0){
    //     //     return 0;
    //     // }
    //     // Use a single read lock guard to access the cache
    //     let cache = cstore;

    //     if let Some(cstore) = cache.get(path) {
    //         let size=cstore.size;
    //         let expirytime=cstore.expirytime;
    //         let now = SystemTime::now();
    //         let duration = now.duration_since(UNIX_EPOCH).unwrap();
    //         let nowtime = duration.as_secs();
    //         // Use the same lock guard to get the expiry time
    //         // if let Some(expirytime) = cache.get(&("expiry_".to_string() + &path.to_string())) {
    //             if nowtime < expirytime {
    //                 return size;
    //             } else {
    //                 println!("expired")
    //             }
    //         // }
    //     }

    //     // Drop the read lock guard before acquiring a write lock guard
    //     drop(cache);
    //     let entry_path = Path::new(path);
    //     if(entry_path.is_file()){

    //         return entry_path.size_on_disk().unwrap_or(0)
    //     }
    //     if !entry_path.is_dir(){
    //         return 0;
    //     }
    //     let nosize=self.nosize.read().unwrap();
    //     if(*nosize){
    //         return 0
    //     }
    //     let mut size = {
    //             // 0 as u64
    //             dirsize::dir_size(
    //                 &entry_path.as_os_str().to_os_string().to_string_lossy().to_string(),
    //                 self,
    //             )

    //         };

    //     if(size!=0){
    //         // Use a single write lock guard to update the cache
    //         let  cstore=self.cstore.write().unwrap();

    //         let mut cache = cstore;

    //         let now = SystemTime::now();

    //         let later = now + (self.expiration);

    //         let duration = later.duration_since(UNIX_EPOCH).unwrap();

    //         let expirytime = duration.as_secs();
    //         // cache.insert("expiry_".to_string() + &path.to_string(), expirytime);
    //         cache.insert(path.to_string(), cachestore { size: size, expirytime: expirytime });

    //     }

    //     // Add the size of the key and the value to the total
    //     // self.size += mem::size_of_val(&path.to_string());
    //     // self.size += mem::size_of_val(&size);
    //     // self.print_cache_size();

    //     // self.size += mem::size_of_val(&"expiry_".to_string());
    //     // self.size += mem::size_of_val(&expirytime);

    //     size
    // }

    pub fn clear_cache(&self) {
        let now = Instant::now();

        let mut cstore = self.cstore.write().unwrap();
        let mut cache = cstore;
        // Use write method to get a lock guard
        cache.retain(|_, v| {
            let duration = Duration::from_secs(v.expirytime);

            let instant = now.checked_sub(duration).unwrap();

            now.duration_since(instant) < self.expiration
        });
    }
    // Add a method to print the total size of the cache
    pub fn print_cache_size(&self) -> i32
//   ->(u64,u64)
    {
        let cstore = self.cstore.read().unwrap();

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

        println!(
            "cache:{}----numfolders:{}---onlynamesize:{}",
            sizeunit::size(total_size as u64, true),
            cache.len() as u64,
            sizeunit::size(total_key_size as u64, true)
        );
        cache.len() as i32
        // Print the total size in bytes
        // println!("The cache size is {} bytes", total_size);
        // (total_size as u64,cache.len() as u64)
    }
    pub fn togglenosize(&self) {
        let shouldsize;
        {
            shouldsize = !*self.nosize.read().unwrap();
        }
        let mut setsize = self.nosize.write().unwrap();
        *setsize = shouldsize;
        drop(setsize)
        // {
        //     println!("{:?}",*self.nosize.read().unwrap())
        // }
    }
    pub fn togglehidden(&self) {
        let eh;
        {
            eh = !*self.excludehidden.read().unwrap();
        }
        savecustom("filedime", "storevals/excludehidden.set", eh);

        let mut seteh = self.excludehidden.write().unwrap();
        *seteh = eh;
        drop(seteh)
        // {
        //     println!("{:?}",*self.nosize.read().unwrap())
        // }
    }
    pub fn toggleif(&self) {
        let eh;
        {
            eh = !*self.includefolderinsearch.read().unwrap();
        }
        savecustom("filedime", "storevals/includefolderinsearch.set", eh);

        let mut seteh = self.includefolderinsearch.write().unwrap();
        *seteh = eh;
        drop(seteh)
        // {
        //     println!("{:?}",*self.nosize.read().unwrap())
        // }
    }
    pub fn togglefolcount(&self) {
        let tempstore;
        {
            tempstore = !*self.showfolderchildcount.read().unwrap();
        }
        let mut setstore = self.showfolderchildcount.write().unwrap();
        *setstore = tempstore;
        drop(setstore)
        // {
        //     println!("{:?}",*self.nosize.read().unwrap())
        // }
    }
}
