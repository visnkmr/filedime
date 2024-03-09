use chrono::format::format;
use regex::Regex;
use serde::{de, Deserialize, Serialize};
use std::{
    path::{Path, PathBuf},
    process::Command,
};
use sysinfo::{DiskExt, RefreshKind, System, SystemExt};

#[derive(Serialize, Clone, Debug, PartialEq, Hash, Eq)]
pub struct DriveItem {
    pub name: String,
    pub mount_point: String,
    pub total: String,
    pub free: String,
    pub is_removable: bool,
    pub disk_type: String,
    pub file_system: String,
    pub uuid: String,
    pub vendormodel: String,
}
pub fn populatedrivelist() -> Option<Vec<DriveItem>> {
    let mut rt;
    let standard_locations = vec![
        "/",      // Root directory
        "/bin",   // User commands
        "/boot",  // Static files of the boot loader
        "/dev",   // Device files
        "/etc",   // Host-specific system configuration
        "/home",  // User home directories
        "/lib",   // Shared libraries
        "/lib64", //  64-bit shared libraries
        "/mnt",   // Mount point for temporary filesystems
        "/opt",   // Add-on application software packages
        "/proc",  // Process information
        "/root",  // Home directory of the root user
        "/sbin",  // System binaries
        "/srv",   // Site-specific data served by the system
        "/sys",   // Kernel and system information
        "/tmp",   // Temporary files
        "/usr",   // Secondary hierarchy for read-only user data
        "/var",   // Variable data
    ];
    if (get_disks().is_ok()) {
        rt = get_disks()
            .unwrap()
            .0
            .iter()
            .map(|ed| {
                return DriveItem {
                    name: {
                        if (ed.label.is_some()) {
                            ed.label.clone().unwrap()
                        } else if (ed.mountpoint.is_some()) {
                            if (standard_locations
                                .contains(&ed.mountpoint.clone().unwrap().as_str()))
                            {
                                ed.mountpoint.clone().unwrap()
                            } else {
                                format!("{} Volume", sizeunit::size(ed.size, true).to_string())
                            }
                        } else {
                            format!("{} Volume", sizeunit::size(ed.size, true).to_string())
                        }
                    },
                    mount_point: ed.mountpoint.clone().unwrap_or("".to_string()).clone(),
                    total: sizeunit::size(ed.size, true),
                    free: sizeunit::size(ed.clone().fsavail.unwrap_or("0".to_string()).clone().parse::<u64>().unwrap_or(0), true),
                    is_removable: ed.is_removable.clone(),
                    disk_type: ed.device_type.clone(),
                    file_system: format!(
                        "{} {}",
                        ed.fstype.clone().unwrap_or("".to_string()).clone(),
                        ed.fsver.clone().unwrap_or("".to_string()).clone()
                    ),
                    uuid: ed.name.clone().unwrap_or("".to_string()),
                    vendormodel: format!(
                        "{} {}",
                        ed.vendor.clone().unwrap_or("".to_string()),
                        ed.model.clone().unwrap_or("".to_string())
                    ),
                };
            })
            .collect::<Vec<DriveItem>>();
    } else {
        println!("no disks found using lsblk method");

        rt = get_drives()
            .unwrap()
            .array_of_drives
            .iter()
            .map(|ed| {
                return DriveItem {
                    name: ed.name.clone(),
                    mount_point: ed.mount_point.clone(),
                    total: ed.total.clone(),
                    free: ed.free.clone(),
                    is_removable: ed.is_removable.clone(),
                    disk_type: ed.disk_type.clone(),
                    file_system: ed.file_system.clone(),
                    uuid: "".to_string(),
                    vendormodel: ("".to_string()),
                };
            })
            .collect::<Vec<DriveItem>>();
    }

    Some(rt)
}

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

#[derive(serde::Serialize, Debug)]
pub struct Drives {
    pub array_of_drives: Vec<DriveInformation>,
}

// #[tauri::command]

