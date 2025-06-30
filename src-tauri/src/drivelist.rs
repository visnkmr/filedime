// use chrono::format::format;
// use regex::Regex;
// use serde::{de, Deserialize, Deserializer, Serialize};
// use serde_json::Value;
// use std::{
//     path::{Path, PathBuf},
//     process::Command,
// };
// use sysinfo::{DiskExt, RefreshKind, System, SystemExt};


use crate::sizeunit;
use serde::{Deserialize, Serialize};
use std::process::Command;

// This DriveItem struct remains the same, as it's our target data structure.
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
// This tells the compiler to look for the `linux` module's contents
// ONLY when compiling for Linux.
#[cfg(target_os = "linux")]
use self::linux as platform;

// This tells the compiler to look for the `macos` module's contents
// ONLY when compiling for macOS.
#[cfg(target_os = "macos")]
use self::macos as platform;

#[cfg(target_os = "windows")]
use self::windows as platform;

//====================================================================================//
//                           Public API Functions (Dispatchers)                       //
//====================================================================================//

/// This is the main public function. It calls the correct platform-specific implementation.
pub fn populatedrivelist() -> Option<Vec<DriveItem>> {
    // On Linux, this will call `platform::get_drives()`, which maps to `linux::get_drives_linux()`.
    // On macOS, this will call `platform::get_drives()`, which maps to `macos::get_drives_macos()`.
    platform::get_drives()
}
#[test]
fn newdriveslist() {
    println!("{:?}", platform::get_drives());
}
/// Mounts a drive using the platform-specific method.
pub fn mountdrive(uuid: String, mount_point_or_path: String) -> bool {
    platform::mountdrive(uuid, mount_point_or_path)
}

/// Unmounts a drive using the platform-specific method.
pub fn unmountdrive(uuid: String, mount_point_or_path: String) -> bool {
    platform::unmountdrive(uuid, mount_point_or_path)
}


//====================================================================================//
//                                  macOS Implementation                              //
//====================================================================================//
#[cfg(target_os = "macos")]
mod macos {
    use super::{DriveItem, sizeunit};
    use serde::Deserialize;
    use std::process::Command;
    use sysinfo::{System, SystemExt, DiskExt, RefreshKind};


    // Structs for deserializing `diskutil list -plist` output
    #[derive(Deserialize, Debug)]
    #[serde(rename_all = "PascalCase")]
    struct DiskutilPlist {
        all_disks_and_partitions: Vec<DiskInfo>,
    }

    #[derive(Deserialize, Debug, Clone)]
    #[serde(rename_all = "PascalCase")]
    struct DiskInfo {
        device_identifier: String,
        mount_point: Option<String>,
        volume_name: Option<String>,
        size: u64,
        content: String,
        #[serde(default)]
        volume_uuid: Option<String>,
        #[serde(default)]
        removable: bool,
        #[serde(default)]
        solid_state: bool,
        #[serde(default, rename = "APFSPhysicalStores")]
        physical_stores: Vec<ApfsPhysicalStore>,
    }

    #[derive(Deserialize, Debug, Clone)]
    #[serde(rename_all = "PascalCase")]
    struct ApfsPhysicalStore {
        device_identifier: String,
    }


