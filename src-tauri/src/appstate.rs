#![warn(clippy::disallowed_types)]
use filesize::PathExt;
use prefstore::{clearcustom, getallcustomwithin, getcustom, savecustom, clearall};
use std::collections::{HashSet, HashMap};
use std::fs;
use std::mem::{self};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicI8, Ordering, AtomicI16, AtomicI64};
// use std::sync::mpsc::{Sender, Receiver};
use rustc_hash::{FxHashMap, FxHashSet};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use std::sync::{RwLock, Mutex, Arc};
#[derive(Clone,Debug)]
// Use the gio crate
// use gio::prelude::*;
pub struct cachestore{
    pub size:u64,
    pub expirytime: u64,
}


#[derive(Debug)]
pub struct AppStateStore {
    pub cstore:RwLock<FxHashMap<String,cachestore>>,
    
}
#[derive(Debug)]
pub enum wThread {
    None,
    Populating,
    Searching,
    Listing
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
pub fn get_enum_value(atomic_enum: &AtomicI8)->wThread {
    match atomic_enum.load(Ordering::SeqCst) {
        0 => wThread::None,
        1 => wThread::Populating ,
        2 => wThread::Searching,
        3 => wThread::Listing,
        _ => wThread::None
    }
}

// use crate::{dirsize, sizeunit};
impl AppStateStore {
    pub fn new(expiration: u64) -> Self {
        // let (tx, rx) = mpsc::channel::<String>();

        Self {
            // Wrap the cache in a RwLock
            cstore:RwLock::new(FxHashMap::default()),
            
        }
    }
    
}
