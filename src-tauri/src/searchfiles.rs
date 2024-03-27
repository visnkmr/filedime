use std::{
    collections::{HashMap, HashSet},
    fs::{self, File},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicI16, Ordering},
        mpsc::{self, TryRecvError},
        Arc, Mutex, RwLock,
    },
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use ignore::WalkBuilder;
use rayon::prelude::*;
use serde::Serialize;
use serde_json::json;
// use rust_search::similarity_sort;
use tauri::{Manager, State, Window};
// use walkdir::WalkDir;

use crate::{
    appstate::*,
    fileitem::*,
    filltrie::populate_try,
    // loadjs::loadjs
    getuniquewindowlabel,
    opendialogwindow,
    // partialratio::*,
    sendtofrontend::*,
    FileItem,
};
use fuzzy_matcher::{clangd::fuzzy_match, *};
#[derive(Clone, Debug, Serialize)]
struct rstr {
    term: String,
    files: HashSet<FileItem>,
}
#[tauri::command]
pub async fn search_try(
    mut starttime: i64,
    windowname: String,
    mut string: String,
    window: Window,
    state: State<'_, AppStateStore>,
) -> Result<(), String>
//  -> Vec<String>
{
    if (string.len() < 3) {
        opendialogwindow(
            &window.app_handle(),
            "search aborted",
            "enter at least 3 characters to search",
            &getuniquewindowlabel(),
        );
        return Ok(());
    }

    let searchthrough = state.stl.lock().unwrap();
    let map = searchthrough.clone();
    let filescount = map.len();

    drop(searchthrough);
    if (filescount < 1) {
        opendialogwindow(
            &window.app_handle(),
            "Populate search list first",
            "No files to search through",
            &getuniquewindowlabel(),
        );
        return Err("No files to search through".to_string());
    }

    let mut exactmatch = false;
    if string.starts_with("\"") && string.ends_with("\"") {
        exactmatch = true;
        string = string[1..string.len() - 1].to_string();
    }
    let orig = *state.process_count.lock().unwrap();

    window.emit("reloadlist", "resettable").unwrap();

    let counter = &state.searchcounter;
    let currentcoutnervalue = counter.load(Ordering::SeqCst);
    state
        .searchcounter
        .store(currentcoutnervalue + 1, Ordering::SeqCst);
    let local_counter = Arc::new(AtomicI16::new(0));
    local_counter.store(currentcoutnervalue + 1, Ordering::SeqCst);

    let wname = windowname.clone();
    // opendialogwindow(&window.app_handle(),"received search","iop",&windowname);
    // populate_try(path, &state);

    // state.filesetcollection.write().unwrap().clear();
    // sendfilesetcollection(
    //     &wname,
    //     &window.app_handle(),
    //     &serde_json::to_string(&*state.filesetcollection.read().unwrap()).unwrap(),
    // );

    let files = Arc::new(Mutex::new(Vec::<FileItem>::new()));
    let files_clone = Arc::clone(&files);
    let tfsize = Arc::new(Mutex::<u64>::new(0));
    let doneornot = Arc::new(Mutex::<bool>::new(false));
    let doneornot_clone = doneornot.clone();
    let mut nootimes = 0;
    let tfsize_clone = tfsize.clone();
    // let (tx, rx) = mpsc::channel();
    let window2 = window.clone();
    let app_handle = window.app_handle();
    let string2 = string.clone();

    let windowname2 = windowname.clone();
    let update: Vec<u64> = vec![1, 2, 5, 7, 10, 20, 40, 65, 90, 120];
    let mut countoff = 0;
    let mut firsttime = true;
    // spawn a new thread to print the value of the files vector every 200 milliseconds
    let handle = thread::spawn(move || {
        // let state1=state.clone();
        let mut last_print = Instant::now(); // initialize the last print time to the current time
        loop {
            // let string=string.clone();
            // if &s2.lock().unwrap().process_count.lock().unwrap().clone().abs_diff(orig)>&0 { // check if the current count value is different from the original one
            //   break; // if yes, it means a new command has been invoked and the old one should be canceled
            // }
            nootimes += 1;

            let mut msval = &(30 as u64);
            if (firsttime || countoff > 1) {
                if (countoff > 1) {
                    msval = update.iter().next().unwrap_or(&120);
                }

                if last_print.elapsed() >= Duration::from_millis(*msval) {
                    let files = files_clone.lock().unwrap();
                    countoff = files.len();
                    if (countoff > 1) {
                        firsttime = false;
                    }
                    let don = doneornot.lock().unwrap();
                    // check if 200 milliseconds have passed since the last print

                    // println!("{}------{}----{}",nootimes,files.len(),fcount);
                    //           // push the file item to the vector
                    // totsize+=mem::size_of_val(&file);
                    // slist(&windowname,&app_handle,&files.clone(),string2.clone());
                    processing(&windowname.clone(), &window2.app_handle(), {
                        format!("searching for {}", string2)
                    });
                    if *don {
                        opendialogwindow(
                            &app_handle,
                            "Search complete",
                            &format!("total {} files found from {}", files.len(), filescount),
                            "",
                        );
                        processing(&windowname.clone(), &window2.app_handle(), {
                            format!("completed search for {}", string2)
                        });
                        // window2.emit("infiniteloader",
                        //   json!({
                        //       "message": "lfiles",
                        //       "status": "stop",
                        //       })
                        //   );
                        // handle.abort();
                        // stoptimer(&windowname, &window.app_handle());
                        break;
                    }
                }
                // println!("Files: {:?}", files); // print the vector value
                last_print = Instant::now(); // update the last print time to the current time
            }
            thread::sleep(Duration::from_millis(30)); // sleep for 10 milliseconds to avoid busy waiting
        }
    });

    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let startime = duration.as_secs();
    println!("hs----{}", startime);

    let string = string.to_lowercase();
    let app_handle = window.app_handle();

    starttimer(&windowname2, &app_handle);
    opendialogwindow(
        &window.app_handle(),
        "Search in progress",
        &format!("Searching for {} ", string),
        "",
    );
    set_enum_value(&state.whichthread, wThread::Searching);
    let stop_flag_local = Arc::new(AtomicBool::new(true));

    // Populate the hashset using par_iter and inspect
    let u: HashSet<String> = map
        .clone()
        .par_iter()
        .filter(|_| {
            let counter = Arc::clone(&counter);
            let local_counter = Arc::clone(&local_counter);
            let val = counter.load(Ordering::SeqCst);
            let localaval = local_counter.load(Ordering::SeqCst);
            if (val == localaval) {
                return true;
            }
            // local_counter.store(val+1, Ordering::SeqCst);
            // panic!("Stopping iteration");
            return false;
        })
        .filter(|(i, _)| {
            if (!exactmatch) {
                return fuzzy_match(&i, &string).unwrap_or(0) > 0;
            }
            i.contains(&string)
        })
        .flat_map(|(_, y)| {
            //   window.emit("reloadlist",json!({
            //     "message": "pariter2",
            //     "status": "running",
            // }));
            y.par_iter()
        })
        .cloned()
        .collect();
    println!("{}", u.len());

    // if(u.len()<2000)
    // {
    let mut v: Vec<String> = u
        .into_par_iter()
        .filter(|_| {
            let counter = Arc::clone(&counter);
            let local_counter = Arc::clone(&local_counter);
            let val = counter.load(Ordering::SeqCst);
            let localaval = local_counter.load(Ordering::SeqCst);
            if (val == localaval) {
                return true;
            }
            // // local_counter.store(val+1, Ordering::SeqCst);
            // panic!("Stopping iteration");
            return false;
        })
        .collect(); // Collect into a vector
    v.par_sort_by_key(|ei| {
        // Sort by key
        let path = Path::new(&ei); // Get the path
        let fname = path.file_name().unwrap().to_string_lossy().to_string(); // Get the file name
        let score = fuzzy_match(&fname, &string).unwrap(); // Get the score
                                                           // println!("{}---{}", fname, score); // Print the file name and score
        score // Return the score as the key
    });
    v.reverse();
    let sts = &state.starttime;
    state.starttime.store(starttime, Ordering::SeqCst);
    // v.split_off(100);
    // for (c,ei) in
    // let (tx,rx)=mpsc::channel::<String>();
    let fsc = Arc::new(Mutex::new(HashMap::new()));
    v.par_iter().enumerate().panic_fuse().for_each(|(c, ei)| {
        if (sts.load(Ordering::SeqCst) != starttime) {
            println!("closing search started @ {} ", starttime);
            *doneornot_clone.lock().unwrap() = true;
            sendfilesetcollection(
                &wname,
                &app_handle,
                &serde_json::to_string(&fsc.lock().unwrap().clone()).unwrap(),
            );

            opendialogwindow(
                &app_handle,
                "Search halted",
                &format!("Halted search for {}", string),
                "",
            );
            stoptimer(&wname, &window.app_handle());

            let now = SystemTime::now();
            let duration = now.duration_since(UNIX_EPOCH).unwrap();
            let endtime = duration.as_secs();
            println!("endtime----{}", endtime - startime);
            panic!("")
        }
        // thread::sleep(Duration::from_millis(3000));
        //   window.emit("reloadlist",json!({
        //     "message": "pariter3",
        //     "status": "running",
        // }));
        let fsc_clone = Arc::clone(&fsc);
        let path = Path::new(&ei);
        let fname = path.file_name().unwrap().to_string_lossy().to_string();
        let file = populatefileitem(fname, path, &state, fsc_clone);
        let mut files = files.lock().unwrap();
        *tfsize_clone.lock().unwrap() += file.rawfs;
        files.push(file.clone());
        fileslist(
            &windowname2.clone(),
            &window.app_handle(),
            &serde_json::to_string(&json!({
              "caller":starttime,
              "files":&serde_json::to_string(&file.clone()).unwrap(),
            }))
            .unwrap(),
        )
        .unwrap();
    });
    //  loop{
    //   match rx.try_recv() {
    //       Ok(status) => {
    //           println!("{}",status);
    //       }
    //       Err(TryRecvError::Disconnected) => {
    //           println!("finished");
    //           break;
    //       }
    //       Err(TryRecvError::Empty) => {}
    //   }
    //  }
    // }
    *doneornot_clone.lock().unwrap() = true;
    sendfilesetcollection(
        &wname,
        &app_handle,
        &serde_json::to_string(&fsc.lock().unwrap().clone()).unwrap(),
    );

    stoptimer(&wname, &window.app_handle());

    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}", endtime - startime);

    // }
    //  });
    Ok(())
    // strings

    // println!("{:?}",options);
    // options
}

#[test]
fn ptest() {
    let mut last_print = Instant::now();
    println!("started @ {:?}", last_print);
    (0..1_000_000).into_par_iter().panic_fuse().for_each(|i| {
        // simulate some work
        // thread::sleep(Duration::from_secs(1));
        if (i < 1) {
            // oops! This will cause a panic
            println!("ended @ {:?}", last_print.elapsed());
            panic!("")
        }
    });
    println!("ended @ {:?}", last_print.elapsed());
}