    pub fn get_drives() -> Option<Vec<DriveItem>> {
        let output = match Command::new("diskutil").args(["list", "-plist"]).output() {
            Ok(output) if output.status.success() => output.stdout,
            _ => return None, // diskutil command failed
        };

        let plist_data: DiskutilPlist = match plist::from_bytes(&output) {
            Ok(data) => data,
            Err(_) => return None, // Failed to parse plist
        };

        // sysinfo is still useful for getting available space accurately
        let mut sys = System::new_with_specifics(RefreshKind::new().with_disks_list());

        let mut drive_items = Vec::new();

        for disk in plist_data.all_disks_and_partitions {
             // We only care about partitions that can be mounted and have a volume name.
            if disk.mount_point.is_some() && disk.volume_name.is_some() {

                let mount_str = disk.mount_point.as_deref().unwrap_or("");

                // Find the corresponding disk in sysinfo to get free space
                let free_space = sys.disks().iter()
                    .find(|d| d.mount_point().to_str() == Some(mount_str))
                    .map_or(0, |d| d.available_space());

                let disk_type = if disk.solid_state { "SSD".to_string() } else { "HDD".to_string() };

                drive_items.push(DriveItem {
                    name: disk.volume_name.clone().unwrap_or_default(),
                    mount_point: mount_str.to_string(),
                    total: sizeunit::size(disk.size, true),
                    free: sizeunit::size(free_space, true),
                    is_removable: disk.removable,
                    disk_type,
                    file_system: disk.content.clone(),
                    uuid: disk.volume_uuid.clone().unwrap_or_default(),
                    // diskutil list does not provide vendor/model per partition.
                    // This would require a different command like `system_profiler SPStorageDataType`.
                    // For simplicity, we leave it blank here.
                    vendormodel: "".to_string(),
                });
            }
        }
        Some(drive_items)
    }

    pub fn mountdrive(uuid: String,device_path: String) -> bool {
        Command::new("diskutil")
            .arg("mount")
            .arg(&device_path)
            .status()
            .map_or(false, |s| s.success())
    }

    pub fn unmountdrive(uuid: String,device_or_mount_point: String) -> bool {
        Command::new("diskutil")
            .arg("unmount")
            .arg(&device_or_mount_point)
            .status()
            .map_or(false, |s| s.success())
    }
}


//====================================================================================//
//                                  Linux Implementation                              //
//====================================================================================//
// We wrap your entire existing Linux implementation in a module.
#[cfg(target_os = "linux")]
mod linux {
    // Paste your ENTIRE original code block here, from the first `use` to the last `}`.
    // I will only include the function signatures for brevity, but you should paste the whole implementation.
    use super::{DriveItem, sizeunit};
    use serde::{de, Deserialize, Deserializer, Serialize};
    use serde_json::Value;
    use std::{
        path::{Path, PathBuf},
        process::Command,
    };
    use sysinfo::{DiskExt, RefreshKind, System, SystemExt};
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
                        free: sizeunit::size(
                            ed.clone()
                                .fsavail
                                .unwrap_or("0".to_string())
                                .clone()
                                .parse::<u64>()
                                .unwrap_or(0),
                            true,
                        ),
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
    
    // use crate::sizeunit;
    
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
    #[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
    pub struct LsBlkDevice {
        pub name: Option<String>,
        pub fstype: Option<String>,
        pub fsver: Option<String>,
        pub label: Option<String>,
        pub uuid: Option<String>,
        #[serde(deserialize_with = "deserialize_fsavail")]
        pub fsavail: Option<String>,
        #[serde(deserialize_with = "deserialize_fsavail")]
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
    

    // --- PASTE ALL YOUR STRUCTS AND FUNCTIONS HERE ---
    // e.g., DriveInformation, Drives, LsBlkDeviceWithChildren, LsBlkOutput, LsBlkDevice,
    // deserialize_fsavail, get_lsblk_output, get_command_output, parse, flattened,
    // get_lsblk_devices, get_disks.

    // I am omitting the full body of your original code for clarity.
    // The public function that `populatedrivelist` will call:
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
    
