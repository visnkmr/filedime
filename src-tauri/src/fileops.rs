use crate::lastmodcalc::lastmodified;
use crate::{existingfileinfo, opendialogwindow, sizeunit};
use chrono::format::format;
use fs_extra::dir;
use fs_extra::{dir::TransitState, TransitProcess};
use ignore::WalkBuilder;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{self, TryRecvError};
use std::time::Duration;
use std::{fs, thread, time};
use tauri::{Manager, Window};
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
    fileop(serde_json::to_string(&["/tmp/new/est/a","/tmp/new/est/c","/tmp/new/est/f.txt"]).unwrap(), "/tmp/new/est/dest/".to_string(),r#"[{"sourcepath":"/tmp/new/est/a/b.txt","destpath":"/tmp/new/est/dest/a/b.txt","replace":false},{"sourcepath":"/tmp/new/est/f.txt","destpath":"/tmp/new/est/dest/f.txt","replace":false}]"#.to_string()).await;
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
