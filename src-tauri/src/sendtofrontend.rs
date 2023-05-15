use std::collections::HashSet;

use tauri::{AppHandle, Manager};

use crate::FileItem;


pub fn sendparentloc(ah:&AppHandle,parent:String)->Result<(),String>{
    ah.emit_to(
        "main",
        "parent-loc",
        parent,
      )
      .map_err(|e| e.to_string()).unwrap();
    Ok(())
}
pub fn sendgparentloc(ah:&AppHandle,gparent:String)->Result<(),String>{
    ah.emit_to(
        "main",
        "grandparent-loc",
        gparent,
      )
      .map_err(|e| e.to_string())?;
    Ok(())
}
pub fn starttimer(ah:&AppHandle)->Result<(),String>{
  ah.emit_to(
    "main",
    "start-timer",
    "",
  )
  .map_err(|e| e.to_string())?; 
    Ok(())
}

pub fn stoptimer(ah:&AppHandle)->Result<(),String>{
  ah.emit_to(
    "main",
    "stop-timer",
    "",
  )
  .map_err(|e| e.to_string())?; 
ah.emit_to(
    "main",
    "load-complete",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
    Ok(())
}

pub fn loadhistory(ah:&AppHandle,string:String)->Result<(),String>{
    ah.emit_to(
        "main",
        "load-hist",
        string,
      )
      .map_err(|e| e.to_string())?; 
    Ok(())
}

pub fn folsize(ah:&AppHandle,string:String)->Result<(),String>{
    ah.emit_to(
        "main",
        "folder-size",
        string,
      )
      .map_err(|e| e.to_string())?; 
    Ok(())
}

pub fn folcount(ah:&AppHandle,fcount:usize)->Result<(),String>{
    ah.emit_to(
        "main",
        "folder-count",
        fcount,
      )
      .map_err(|e| e.to_string())?;
        Ok(())
}

pub fn fileslist(ah:&AppHandle,fl:&String)->Result<(),String>{
    ah.emit_to(
        "main",
        "list-files",
        fl,
      )
      .map_err(|e| e.to_string())?;
      progress(ah);
        Ok(())
}


pub fn slist(ah:&AppHandle,wtr:&HashSet<FileItem>,string:String){
  ah.emit_to(
    "main",
    "load-sresults",
    serde_json::to_string(&wtr).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  ah.emit_to(
    "main",
    "sterm",
    string.clone(),
  )
  .map_err(|e| e.to_string()).unwrap();
ah.emit_to(
    "main",
    "load-complete",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
}

pub fn progress(ah:&AppHandle){
ah.emit_to(
    "main",
    "progress",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
}

pub fn rflist(ah:&AppHandle,wtr:&HashSet<FileItem>){
  ah.emit_to(
    "main",
    "load-sresults",
    serde_json::to_string(&wtr).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  ah.emit_to(
    "main",
    "sterm",
    "Recents",
  )
  .map_err(|e| e.to_string()).unwrap();
ah.emit_to(
    "main",
    "load-complete",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
ah.emit_to(
    "main",
    "sortbydate",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
}
