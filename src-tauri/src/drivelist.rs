use std::{process::Command, path::{PathBuf, Path}};
use chrono::format::format;
use regex::Regex;
use serde::{Deserialize, Serialize, de};
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
//  #[test]
//  fn drllt(){
//     let dl  =rs_drivelist::drive_list().unwrap();
//     for ed in dl{
//         println!("{:?}",ed);

//         // println!("{:?}",ed.description);
//     }
//  }
fn get_lsblk_output() -> Result<Vec<u8>,()> {
    let mut command = Command::new("/bin/lsblk");
    command.args([
        // Print size in bytes
        "--bytes",
        // Select the fields to output
        "--output",
        "NAME,FSTYPE,FSVER,LABEL,UUID,FSAVAIL,FSUSED,MOUNTPOINT,HOTPLUG,SIZE,VENDOR,RM,STATE,TYPE,KNAME",
        // Format output as JSON
        "--json",
        // Print full device paths
        "--paths",
        // Exclude some devices by major number. See
        // https://www.kernel.org/doc/Documentation/admin-guide/devices.txt
        // for a list of major numbers.
        //
        // - Exclude floppy drives (2), as they are slow.
        // - Exclude scsi cdrom drives (11), as they are slow.
        // - Exclude zram (253), not a valid install target.
        "--exclude",
        "2,11,253",
    ]);
    
    // let output = String::from_utf8(get_command_output(command).unwrap()).unwrap();
    // Ok(output)
    get_command_output(command)
}
fn get_command_output(mut command: Command) -> Result<Vec<u8>,()> {
    // info!("running command: {:?}", command);
    let output = match command.output() {
        Ok(output) => output,
        Err(err) => {
            return Err(())
            // bail!("Failed to execute command: {err}");
        }
    };

    if !output.status.success() {
        // bail!("Failed to execute command");
    }
    Ok(output.stdout)
}
#[derive(Clone, Debug, Deserialize, PartialEq)]
struct LsBlkDeviceWithChildren {
    #[serde(flatten)]
    details: LsBlkDevice,


    /// Child devices.
    #[serde(default)]
    children: Vec<LsBlkDeviceWithChildren>,
}
#[derive(Debug, Deserialize, PartialEq)]
struct LsBlkOutput {
    #[serde(rename = "blockdevices")]
    block_devices: Vec<LsBlkDeviceWithChildren>,
}
fn parse(input: &[u8]) -> Result<LsBlkOutput,()> {
    Ok(serde_json::from_slice(input).unwrap())
}
/// Struct for deserializing the JSON output of `lsblk`.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq,Serialize)]
pub struct LsBlkDevice {
    pub name: Option<String>,
    pub fstype: Option<String>,
    pub fsver: Option<String>,
    pub label: Option<String>,
    pub uuid: Option<String>,
    pub fsavail: Option<u64>,
    pub fsused: Option<u64>,
    pub mountpoint:Option<String>,
    pub hotplug: bool,
    pub size: u64,
    pub vendor: Option<String>,
    pub model: Option<String>,
    #[serde(rename = "rm")]
    pub is_removable: bool,
    pub state: Option<String>,
    #[serde(rename = "type")]
    pub device_type: String,
    pub kname: Option<String>,
}
fn flattened(parsed:LsBlkOutput) -> Vec<LsBlkDevice> {
    let mut output = Vec::new();
    let mut stack = parsed.block_devices;
    while let Some(device) = stack.pop() {
        output.push(device.details);
        stack.extend(device.children);
    }
    output
}
 #[test]
 fn drllt(){
    // let output = get_lsblk_output().unwrap();
    // println!("{}",String::from_utf8(output.clone()).unwrap());
    // let parsed = parse(&output).unwrap();
    // println!("{:?}",flattened(parsed));
    // println!("{:?}",get_disks());
    let dv=get_disks().unwrap().0;
    // println!("{:?}",serde_json::to_value(dv.clone()));
    // println!("{:?}",dv);
    for ed in dv{
        println!("{:?}",ed);
    }
    println!("-----------------------");
    println!("-----------------------");
    println!("-----------------------");
    println!("-----------------------");
    let dv=get_disks().unwrap().1;
    for ed in dv{
        println!("{:?}",ed);
    }
    // println!("{:?}",get_disks())
    // let output  =get_lsblk_output();
    // println!("{}",output.unwrap())
    // for ed in dl{
    //     println!("{:?}",ed);

    //     // println!("{:?}",ed.description);
    // }
 }
 pub fn get_lsblk_devices() -> Result<Vec<LsBlkDevice>,()> {
    let output = get_lsblk_output()?;
    let parsed =parse(&output)?;
    Ok(flattened(parsed))
}
 /// Get information about all disk devices.
 /// 
 struct diskinfo{
    name:String,
 }
pub fn get_disks() -> Result<(Vec<LsBlkDevice>,Vec<LsBlkDevice>),()> {
// fn get_disks() -> Result<Vec<PathBuf>,()> {
    let devices = get_lsblk_devices().expect("Unable to get block devices");

    let mut disks = Vec::new();
    let mut uddisks = Vec::new();
    for device in devices {
        if(device.uuid.is_some() && device.label.is_some()){
            disks.push(device.clone());
        }
        else if device.fsver.is_some(){
            disks.push(device.clone());
        }
        else{

            uddisks.push(device.clone());
        }
        // let ps=device.mountpoints.get(0).unwrap().clone().unwrap();
        // disks.push(ps);
        // disks.push(Path::new(&ps).into());
    }
    Ok((disks,uddisks))
}