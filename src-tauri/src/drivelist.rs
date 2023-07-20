use std::process::Command;
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
            #[cfg(windows)]
            {

                let mut caption = mount_point.clone();
                caption.pop();
                if total < free && cfg!(target_os = "windows") {
                    let wmic_process = Command::new("cmd")
                        .args([
                            "/C",
                            &format!("wmic logical disk where Caption='{caption}' get Size"),
                        ])
                        .output()
                        .expect("failed to execute process");
                    let wmic_process_output = String::from_utf8(wmic_process.stdout).unwrap();
                    let parsed_size =
                        wmic_process_output.split("\r\r\n").collect::<Vec<&str>>()[1].to_string();
    
                    if let Ok(n) = parsed_size.trim().parse::<u64>() {
                        total = n.to_string();
                    }
                }
            }

            DriveInformation {
                name,
                mount_point,
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