fn get_lsblk_output() -> Result<String, ()> {
    //lsblk  --bytes --output NAME,FSTYPE,FSVER,LABEL,UUID,FSAVAIL,FSUSED,MOUNTPOINT,HOTPLUG,SIZE,VENDOR,MODEL,RM,STATE,TYPE,KNAME --json --paths
    let mut command = Command::new("lsblk");
    command.args([
        // Print size in bytes
        "--bytes",
        // Select the fields to output
        "--output",
        "NAME,FSTYPE,FSVER,LABEL,UUID,FSAVAIL,FSUSED,MOUNTPOINT,HOTPLUG,SIZE,VENDOR,MODEL,RM,STATE,TYPE,KNAME",
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
    let g = get_command_output(command);

    let output = String::from_utf8(g.clone().unwrap()).unwrap();
    // println!("{}",output);
    Ok(output)
    // g
}
fn get_command_output(mut command: Command) -> Result<Vec<u8>, ()> {
    // info!("running command: {:?}", command);
    let output = match command.output() {
        Ok(output) => output,
        Err(err) => {
            return Err(());
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
#[derive(Debug, Deserialize, PartialEq, Clone)]
struct LsBlkOutput {
    #[serde(rename = "blockdevices")]
    block_devices: Vec<LsBlkDeviceWithChildren>,
}
fn parse(input: &String) -> Result<LsBlkOutput, ()> {
    // match(serde_json::from_slice(input)){
    //     Ok(a)=> return a,
    //     Err(e)=>return Err(())

    // }
    let mut count=0;
    // for input in input.lines(){
    //     count+=1;
    //     println!("{}---{}",count,input)
    // }
    Ok(serde_json::from_str(input).unwrap())
}
/// Struct for deserializing the JSON output of `lsblk`.
/// 
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct LsBlkDevice {
    pub name: Option<String>,
    pub fstype: Option<String>,
    pub fsver: Option<String>,
    pub label: Option<String>,
    pub uuid: Option<String>,
    pub fsavail: Option<String>,
    pub fsused: Option<String>,
    pub mountpoint: Option<String>,
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
fn flattened(parsed: LsBlkOutput) -> Vec<LsBlkDevice> {
    let mut output = Vec::new();
    let mut stack = parsed.block_devices;
    while let Some(device) = stack.pop() {
        // output.push(device.details);
        // stack.extend(device.children);
        output.push(device.details.clone());
        for mut child in device.children.clone() {
            child.details.vendor = device.details.vendor.clone();
            child.details.model = device.details.model.clone();
            stack.push(child);
            print!("{}",format!(
                "{:?} {:?}",
                device.details.vendor.clone(),
                device.details.model.clone())
            )
        }
    }
    // println!("output------{:?}",output);
    output
}

pub fn get_lsblk_devices() -> Result<Vec<LsBlkDevice>, ()> {
    let output = get_lsblk_output()?;
    // println!("{:?}", output.clone());
    let parsed = parse(&output)?;
    // println!("{:?}", parsed.clone());
    Ok(flattened(parsed))
}
pub fn get_disks() -> Result<(Vec<LsBlkDevice>, Vec<LsBlkDevice>), ()> {
    // fn get_disks() -> Result<Vec<PathBuf>,()> {
    if (get_lsblk_devices().is_err()) {
        return Err(());
    }
    let devices = get_lsblk_devices().expect("Unable to get block devices");
    let mut disks = Vec::new();
    let mut uddisks = Vec::new();
    for device in devices {
        if (device.uuid.is_some() && device.label.is_some()) {
            disks.push(device.clone());
        } else if device.fstype.is_some() {
            disks.push(device.clone());
        } else {
            uddisks.push(device.clone());
        }
    }
    Ok((disks, uddisks))
}

#[test]
fn newdriveslist(){
    println!("{:?}",get_disks());
}

pub fn get_drives() -> Result<Drives, String> {
    let mut sys = System::new();
    sys.refresh_disks_list();
    let array_of_drives = sys
        .disks()
        .iter()
        .map(|disk| {
            let mut total = sizeunit::size(disk.total_space(), true);
            let free = sizeunit::size(disk.available_space(), true);
            let mount_point = disk.mount_point().to_str().unwrap_or("/").to_string();
            let name = disk.name().to_str().unwrap_or("Disk").to_string();
            let is_removable = disk.is_removable();

            let file_system = String::from_utf8(disk.file_system().to_vec())
                .unwrap_or_else(|_| "Unknown File System".to_string());
            let disk_type = match disk.kind() {
                sysinfo::DiskKind::SSD => "SSD".to_string(),
                sysinfo::DiskKind::HDD => "HDD".to_string(),
                _ => "Removable Disk".to_string(),
            };

            DriveInformation {
                name: if !cfg!(unix) {
                    name.clone()
                } else {
                    mount_point.clone()
                },
                mount_point: if !cfg!(unix) { mount_point } else { name },
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

pub fn mountdrive(uuid: String, mount_point: String) -> bool {
    let mount_cmd = Command::new("udisksctl")
        .arg("mount")
        .arg("--block-device")
        .arg(&mount_point)
        .status()
        .expect(&format!("failed to run udisksctl"));
    (mount_cmd.success())
}
pub fn unmountdrive(uuid: String, mount_point: String) -> bool {
    let mount_cmd = Command::new("udisksctl")
        .arg("unmount")
        .arg("--block-device")
        .arg(&mount_point)
        .status()
        .expect(&format!("failed to run udisksctl"));
    (mount_cmd.success())
}
#[test]
fn test_result() {
    //   println!("{:?}",get_drives().unwrap().array_of_drives);

    let dn: Vec<String> = get_drives()
        .unwrap()
        .array_of_drives
        .iter()
        .map(|ed| format!("{:?}", ed))
        .collect();
    println!("{:?}", dn);
}
