use std::process::Command;
use chrono::format::format;
use regex::Regex;
use sysinfo::{DiskExt, System, SystemExt, RefreshKind};

use crate::sizeunit;

#[derive(serde::Serialize, Debug)]
pub struct DriveInformation {
    pub name: String,
    pub mount_point: String,
    pub total: String,
    pub free: String,
    pub is_removable: bool,
    pub disk_type: String,
    pub file_system: String,
}

#[derive(serde::Serialize,Debug)]
pub struct Drives {
    pub array_of_drives: Vec<DriveInformation>,
}
#[test]
fn test_result(){
//   println!("{:?}",get_drives().unwrap().array_of_drives);

let dn:Vec<String>=get_drives().unwrap().array_of_drives.iter().map(|ed|{
    ed.mount_point.clone()
  }).collect();
  println!("{:?}",dn);
}
#[tauri::command]
pub fn get_drives() -> Result<Drives, String> {
    let mut sys= System::new();
    sys.refresh_disks_list();
    let array_of_drives =sys
        .disks()
        .iter()
        .map(|disk| {
            let mut total = sizeunit::size(disk.total_space(),true);
            let free = sizeunit::size(disk.available_space(),true);
            let mount_point = disk.mount_point().to_str().unwrap_or("/").to_string();
            let name = disk.name().to_str().unwrap_or("Disk").to_string();
            let is_removable = disk.is_removable();
           
            let file_system = String::from_utf8(disk.file_system().to_vec())
                .unwrap_or_else(|_| "Unknown File System".to_string());
            let disk_type = 
            match disk.kind() {
                sysinfo::DiskKind::SSD => "SSD".to_string(),
                sysinfo::DiskKind::HDD => "HDD".to_string(),
                _ => "Removable Disk".to_string(),
            };

            DriveInformation {
                name:if !cfg!(unix) {
                    name.clone()
                }
                else{
                    mount_point.clone()
                },
                mount_point:if !cfg!(unix) {
                    mount_point
                }
                else{
                    name
                },
                total,
                free,
                is_removable,
                disk_type,
                file_system,
            }
        })
        .collect();

    Ok(Drives { array_of_drives })
}
#[derive(Debug)]
struct ditem{
    name:Option<String>,
    fstype:Option<String>,
    label:Option<String>,
    uuid:Option<String>,
    mountpoint:Option<String>,

}
fn parse_drive_info(line: &str){
    let fields: Vec<&str> = line.split_whitespace().collect();
    println!("{:?}",ditem{
        name: fields.get(0).and_then(|s| if s.is_empty() { None } else { Some(s.to_string()) }),
        fstype: fields.get(1).and_then(|s| if s.is_empty() { None } else { Some(s.to_string()) }),
        label: fields.get(2).and_then(|s| if s.is_empty() { None } else { Some(s.to_string()) }),
        uuid: fields.get(3).and_then(|s| if s.is_empty() { None } else { Some(s.to_string()) }),
        mountpoint: fields.get(4).and_then(|s| if s.is_empty() { None } else { Some(s.to_string()) }),
    });
 }

#[test]
fn listallntfs() {
    let output = Command::new("lsblk")
        .arg("-f")
        .output()
        .expect("Failed to execute command");
 
    let output = String::from_utf8(output.stdout).unwrap();
    let lines: Vec<&str> = output.split('\n').collect();
    // let mut dlist:Vec<DriveInformation>=Vec::new();
    
    for line in lines {
        parse_drive_info(&line)
    //     if line.contains("ntfs") {
    //         let words: Vec<&str> = line.split_whitespace().collect();
    //         let re = Regex::new(r"\w+").unwrap();
    //         let result = re.find(words[0]).unwrap().as_str();
    //         // if(words.len()>3){
    //             // println!("/dev/{}-------{}", result, words[2]);
    //             dlist.push(DriveInformation{
    //                 name:words[2].to_string(),
    //                 mount_point: format!("/dev/{}", result),
    //                 total:String::new(),
    //                 free: String::new(),
    //                 is_removable: false,
    //                 disk_type: String::new(),
    //                 file_system: "NTFS".to_string(),
    //             });
    //         // }
    //         // else{

    //         // }
    //         // println!("{}", line);
    //     }
    }
    // println!("{:?}",dlist)
 }
 fn mountdrive(uuid:String,mount_point:String) {
    // Create the directory
    let mkdir_cmd = Command::new("mkdir")
        .arg(format!("/run/media/{}",uuid))
        .status()
        .expect("Failed to execute command");
 
    // Check if the directory creation was successful
    assert!(mkdir_cmd.success());
 
    // Mount the NTFS partition
    let mount_cmd = Command::new("mount")
        .arg("-t")
        .arg("ntfs-3g")
        .arg(format!("{}",mount_point))
        .arg(format!("/run/media/{}",uuid))
        .status()
        .expect("Failed to execute command");
 
    // Check if the mount operation was successful
    assert!(mount_cmd.success());
 }
 