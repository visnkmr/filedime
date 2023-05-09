use tauri::{AppHandle, Manager};


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
        Ok(())
}