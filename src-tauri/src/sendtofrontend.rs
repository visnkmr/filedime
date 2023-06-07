use std::collections::HashSet;

use tauri::{AppHandle, Manager};

use crate::FileItem;


pub fn sendbuttonnames(ah:&AppHandle,buttonnames:String)->Result<(),String>{
    ah.emit_to(
        "main",
        "button-names",
        buttonnames,
      )
      .map_err(|e| e.to_string()).unwrap();
    Ok(())
}
pub fn sendparentloc(windowname:&str,ah:&AppHandle,parent:String)->Result<(),String>{
    ah.emit_to(
        windowname,
        "parent-loc",
        parent,
      )
      .map_err(|e| e.to_string()).unwrap();
    Ok(())
}

pub fn notifychange(windowname:&str,ah:&AppHandle){
  ah.emit_to(
    windowname,
    "send-log",
    "changed",
  )
  .map_err(|e| e.to_string()).unwrap();

}
pub fn sendgparentloc(windowname:&str,ah:&AppHandle,gparent:String)->Result<(),String>{
    ah.emit_to(
        windowname,
        "grandparent-loc",
        gparent,
      )
      .map_err(|e| e.to_string())?;
    Ok(())
}
pub fn starttimer(windowname:&str,ah:&AppHandle)->Result<(),String>{
  ah.emit_to(
    windowname,
    "start-timer",
    "",
  )
  .map_err(|e| e.to_string())?; 
    Ok(())
}

pub fn stoptimer(windowname:&str,ah:&AppHandle)->Result<(),String>{
  ah.emit_to(
    windowname,
    "stop-timer",
    "",
  )
  .map_err(|e| e.to_string())?; 
ah.emit_to(
    windowname,
    "load-complete",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
    Ok(())
}

pub fn loadhistory(windowname:&str,ah:&AppHandle,string:String)->Result<(),String>{
    ah.emit_to(
        windowname,
        "load-hist",
        string,
      )
      .map_err(|e| e.to_string())?; 
    Ok(())
}

pub fn loadmarks(windowname:&str,ah:&AppHandle,string:String){
  ah.emit_to(
    windowname,
    "load-marks",
    string,
  )
  .map_err(|e| e.to_string()).unwrap();
}

pub fn folsize(windowname:&str,ah:&AppHandle,string:String)->Result<(),String>{
    ah.emit_to(
        windowname,
        "folder-size",
        string,
      )
      .map_err(|e| e.to_string())?; 
    Ok(())
}

pub fn sendfilesetcollection(windowname:&str,ah:&AppHandle,string:&String)->Result<(),String>{
    ah.emit_to(
        windowname,
        "fsc",
        string,
      )
      .map_err(|e| e.to_string())?; 
    Ok(())
}

pub fn folcount(windowname:&str,ah:&AppHandle,fcount:usize)->Result<(),String>{
    ah.emit_to(
        windowname,
        "folder-count",
        fcount,
      )
      .map_err(|e| e.to_string())?;
        Ok(())
}

pub fn fileslist(windowname:&str,ah:&AppHandle,fl:&String)->Result<(),String>{
    ah.emit_to(
        windowname,
        "list-files",
        fl,
      )
      .map_err(|e| e.to_string())?;
      progress(windowname,ah);
        Ok(())
}


pub fn slist(windowname:&str,ah:&AppHandle,wtr:&HashSet<FileItem>,string:String){
  ah.emit_to(
    windowname,
    "load-sresults",
    serde_json::to_string(&wtr).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  ah.emit_to(
    windowname,
    "sterm",
    string.clone(),
  )
  .map_err(|e| e.to_string()).unwrap();
  loadcomplete(windowname, ah);
}

pub fn loadcomplete(windowname:&str,ah:&AppHandle){
  ah.emit_to(
    windowname,
    "load-complete",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
}

pub fn progress(windowname:&str,ah:&AppHandle){
ah.emit_to(
    windowname,
    "progress",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
}

pub fn rflist(windowname:&str,ah:&AppHandle,wtr:&HashSet<FileItem>){
  ah.emit_to(
    windowname,
    "load-sresults",
    serde_json::to_string(&wtr).unwrap(),
  )
  .map_err(|e| e.to_string()).unwrap();
  ah.emit_to(
    windowname,
    "sterm",
    "Recents",
  )
  .map_err(|e| e.to_string()).unwrap();
loadcomplete(windowname, ah);
ah.emit_to(
    windowname,
    "sortbydate",
    "",
  )
  .map_err(|e| e.to_string()).unwrap();
}