        let output = String::from_utf8(g.clone()?).unwrap();
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
                // print!("{}",format!(
                //     "{:?} {:?}",
                //     device.details.vendor.clone(),
                //     device.details.model.clone())
                // )
            }
        }
        // println!("output------{:?}",output);
        output
    }
    pub fn get_drives() -> Option<Vec<DriveItem>> {
        // This is a simplified version of your original `populatedrivelist` logic
        if let Ok((disks, _uddisks)) = get_disks() {
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
            let drive_items = disks.iter().map(|ed| DriveItem {
                 name: {
                    if ed.label.is_some() {
                        ed.label.clone().unwrap()
                    } else if ed.mountpoint.is_some() {
                        if standard_locations.contains(&ed.mountpoint.clone().unwrap().as_str()) {
                            ed.mountpoint.clone().unwrap()
                        } else {
                            format!("{} Volume", sizeunit::size(ed.size, true).to_string())
                        }
                    } else {
                        format!("{} Volume", sizeunit::size(ed.size, true).to_string())
                    }
                },
                mount_point: ed.mountpoint.clone().unwrap_or_default(),
                total: sizeunit::size(ed.size, true),
                free: sizeunit::size(ed.fsavail.clone().unwrap_or_else(|| "0".to_string()).parse::<u64>().unwrap_or(0), true),
                is_removable: ed.is_removable,
                disk_type: ed.device_type.clone(),
                file_system: format!("{} {}", ed.fstype.clone().unwrap_or_default(), ed.fsver.clone().unwrap_or_default()),
                uuid: ed.uuid.clone().unwrap_or_default(), // Use uuid from lsblk
                vendormodel: format!("{} {}", ed.vendor.clone().unwrap_or_default(), ed.model.clone().unwrap_or_default()),
            }).collect();
            Some(drive_items)
        } else {
            // Your original code had a fallback to another get_drives() function.
            // You can add that logic here if desired.
            None
        }
    }
    fn parse(input: &String) -> Result<LsBlkOutput, ()> {
        // match(serde_json::from_slice(input)){
        //     Ok(a)=> return a,
        //     Err(e)=>return Err(())
    
        // }
        let mut count = 0;
        // for input in input.lines(){
        //     count+=1;
        //     println!("{}---{}",count,input)
        // }
        Ok(serde_json::from_str(input).unwrap())
    }
    /// Struct for deserializing the JSON output of `lsblk`.
    ///
    ///
    ///
    fn deserialize_fsavail<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = Value::deserialize(deserializer)?;
        match value {
            Value::String(s) => Ok(Some(s)),
            Value::Number(n) => {
                if n.is_u64() {
                    Ok(Some(n.as_u64().unwrap().to_string()))
                } else {
                    Err(serde::de::Error::custom(
                        "fsavail must be a string or a u64",
                    ))
                }
            }
            _ => Ok(None),
        }
    }
    
    // NOTE: Make sure the get_disks() and all its helper functions from your original
    // code are included inside this `linux` module.
    // ... (rest of your original code) ...
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
    

    pub fn mountdrive(uuid: String, mount_point: String) -> bool {
        Command::new("udisksctl")
            .arg("mount")
            .arg("--block-device")
            .arg(&mount_point) // lsblk `name` field is the block device path
            .status()
            .map_or(false, |s| s.success())
    }

    pub fn unmountdrive(uuid: String, mount_point: String) -> bool {
        Command::new("udisksctl")
            .arg("unmount")
            .arg("--block-device")
            .arg(&mount_point)
            .status()
            .map_or(false, |s| s.success())
    }
}

//====================================================================================//
//                                  Windows Implementation                              //
//====================================================================================//
// We wrap your entire existing Linux implementation in a module.
#[cfg(target_os = "windows")]
mod windows {
    // Paste your ENTIRE original code block here, from the first `use` to the last `}`.
    // I will only include the function signatures for brevity, but you should paste the whole implementation.
    use super::{DriveItem, sizeunit};
    use serde::{de, Deserialize, Deserializer, Serialize};
    use serde_json::Value;
    use std::{
        path::{Path, PathBuf},
        process::Command,
    };
    use sysinfo::{DiskExt, RefreshKind, System, SystemExt};
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
                        free: sizeunit::size(
                            ed.clone()
                                .fsavail
                                .unwrap_or("0".to_string())
                                .clone()
                                .parse::<u64>()
                                .unwrap_or(0),
                            true,
                        ),
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
    
    // use crate::sizeunit;
    
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
    #[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
    pub struct LsBlkDevice {
        pub name: Option<String>,
        pub fstype: Option<String>,
        pub fsver: Option<String>,
        pub label: Option<String>,
        pub uuid: Option<String>,
        #[serde(deserialize_with = "deserialize_fsavail")]
        pub fsavail: Option<String>,
        #[serde(deserialize_with = "deserialize_fsavail")]
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
    

