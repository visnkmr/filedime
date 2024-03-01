use std::{
    fs::Metadata,
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};

use filesize::PathExt;
use serde_json::json;
use tauri::{State, Window};

use crate::{
    appstate::{cachestore, AppStateStore},
    dirsize,
};

// Define constants for kilobyte, megabyte, gigabyte and terabyte
const KB: u64 = 1024;
const MB: u64 = KB.pow(2);
const GB: u64 = KB.pow(3);
const TB: u64 = KB.pow(4);

// Define a function that takes a number of bytes and a boolean flag for bits
// and returns a formatted string with the appropriate unit
pub fn size(B: u64, isbytes: bool) -> String {
    // If isbytes is false, multiply B by 8 to get bits
    let B = if isbytes { B } else { B * 8 };
    // Set the unit suffix based on isbytes
    let u = if isbytes { "B" } else { "b" };
    // Check the range of B and return the corresponding string
    if B < KB {
        format!("{}{}", B, u)
    } else if KB <= B && B < MB {
        format!("{} K{}", B / KB, u)
    } else if MB <= B && B < GB {
        format!("{} M{}", B / MB, u)
    } else if GB <= B && B < TB {
        format!("{} G{}", B / GB, u)
    } else if TB <= B {
        format!("{} T{}", B / TB, u)
    } else {
        "".to_string()
    }
}
pub fn find_size(path: &str, state: &State<'_, AppStateStore>) -> u64 {
    // return 0 as u64;
    let cstore = state.cstore.read().unwrap();

    // let k=0;
    // if(k==0){
    //     return 0;
    // }
    // Use a single read lock guard to access the cache
    let cache = cstore;

    if let Some(cstore) = cache.get(path) {
        let size = cstore.size;
        let expirytime = cstore.expirytime;
        let now = SystemTime::now();
        let duration = now.duration_since(UNIX_EPOCH).unwrap();
        let nowtime = duration.as_secs();
        // Use the same lock guard to get the expiry time
        // if let Some(expirytime) = cache.get(&("expiry_".to_string() + &path.to_string())) {
        if nowtime < expirytime {
            return (size);
        } else {
            println!("expired")
        }
        // }
    }

    // Drop the read lock guard before acquiring a write lock guard
    drop(cache);
    let entry_path = Path::new(path);
    if (entry_path.is_file()) {
        // println!("{:?}",entry_path);
        match (entry_path.metadata()) {
            Ok(md) => return (entry_path.size_on_disk_fast(&md).unwrap_or(0)),
            Err(e) => {
                println!("{:?}", entry_path);
                return (0);
            }
        };
    }
    if !entry_path.is_dir() {
        return (0);
    }
    let nosize = state.nosize.read().unwrap();
    if (*nosize) {
        // window.emit("infiniteloader",
        // // json!(
        //     {
        //     // "message": "pariter1",
        //     // "status": "running",
        //     }
        // // )
        // );
        return (0);
    }
    let mut size = {
        // 0 as u64
        dirsize::dir_size(
            &entry_path
                .as_os_str()
                .to_os_string()
                .to_string_lossy()
                .to_string(),
            &state,
        )
    };

    if (size != 0) {
        // Use a single write lock guard to update the cache
        let cstore = state.cstore.write().unwrap();

        let mut cache = cstore;

        let now = SystemTime::now();

        let later = now + (state.expiration);

        let duration = later.duration_since(UNIX_EPOCH).unwrap();

        let expirytime = duration.as_secs();
        // cache.insert("expiry_".to_string() + &path.to_string(), expirytime);
        cache.insert(
            path.to_string(),
            cachestore {
                size: size,
                expirytime: expirytime,
            },
        );
    }

    // Add the size of the key and the value to the total
    // self.size += mem::size_of_val(&path.to_string());
    // self.size += mem::size_of_val(&size);
    // self.print_cache_size();

    // self.size += mem::size_of_val(&"expiry_".to_string());
    // self.size += mem::size_of_val(&expirytime);

    (size)
}
