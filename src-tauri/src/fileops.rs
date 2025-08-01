use crate::lastmodcalc::lastmodified;
use crate::{existingfileinfo, opendialogwindow, sizeunit};
use fs_extra::dir;
use fs_extra::{dir::TransitState, TransitProcess};
use ignore::WalkBuilder;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::{fs, thread, time};
use tauri::{Manager, Window};
use std::collections::HashMap;

trait PathExt {
    fn exists_case_insensitive(&self) -> bool;
}

impl PathExt for Path {
    fn exists_case_insensitive(&self) -> bool {
        if self.exists() {
            return true;
        }

        // if let Some(parent) = self.parent() {
        //     if let Ok(entries) = fs::read_dir(parent) {
        //         for entry in entries {
        //             if let Ok(entry) = entry {
        //                 if entry.file_name().to_string_lossy().to_lowercase() == self.file_name().unwrap().to_string_lossy().to_lowercase() {
        //                     return true;
        //                 }
        //             }
        //         }
        //     }
        // }

        false
    }
}
struct infodest {
    path: String,
    size: u64,
    date: String,
}
#[tauri::command]
pub async fn doespathexist(mut path: String) -> Result<bool, ()> {
    let pathasbuf = PathBuf::from(path.clone());
    Ok(pathasbuf.exists_case_insensitive() || path == "drives://")
}
fn checkiffileexists(
    path: &String,
    dst: &String,
    len: u64,
    fromdir: bool,
) -> Result<(bool, infodest), String> {
    println!("--------------{:?} to {}", path, dst);
    let mut src_filename = "".to_string();
    if (!fromdir) {
        let src_path = Path::new(&path);
        match (src_path.file_name()) {
            Some(spath) => {
                src_filename = spath.to_string_lossy().to_string();
            }
            None => {
                return Err("File name not found".to_string());
            }
        };
    }

    // Append the filename to the destination path
    let destpath = if (fromdir) {
        PathBuf::from(&dst).join(path).to_string_lossy().to_string()
        // format!("{}{}",dst,path)
    } else {
        PathBuf::from(&dst)
            .join(src_filename)
            .to_string_lossy()
            .to_string()
        // format!("{}/{}",dst,src_filename)
    };
    let mut dst_path = Path::new(&destpath);

    println!("dest---->{:?}", dst_path);
    return if (dst_path.exists_case_insensitive()) {
        let destfilesize = fs::metadata(dst_path.clone()).unwrap().len();
        println!("File {} exists, size: {} bytes", path, len);
        Ok((
            true,
            infodest {
                path: destpath.clone(),
                size: destfilesize,
                date: lastmodified(&destpath).0,
            },
        ))
    } else {
        Ok((
            false,
            infodest {
                path: "".to_string(),
                size: 0,
                date: "".to_string(),
            },
        ))
    };
}
fn checkindir(
    path: &String,
    dst: &String,
    ltpt: &String,
    shouldadd: &mut Vec<existingfileinfo>,
) -> Result<(), String> {
    let threads = (num_cpus::get() as f64 * 0.75).round() as usize;
    for entry in WalkBuilder::new(path)
        .threads(threads)
        .hidden(false) // Include hidden files and directories
        .follow_links(false)
        .parents(false)
        .git_exclude(false)
        .ignore(false) // Disable the default ignore rules
        .git_ignore(false)
        .build()
        .into_iter()
    {
        // println!("{:?}",entry);
        match (entry) {
            Ok(e) => {
                // println!("{:?}",e);
                if let Some(eft) = (e.file_type()) {
                    if (eft.is_file()) {
                        // println!("{:?}",eft);
                        match (fs::metadata(e.path())) {
                            Ok(mdf) => {
                                // println!("{:?}",mdf);
                                match checkiffileexists(
                                    &e.path().to_string_lossy().to_string().replace(ltpt, ""),
                                    &dst,
                                    mdf.len(),
                                    true,
                                ) {
                                    Ok(shadd) => {
                                        if (shadd.0) {
                                            shouldadd.push(existingfileinfo {
                                                sourcepath: (e
                                                    .path()
                                                    .to_string_lossy()
                                                    .to_string()),
                                                destpath: shadd.1.path,
                                                existingfilesize: sizeunit::size(
                                                    shadd.1.size,
                                                    true,
                                                ),
                                                srcfilesize: sizeunit::size(mdf.len(), true),
                                                existingdate: shadd.1.date,
                                                srcfiledate: lastmodified(
                                                    &e.path().to_string_lossy().to_string(),
                                                )
                                                .0,
                                            })
                                        }
                                    }
                                    Err(e) => return Err(e),
                                };
                            }
                            Err(e) => return Err(format!("{}", e)),
                        }
                    }
                }
            }
            Err(e) => return Err(format!("{}", e)),
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn new(dest: String, isdir: bool, name: String, window: Window) -> Result<(), String> {
    // Create the directory
    let dest_path = Path::new(&dest);
    fs::create_dir_all(&dest).map_err(|e| {
        let title = "Failed";
        let desc = format!("Failed to find/create folder: {}", e);
        opendialogwindow(&window.app_handle(), title, &desc, "");
        desc
    })?;

    let whatwascreated = if (isdir) {
        // Combine the destination path with the folder name using join
        let dir_path = dest_path.join(name.clone());
        fs::create_dir_all(&dir_path).map_err(|e| {
            let title = "Failed";
            let desc = format!("Failed to create folder: {}", e);
            opendialogwindow(&window.app_handle(), title, &desc, "");
            desc
        })?;
        "Folder"
    } else {
        // Combine the directory path with the file name using join
        let file_path = dest_path.join(name.clone());
        fs::File::create(&file_path).map_err(|e| {
            let title = "Failed";
            let desc = format!("Failed to create file: {}", e);
            opendialogwindow(&window.app_handle(), title, &desc, "");
            desc
        })?;
        "File"
    };
    let title = &format!("{} created", whatwascreated);
    let desc = &format!("{} was created @ {}", name, dest);
    opendialogwindow(&window.app_handle(), title, desc, "");
    Ok(())
}
#[tauri::command]
pub async fn checkforconflicts(srclist: String, dst: String) -> Result<String, String> {
    let mut thatexists = vec![];
    match serde_json::from_str(&srclist) {
        Ok(list) => {
            let src: Vec<String> = list;

            // if(dst_path.exists())
            for path in src {
                println!("{}", path);
                let mut locationtoputto = "".to_string();
                match fs::metadata(path.clone()) {
                    Ok(metadata) => {
                        if metadata.is_file() {
                            match checkiffileexists(&path, &dst, metadata.len().clone(), false) {
                                Ok(shouldadd) => {
                                    if (shouldadd.0) {
                                        thatexists.push(existingfileinfo {
                                            sourcepath: path.clone(),
                                            destpath: shouldadd.1.path.clone(),
                                            existingfilesize: sizeunit::size(
                                                (shouldadd.1.size),
                                                true,
                                            ),
                                            srcfilesize: sizeunit::size(metadata.len(), true),
                                            existingdate: lastmodified(&shouldadd.1.path).0,
                                            srcfiledate: lastmodified(&path).0,
                                        })
                                    }
                                }
                                Err(e) => return Err(e),
                            }
                        } else if (metadata.is_dir()) {
                            let parpath = Path::new(&path);
                            // println!("{}",path);
                            match parpath.parent() {
                                Some(parent) => {
                                    locationtoputto = parent.to_string_lossy().to_string();
                                }
                                None => locationtoputto = "".to_string(),
                            }
                            checkindir(&path, &dst, &locationtoputto, &mut thatexists)?
                            // println!("Path {} is not a file", path);
                        }
                    }
                    Err(e) => {
                        println!("File {} does not exist", path)
                    }
                }
            }
        }
        Err(e) => return Err(format!("{}", e)),
    }
    Ok(serde_json::to_string(&thatexists).unwrap())
    // println!("{:?}",src);
}

// "[\"/home/roger/seat_items.txt\",\"/home/roger/Downloads\"]"

#[derive(Deserialize, Serialize, Debug)]
struct dlads {
    sourcepath: String,
    destpath: String,
    replace: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileOpProgress {
    pub current_file: String,
    pub files_completed: usize,
    pub total_files: usize,
    pub bytes_copied: u64,
    pub total_bytes: u64,
    pub current_file_progress: f64,
    pub overall_progress: f64,
    pub operation_type: String, // "copy" or "move"
    pub status: String, // "running", "paused", "completed", "error"
    pub error_message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileOpState {
    pub operation_id: String,
    pub files_remaining: Vec<String>,
    pub files_completed: Vec<String>,
    pub destination: String,
    pub operation_type: String,
    pub conflicts_resolved: HashMap<String, bool>, // path -> should_replace
}

// Global state for tracking operations
lazy_static::lazy_static! {
    static ref ACTIVE_OPERATIONS: Arc<Mutex<HashMap<String, FileOpState>>> = Arc::new(Mutex::new(HashMap::new()));
}

#[tauri::command]
pub async fn start_file_operation(
    operation_id: String,
    srclist: String,
    dst: String,
    operation_type: String,
    dlastore: String,
    window: Window,
) -> Result<String, String> {
    let src_files: Vec<String> = serde_json::from_str(&srclist)
        .map_err(|e| format!("Failed to parse source list: {}", e))?;
    
    let conflicts_resolved: HashMap<String, bool> = if !dlastore.is_empty() && dlastore != "[]" {
        let dlas: Vec<dlads> = serde_json::from_str(&dlastore)
            .map_err(|e| format!("Failed to parse conflicts: {}", e))?;
        dlas.into_iter()
            .map(|d| (d.destpath, d.replace))
            .collect()
    } else {
        HashMap::new()
    };

    // Store operation state
    {
        let mut operations = ACTIVE_OPERATIONS.lock().unwrap();
        operations.insert(operation_id.clone(), FileOpState {
            operation_id: operation_id.clone(),
            files_remaining: src_files.clone(),
            files_completed: Vec::new(),
            destination: dst.clone(),
            operation_type: operation_type.clone(),
            conflicts_resolved,
        });
    }

    // Start operation in background
    let op_id = operation_id.clone();
    let window_clone = window.clone();
    tokio::spawn(async move {
        let window_for_op = window_clone.clone();
        let result = if operation_type == "move" {
            execute_move_operation(op_id.clone(), window_for_op).await
        } else {
            execute_copy_operation(op_id.clone(), window_for_op).await
        };

        // Clean up operation state on completion
        {
            let mut operations = ACTIVE_OPERATIONS.lock().unwrap();
            operations.remove(&op_id);
        }

        // Send completion event
        let _ = window_clone.emit("file_operation_complete", result);
    });

    Ok(operation_id)
}

#[tauri::command]
pub async fn pause_file_operation(operation_id: String) -> Result<bool, String> {
    // Implementation for pausing operations
    // This would require more complex state management
    Ok(true)
}

#[tauri::command]
pub async fn resume_file_operation(operation_id: String, window: Window) -> Result<bool, String> {
    let operation_exists = {
        let operations = ACTIVE_OPERATIONS.lock().unwrap();
        operations.contains_key(&operation_id)
    };

    if !operation_exists {
        return Err("Operation not found".to_string());
    }

    // Resume operation
    let op_id = operation_id.clone();
    let window_clone = window.clone();
    tokio::spawn(async move {
        let operation_type = {
            let operations = ACTIVE_OPERATIONS.lock().unwrap();
            operations.get(&op_id).map(|op| op.operation_type.clone())
        };

        if let Some(op_type) = operation_type {
            let window_for_op = window_clone.clone();
            let result = if op_type == "move" {
                execute_move_operation(op_id.clone(), window_for_op).await
            } else {
                execute_copy_operation(op_id.clone(), window_for_op).await
            };

            let _ = window_clone.emit("file_operation_complete", result);
        }
    });

    Ok(true)
}

async fn execute_copy_operation(operation_id: String, window: Window) -> Result<bool, String> {
    let (src_files, dst, conflicts_resolved) = {
        let operations = ACTIVE_OPERATIONS.lock().unwrap();
        let operation = operations.get(&operation_id)
            .ok_or_else(|| "Operation not found".to_string())?;
        (
            operation.files_remaining.clone(),
            operation.destination.clone(),
            operation.conflicts_resolved.clone(),
        )
    };

    let total_files = src_files.len();
    let mut total_bytes = 0u64;

    // Calculate total size
    for file_path in &src_files {
        if let Ok(metadata) = fs::metadata(file_path) {
            total_bytes += if metadata.is_dir() {
                calculate_dir_size(file_path)
            } else {
                metadata.len()
            };
        }
    }

    let options = dir::CopyOptions::new();
    let bytes_copied = Arc::new(Mutex::new(0u64));
    let files_completed = Arc::new(Mutex::new(0usize));
    
    let window_clone = window.clone();
    let bytes_copied_clone = bytes_copied.clone();
    let files_completed_clone = files_completed.clone();
    let handle = move |process_info: TransitProcess| {
        *bytes_copied_clone.lock().unwrap() = process_info.copied_bytes;
        let current_bytes_copied = *bytes_copied_clone.lock().unwrap();
        let current_files_completed = *files_completed_clone.lock().unwrap();
        
        let progress = FileOpProgress {
            current_file: process_info.file_name.clone(),
            files_completed: current_files_completed,
            total_files,
            bytes_copied: current_bytes_copied,
            total_bytes,
            current_file_progress: if process_info.file_total_bytes > 0 {
                (process_info.file_bytes_copied as f64 / process_info.file_total_bytes as f64) * 100.0
            } else {
                0.0
            },
            overall_progress: if total_bytes > 0 {
                (current_bytes_copied as f64 / total_bytes as f64) * 100.0
            } else {
                0.0
            },
            operation_type: "copy".to_string(),
            status: "running".to_string(),
            error_message: None,
        };

        let _ = window_clone.emit("file_operation_progress", &progress);

        if process_info.state == TransitState::Exists {
            if let Some(&should_replace) = conflicts_resolved.get(&process_info.file_name) {
                if should_replace {
                    return fs_extra::dir::TransitProcessResult::Overwrite;
                } else {
                    return fs_extra::dir::TransitProcessResult::Skip;
                }
            }
        }

        thread::sleep(time::Duration::from_millis(100)); // Throttle updates
        fs_extra::dir::TransitProcessResult::ContinueOrAbort
    };

    match fs_extra::copy_items_with_progress(&src_files, &dst, &options, handle) {
        Ok(_) => {
            let final_files_completed = total_files;
            let final_progress = FileOpProgress {
                current_file: "".to_string(),
                files_completed: final_files_completed,
                total_files,
                bytes_copied: total_bytes,
                total_bytes,
                current_file_progress: 100.0,
                overall_progress: 100.0,
                operation_type: "copy".to_string(),
                status: "completed".to_string(),
                error_message: None,
            };
            let _ = window.emit("file_operation_progress", &final_progress);
            Ok(true)
        }
        Err(e) => {
            let current_bytes_copied = *bytes_copied.lock().unwrap();
            let current_files_completed = *files_completed.lock().unwrap();
            let error_progress = FileOpProgress {
                current_file: "".to_string(),
                files_completed: current_files_completed,
                total_files,
                bytes_copied: current_bytes_copied,
                total_bytes,
                current_file_progress: 0.0,
                overall_progress: if total_bytes > 0 {
                    (current_bytes_copied as f64 / total_bytes as f64) * 100.0
                } else {
                    0.0
                },
                operation_type: "copy".to_string(),
                status: "error".to_string(),
                error_message: Some(e.to_string()),
            };
            let _ = window.emit("file_operation_progress", &error_progress);
            Err(e.to_string())
        }
    }
}

async fn execute_move_operation(operation_id: String, window: Window) -> Result<bool, String> {
    let (src_files, dst, conflicts_resolved) = {
        let operations = ACTIVE_OPERATIONS.lock().unwrap();
        let operation = operations.get(&operation_id)
            .ok_or_else(|| "Operation not found".to_string())?;
        (
            operation.files_remaining.clone(),
            operation.destination.clone(),
            operation.conflicts_resolved.clone(),
        )
    };

    let total_files = src_files.len();
    let mut total_bytes = 0u64;

    // Calculate total size
    for file_path in &src_files {
        if let Ok(metadata) = fs::metadata(file_path) {
            total_bytes += if metadata.is_dir() {
                calculate_dir_size(file_path)
            } else {
                metadata.len()
            };
        }
    }

    let options = dir::CopyOptions::new();
    let bytes_copied = Arc::new(Mutex::new(0u64));
    let files_completed = Arc::new(Mutex::new(0usize));
    
    let window_clone = window.clone();
    let bytes_copied_clone = bytes_copied.clone();
    let files_completed_clone = files_completed.clone();
    let handle = move |process_info: TransitProcess| {
        *bytes_copied_clone.lock().unwrap() = process_info.copied_bytes;
        let current_bytes_copied = *bytes_copied_clone.lock().unwrap();
        let current_files_completed = *files_completed_clone.lock().unwrap();
        
        let progress = FileOpProgress {
            current_file: process_info.file_name.clone(),
            files_completed: current_files_completed,
            total_files,
            bytes_copied: current_bytes_copied,
            total_bytes,
            current_file_progress: if process_info.file_total_bytes > 0 {
                (process_info.file_bytes_copied as f64 / process_info.file_total_bytes as f64) * 100.0
            } else {
                0.0
            },
            overall_progress: if total_bytes > 0 {
                (current_bytes_copied as f64 / total_bytes as f64) * 100.0
            } else {
                0.0
            },
            operation_type: "move".to_string(),
            status: "running".to_string(),
            error_message: None,
        };

        let _ = window_clone.emit("file_operation_progress", &progress);

        if process_info.state == TransitState::Exists {
            if let Some(&should_replace) = conflicts_resolved.get(&process_info.file_name) {
                if should_replace {
                    return fs_extra::dir::TransitProcessResult::Overwrite;
                } else {
                    return fs_extra::dir::TransitProcessResult::Skip;
                }
            }
        }

        thread::sleep(time::Duration::from_millis(100)); // Throttle updates
        fs_extra::dir::TransitProcessResult::ContinueOrAbort
    };

    match fs_extra::move_items_with_progress(&src_files, &dst, &options, handle) {
        Ok(_) => {
            let final_files_completed = total_files;
            let final_progress = FileOpProgress {
                current_file: "".to_string(),
                files_completed: final_files_completed,
                total_files,
                bytes_copied: total_bytes,
                total_bytes,
                current_file_progress: 100.0,
                overall_progress: 100.0,
                operation_type: "move".to_string(),
                status: "completed".to_string(),
                error_message: None,
            };
            let _ = window.emit("file_operation_progress", &final_progress);
            Ok(true)
        }
        Err(e) => {
            let current_bytes_copied = *bytes_copied.lock().unwrap();
            let current_files_completed = *files_completed.lock().unwrap();
            let error_progress = FileOpProgress {
                current_file: "".to_string(),
                files_completed: current_files_completed,
                total_files,
                bytes_copied: current_bytes_copied,
                total_bytes,
                current_file_progress: 0.0,
                overall_progress: if total_bytes > 0 {
                    (current_bytes_copied as f64 / total_bytes as f64) * 100.0
                } else {
                    0.0
                },
                operation_type: "move".to_string(),
                status: "error".to_string(),
                error_message: Some(e.to_string()),
            };
            let _ = window.emit("file_operation_progress", &error_progress);
            Err(e.to_string())
        }
    }
}

fn calculate_dir_size(path: &str) -> u64 {
    let mut total_size = 0u64;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_dir() {
                    total_size += calculate_dir_size(&entry.path().to_string_lossy());
                } else {
                    total_size += metadata.len();
                }
            }
        }
    }
    total_size
}

// Legacy functions for backward compatibility
#[tauri::command]
pub async fn moveop(srclist: String, dst: String, dlastore: String) -> Result<bool, String> {
    println!("{}--{}--{}", srclist, dst, dlastore);
    match serde_json::from_str(&srclist) {
        Ok(list) => {
            let src: Vec<String> = list;
            println!("moving started");
            let mut options = dir::CopyOptions::new();
            
            let handle = |process_info: TransitProcess| {
                match serde_json::from_str(&dlastore) {
                    Ok(a) => {
                        let dlas: Vec<dlads> = a;

                        if (process_info.state == TransitState::Exists) {
                            let exists = dlas
                                .iter()
                                .find(|dlad| dlad.destpath == process_info.file_name)
                                .map(|dlad| dlad.replace);
                            match exists {
                                Some(a) => {
                                    if (a) {
                                        println!("Overwrite {:?}", process_info);
                                        return fs_extra::dir::TransitProcessResult::Overwrite;
                                    } else {
                                        println!("Skip {:?}", process_info);
                                        return fs_extra::dir::TransitProcessResult::Skip;
                                    }
                                }
                                None => {
                                    println!("Unknown {:?}", process_info);
                                    return fs_extra::dir::TransitProcessResult::ContinueOrAbort;
                                }
                            }
                        } else {
                            println!("Unknown2 {}", process_info.file_name);
                            thread::sleep(time::Duration::from_millis(500));
                            return fs_extra::dir::TransitProcessResult::ContinueOrAbort;
                        }
                    }
                    Err(i) => {
                        println!("Error {} @ {}", i, process_info.file_name);
                        fs_extra::dir::TransitProcessResult::Abort
                    }
                }
            };
            
            match (fs_extra::move_items_with_progress(&src, dst, &options, handle)) {
                Ok(_) => {
                    println!("move executed successfully");
                    return Ok(true);
                }
                Err(e) => {
                    println!("move error {}", e.to_string());
                    return Err(e.to_string());
                }
            }
        }
        Err(e) => {
            println!("cannot parse data");
            return Err(format!("{}", e));
        }
    }
}

#[tauri::command]
pub async fn fileop(srclist: String, dst: String, dlastore: String) -> Result<bool, String> {
    println!("{}--{}--{}", srclist, dst, dlastore);
    match serde_json::from_str(&srclist) {
        Ok(list) => {
            let src: Vec<String> = list;
            println!("copying started");
            //  let mut last_print = Instant::now();
            let mut options = dir::CopyOptions::new();
            //Initialize default values for CopyOptions
            //  options.buffer_size = 1;
            // let mut last_print = Instant::now();
            // let mut last_copied=0;
            // let mut laststate= dir::TransitState::Normal;
            // let mut lastfolder= "".to_string();
            // let mut lastfile= "".to_string();
            // let mut lastfilesize=0;
            let handle = |process_info: TransitProcess| {
                match serde_json::from_str(&dlastore) {
                    Ok(a) => {
                        let dlas: Vec<dlads> = a;

                        if (process_info.state == TransitState::Exists) {
                            let exists = dlas
                                .iter()
                                .find(|dlad| dlad.destpath == process_info.file_name)
                                .map(|dlad| dlad.replace);
                            match exists {
                                Some(a) => {
                                    if (a) {
                                        println!("Overwrite {:?}", process_info);
                                        return fs_extra::dir::TransitProcessResult::Overwrite;
                                    } else {
                                        println!("Skip {:?}", process_info);

                                        return fs_extra::dir::TransitProcessResult::Skip;
                                    }
                                }
                                None => {
                                    println!("Unknown {:?}", process_info);

                                    return fs_extra::dir::TransitProcessResult::ContinueOrAbort;
                                }
                            }
                        } else {
                            println!("Unknown2 {}", process_info.file_name);
                            // tx.send(process_info).unwrap();
                            thread::sleep(time::Duration::from_millis(500));

                            return fs_extra::dir::TransitProcessResult::ContinueOrAbort;
                        }
                    }
                    Err(i) => {
                        println!("Error {} @ {}", i, process_info.file_name);

                        fs_extra::dir::TransitProcessResult::Abort
                    }
                }
            };
            {
                match (fs_extra::copy_items_with_progress(&src, dst, &options, handle)) {
                    Ok(_) => {
                        println!("executed successfully");
                        return Ok(true);
                    }
                    Err(e) => {
                        println!("error {}", e.to_string());
                        return Err(e.to_string());
                    }
                }
            }
        }
        Err(e) => {
            println!("cannot parse data");
            return Err(format!("{}", e));
        }
    }
}

// wite tests with below code to test functions

#[tokio::test]
async fn test_copy_cut_paste_operations() {
    use std::fs;
    use std::path::Path;
    
    // Setup test directories and files
    let test_base = "/tmp/fileops_test";
    let src_dir = format!("{}/src", test_base);
    let dest_dir = format!("{}/dest", test_base);
    let move_dest_dir = format!("{}/move_dest", test_base);
    
    // Clean up any existing test directories
    let _ = fs::remove_dir_all(test_base);
    
    // Create test structure
    fs::create_dir_all(&src_dir).expect("Failed to create src directory");
    fs::create_dir_all(&dest_dir).expect("Failed to create dest directory");
    fs::create_dir_all(&move_dest_dir).expect("Failed to create move_dest directory");
    
    // Create test files and directories
    let test_file1 = format!("{}/test1.txt", src_dir);
    let test_file2 = format!("{}/test2.txt", src_dir);
    let test_subdir = format!("{}/subdir", src_dir);
    let test_file3 = format!("{}/subdir/test3.txt", src_dir);
    
    fs::write(&test_file1, "Content of test1.txt").expect("Failed to create test1.txt");
    fs::write(&test_file2, "Content of test2.txt").expect("Failed to create test2.txt");
    fs::create_dir_all(&test_subdir).expect("Failed to create subdir");
    fs::write(&test_file3, "Content of test3.txt").expect("Failed to create test3.txt");
    
    println!("=== Testing Copy Operation ===");
    
    // Test copy operation
    let copy_result = fileop(
        serde_json::to_string(&[test_file1.clone(), test_subdir.clone()]).unwrap(),
        dest_dir.clone(),
        "[]".to_string()
    ).await;
    
    match copy_result {
        Ok(success) => {
            println!("Copy operation successful: {}", success);
            // Verify files were copied
            assert!(Path::new(&format!("{}/test1.txt", dest_dir)).exists(), "test1.txt should be copied");
            assert!(Path::new(&format!("{}/subdir/test3.txt", dest_dir)).exists(), "subdir/test3.txt should be copied");
            // Verify original files still exist
            assert!(Path::new(&test_file1).exists(), "Original test1.txt should still exist after copy");
            assert!(Path::new(&test_subdir).exists(), "Original subdir should still exist after copy");
        }
        Err(e) => panic!("Copy operation failed: {}", e),
    }
    
    println!("=== Testing Move Operation (Cut) ===");
    
    // Test move operation (cut)
    let move_result = moveop(
        serde_json::to_string(&[test_file2.clone()]).unwrap(),
        move_dest_dir.clone(),
        "[]".to_string()
    ).await;
    
    match move_result {
        Ok(success) => {
            println!("Move operation successful: {}", success);
            // Verify file was moved
            assert!(Path::new(&format!("{}/test2.txt", move_dest_dir)).exists(), "test2.txt should be moved to destination");
            // Verify original file no longer exists
            assert!(!Path::new(&test_file2).exists(), "Original test2.txt should not exist after move");
        }
        Err(e) => panic!("Move operation failed: {}", e),
    }
    
    println!("=== Testing Conflict Detection ===");
    
    // Test conflict detection
    let conflict_result = checkforconflicts(
        serde_json::to_string(&[format!("{}/test1.txt", dest_dir)]).unwrap(),
        dest_dir.clone()
    ).await;
    
    match conflict_result {
        Ok(conflicts) => {
            println!("Conflict detection result: {}", conflicts);
            let parsed_conflicts: Vec<serde_json::Value> = serde_json::from_str(&conflicts).unwrap();
            assert!(parsed_conflicts.len() > 0, "Should detect conflict for existing file");
        }
        Err(e) => panic!("Conflict detection failed: {}", e),
    }
    
    println!("=== All Tests Passed! ===");
    
    // Clean up
    let _ = fs::remove_dir_all(test_base);
}

#[tokio::test]
async fn createfilestotest() {
    // Create directories
    // fs::create_dir_all("/tmp/new/est/a").expect("Failed to create directory 'a'");
    // fs::create_dir_all("/tmp/new/est/c").expect("Failed to create directory 'c'");
    // fs::create_dir_all("/tmp/new/est/c/d").expect("Failed to create directory 'c'");
    // // ["/tmp/new/est/a","/tmp/new/est/d","/tmp/new/est/f.txt"]

    // // // Create files
    // fs::write("/tmp/new/est/a/b.txt", "").expect("Failed to create file 'b.txt'");
    // fs::write("/tmp/new/est/c/d/e.txt", "").expect("Failed to create file 'e.txt'");
    // fs::write("/tmp/new/est/f.txt", "").expect("Failed to create file 'f.txt'");
    let _ = fileop(serde_json::to_string(&["/tmp/new/est/a","/tmp/new/est/c","/tmp/new/est/f.txt"]).unwrap(), "/tmp/new/est/dest/".to_string(),r#"[{"sourcepath":"/tmp/new/est/a/b.txt","destpath":"/tmp/new/est/dest/a/b.txt","replace":false},{"sourcepath":"/tmp/new/est/f.txt","destpath":"/tmp/new/est/dest/f.txt","replace":false}]"#.to_string()).await;
    // let mut options = dir::CopyOptions::new().buffer_size(1).skip_exist(true);
    // let handler=|process_info|{
    //   println!("{:?}",process_info);
    //   fs_extra::dir::TransitProcessResult::ContinueOrAbort
    // };
    // fs_extra::copy_items_with_progress(&["/tmp/new/est/a","/tmp/new/est/c","/tmp/new/est/f.txt"], "/tmp/new/est/dest/", &options, handler).unwrap();
    //removed async from calling functions
    // println!("{:?}",checkforconflicts(serde_json::to_string(&vec!["/tmp/new/est/a/b.txt","/tmp/new/est/c/d/e.txt"]).unwrap(), "/tmp/new/est/dest".to_string()));
    // println!("{:?}",fileop(serde_json::to_string(&vec!["/tmp/new/est/a","/tmp/new/est/c","/tmp/new/est/c/d","/tmp/new/est/a/b.txt","/tmp/new/est/c/d/e.txt"]).unwrap(),"/tmp/new/est/dest".to_string(),serde_json::to_string(&vec![""]).unwrap()));
}