    // --- PASTE ALL YOUR STRUCTS AND FUNCTIONS HERE ---
    // e.g., DriveInformation, Drives, LsBlkDeviceWithChildren, LsBlkOutput, LsBlkDevice,
    // deserialize_fsavail, get_lsblk_output, get_command_output, parse, flattened,
    // get_lsblk_devices, get_disks.

    // I am omitting the full body of your original code for clarity.
    // The public function that `populatedrivelist` will call:
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
    
        let output = String::from_utf8(g.clone()?).unwrap();
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
                // print!("{}",format!(
                //     "{:?} {:?}",
                //     device.details.vendor.clone(),
                //     device.details.model.clone())
                // )
            }
        }
        // println!("output------{:?}",output);
        output
    }
    pub fn get_drives() -> Option<Vec<DriveItem>> {
        // This is a simplified version of your original `populatedrivelist` logic
        if let Ok((disks, _uddisks)) = get_disks() {
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
            let drive_items = disks.iter().map(|ed| DriveItem {
                 name: {
                    if ed.label.is_some() {
                        ed.label.clone().unwrap()
                    } else if ed.mountpoint.is_some() {
                        if standard_locations.contains(&ed.mountpoint.clone().unwrap().as_str()) {
                            ed.mountpoint.clone().unwrap()
                        } else {
                            format!("{} Volume", sizeunit::size(ed.size, true).to_string())
                        }
                    } else {
                        format!("{} Volume", sizeunit::size(ed.size, true).to_string())
                    }
                },
                mount_point: ed.mountpoint.clone().unwrap_or_default(),
                total: sizeunit::size(ed.size, true),
                free: sizeunit::size(ed.fsavail.clone().unwrap_or_else(|| "0".to_string()).parse::<u64>().unwrap_or(0), true),
                is_removable: ed.is_removable,
                disk_type: ed.device_type.clone(),
                file_system: format!("{} {}", ed.fstype.clone().unwrap_or_default(), ed.fsver.clone().unwrap_or_default()),
                uuid: ed.uuid.clone().unwrap_or_default(), // Use uuid from lsblk
                vendormodel: format!("{} {}", ed.vendor.clone().unwrap_or_default(), ed.model.clone().unwrap_or_default()),
            }).collect();
            Some(drive_items)
        } else {
            // Your original code had a fallback to another get_drives() function.
            // You can add that logic here if desired.
            None
        }
    }
    fn parse(input: &String) -> Result<LsBlkOutput, ()> {
        // match(serde_json::from_slice(input)){
        //     Ok(a)=> return a,
        //     Err(e)=>return Err(())
    
        // }
        let mut count = 0;
        // for input in input.lines(){
        //     count+=1;
        //     println!("{}---{}",count,input)
        // }
        Ok(serde_json::from_str(input).unwrap())
    }
    /// Struct for deserializing the JSON output of `lsblk`.
    ///
    ///
    ///
    fn deserialize_fsavail<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = Value::deserialize(deserializer)?;
        match value {
            Value::String(s) => Ok(Some(s)),
            Value::Number(n) => {
                if n.is_u64() {
                    Ok(Some(n.as_u64().unwrap().to_string()))
                } else {
                    Err(serde::de::Error::custom(
                        "fsavail must be a string or a u64",
                    ))
                }
            }
            _ => Ok(None),
        }
    }
    
    // NOTE: Make sure the get_disks() and all its helper functions from your original
    // code are included inside this `linux` module.
    // ... (rest of your original code) ...
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
    

    pub fn mountdrive(uuid: String, mount_point: String) -> bool {
        Command::new("udisksctl")
            .arg("mount")
            .arg("--block-device")
            .arg(&mount_point) // lsblk `name` field is the block device path
            .status()
            .map_or(false, |s| s.success())
    }

    pub fn unmountdrive(uuid: String, mount_point: String) -> bool {
        Command::new("udisksctl")
            .arg("unmount")
            .arg("--block-device")
            .arg(&mount_point)
            .status()
            .map_or(false, |s| s.success())
    }
}