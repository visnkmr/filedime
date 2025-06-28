use serde::{Serialize, Deserialize};
use std::collections::{HashMap, HashSet};
use std::process::Command;
use serde_json::{self, Number};
use std::path::{Path, PathBuf};
use std::env;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Hash, Clone)]
pub struct App {
    name: String,
    command: String,
    icon: String,
    fromwhere: String,
}

#[test]
fn testmod(){
    for app in get_installed_apps().unwrap(){
        if app.fromwhere.to_lowercase().contains("hklm") 
        {
            println!("{:?}", app);
            // println!("{}", app.fromwhere);
        }
    }
    println!("{:?}", get_installed_apps().unwrap().len());
}
fn collect_unique(items: Vec<App>) -> Vec<App> {
    // We use a HashMap where the key is the name and the value is the MyStruct itself.
    // This allows us to easily retrieve and update the stored item.
    let mut unique_items_map: HashMap<String, App> = HashMap::new();

    for item in items {
        // The `entry()` API is efficient for checking existence and inserting/modifying.
        // `item.name.clone()` is needed because `entry()` takes an owned key,
        // but `item.name` might still be needed within `item` itself if it's inserted.
        let mut final_exepath = PathBuf::new(); // Initialize with an empty path as a default

    let current_path = Path::new(&item.command); // Borrow the command string as a Path slice

    if let Some(ext) = current_path.extension().and_then(|s| s.to_str()) {
        if ["exe", "com", "bat"].contains(&ext) {
            // If it's already an executable, clone it to own the path data.
            final_exepath = current_path.to_path_buf();
        } else {
            // If it's not an executable by extension, check if it's a directory
            if current_path.is_dir() {
                // We need a flag to know if we found an executable in the directory.
                // If not, final_exepath remains empty (or whatever default you set).
                let mut found_in_dir = false;

                // Use `current_path` (the borrowed Path) for WalkDir, it's fine.
                for temp_entry in WalkDir::new(current_path)
                    .max_depth(1)
                    .into_iter()
                    .filter_map(|e| e.ok())
                {
                    if temp_entry.file_type().is_file() {
                        if let Some(ext) = temp_entry.path().extension().and_then(|s| s.to_str()) {
                            if ["exe", "com", "bat"].contains(&ext) {
                                // Get the path as a string and convert to lowercase for checks
                                let filepath = temp_entry.path().to_string_lossy().to_string().to_lowercase();

                                // Check for "uninstall" or "unins" and non-empty path
                                if !(filepath.contains("uninstall") || filepath.contains("unins") || filepath.is_empty()) {
                                    // THIS IS THE FIX: Convert the borrowed Path from DirEntry
                                    // into an owned PathBuf and assign it.
                                    final_exepath = temp_entry.path().to_path_buf();
                                    found_in_dir = true;
                                    break; // Found the first suitable exe, no need to search further
                                }
                            }
                        }
                    }
                }
                // If the loop finished and nothing was found, final_exepath remains the default empty path.
            } else {
                // If it's not a directory and not an executable by extension,
                // final_exepath remains the default empty path.
            }
        }
    }
    // If current_path doesn't have an extension, final_exepath remains the default empty path.

    let path=final_exepath; // Return the determined PathBuf
        
        if(!item.command.trim().is_empty() && path.parent().is_some() && !item.command.to_lowercase().contains("package cache")){
            // println!("{:?}",path);
            match unique_items_map.entry(path.parent().unwrap().to_string_lossy().to_string().clone()) {
                // Case 1: Name is new, simply insert the item
                std::collections::hash_map::Entry::Vacant(entry) => {
                    entry.insert(item);
                }
                // Case 2: Name already exists, apply the age logic
                std::collections::hash_map::Entry::Occupied(mut entry) => {
                    let existing_item = entry.get_mut(); // Get a mutable reference to the stored item
    
                    // Check if the existing item's age is None
                    if existing_item.command.is_empty() {
                        // If the existing one has no age, replace it with the new item
                        // `item` is consumed here by being moved into the map
                        *existing_item = item;
                    }
                    // Else (if existing_item.age is Some), do nothing, keep the existing item.
                    // The 'item' from the loop is dropped here if not moved.
                }
            }
        }
    }

    // Convert the HashMap values back into a Vec
    unique_items_map.into_values().collect()
}

#[cfg(target_os = "windows")]
pub fn get_installed_apps() -> Result<Vec<App>, String> {
    let mut app_list: Vec<App> = Vec::new();
    let mut processed_apps: std::collections::HashSet<String> = std::collections::HashSet::new();

    // 1. Query Uninstall Registry Keys
    query_uninstall_registry(&mut app_list, &mut processed_apps);

    // 2. Query App Paths Registry Key
    query_app_paths_registry(&mut app_list, &mut processed_apps);

    // 3. Search Start Menu folders
    search_start_menu(&mut app_list, &mut processed_apps);
    
    // 4. Search PATH environment variable
    search_path_variable(&mut app_list, &mut processed_apps);

    // 5. Query for Microsoft Store apps (UWP)
    query_uwp_apps(&mut app_list, &mut processed_apps);

    Ok(collect_unique(app_list))
}

#[cfg(target_os = "windows")]
fn query_uninstall_registry(app_list: &mut Vec<App>, processed_apps: &mut std::collections::HashSet<String>) {
    let registry_paths = [
        "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    ];

    for path in &registry_paths {
        let output = Command::new("powershell")
            .args(&[
                "-Command",
                &format!("Get-ItemProperty {} | Select-Object DisplayName, DisplayIcon, InstallLocation | ConvertTo-Json", path)
            ])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let result_str = String::from_utf8_lossy(&output.stdout);
                let json_values: Vec<serde_json::Value> = if result_str.trim().starts_with('[') {
                    serde_json::from_str(&result_str).unwrap_or_default()
                } else if result_str.trim().is_empty() {
                    vec![]
                } else {
                    serde_json::from_str::<serde_json::Value>(&result_str).map(|v| vec![v]).unwrap_or_default()
                };

                for app in json_values {
                    if let Some(name) = app["DisplayName"].as_str() {
                        if !name.is_empty() && !processed_apps.contains(name) {
                            let icon = app["DisplayIcon"].as_str().unwrap_or("").to_string();
                            let install_location = app["InstallLocation"].as_str().unwrap_or("").to_string();

                            let mut command = icon.clone();

                            if command.contains(',') {
                                command = command.split(',').next().unwrap_or("").to_string();
                            }
                            command = command.replace("", "");

                            let lower_cmd = command.to_lowercase();
                            if (lower_cmd.contains("uninstall") || lower_cmd.contains("unins") || lower_cmd.is_empty()) {
                                if !install_location.is_empty() {
                                    command = install_location;
                                }
                            }
                            
                            if !command.is_empty() {
                                app_list.push(App {
                                    name: name.to_string(),
                                    command:if(!(command.contains("uninstall") || command.contains("unins") || command.is_empty())){command}else{"".to_string()},
                                    icon,
                                    fromwhere: path.to_string(),
                                });
                                processed_apps.insert(name.to_string());
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn query_app_paths_registry(app_list: &mut Vec<App>, processed_apps: &mut std::collections::HashSet<String>) {
    use winreg::enums::*;
    use winreg::RegKey;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(app_paths) = hklm.open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths") {
        for key in app_paths.enum_keys().filter_map(Result::ok) {
            if let Ok(subkey) = app_paths.open_subkey(&key) {
                if let Ok(path_str) = subkey.get_value::<String, _>("") {
                    let name = key;
                    if !name.is_empty() && !processed_apps.contains(&name) {
                        app_list.push(App {
                            name: name.clone(),
                            command: path_str.clone(),
                            icon: path_str,
                            fromwhere: "App Paths".to_string(),
                        });
                        processed_apps.insert(name);
                    }
                }
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn search_start_menu(app_list: &mut Vec<App>, processed_apps: &mut std::collections::HashSet<String>) {
    let start_menu_paths = vec![
        env::var("APPDATA").unwrap_or_default() + "\\Microsoft\\Windows\\Start Menu\\Programs",
        env::var("ALLUSERSPROFILE").unwrap_or_default() + "\\Microsoft\\Windows\\Start Menu\\Programs",
    ];

    for path in start_menu_paths {
        if Path::new(&path).exists() {
            for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
                if entry.file_type().is_file() && entry.path().extension().and_then(|s| s.to_str()) == Some("lnk") {

                    if let Ok(link) = lnk::ShellLink::open(entry.path()) {
                        let mut exepath="".to_string();
                        if let Some(target_path) = link.working_dir() {
                            if Path::new(target_path).is_dir() {
                                for entry in WalkDir::new(target_path).max_depth(1).into_iter().filter_map(|e| e.ok()) {
                                    if entry.file_type().is_file() {
                                        if let Some(ext) = entry.path().extension().and_then(|s| s.to_str()) {
                                            if ["exe", "com", "bat"].contains(&ext) {
                                                let filepath=entry.path().to_string_lossy().to_string().to_lowercase();
                                                if(!(filepath.contains("uninstall") || filepath.contains("unins") || filepath.is_empty())){
                                                    exepath=entry.path().to_string_lossy().to_string()
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            let name = entry.path().file_stem().unwrap().to_string_lossy().to_string();
                            if !name.is_empty() && !processed_apps.contains(&name) {
                                app_list.push(App {
                                    name: name.clone(),
                                    command: exepath,
                                    icon: target_path.to_string(),
                                    fromwhere: "Start Menu".to_string(),
                                });
                                processed_apps.insert(name);
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn search_path_variable(app_list: &mut Vec<App>, processed_apps: &mut std::collections::HashSet<String>) {
    if let Ok(path_var) = env::var("PATH") {
        for path in env::split_paths(&path_var) {
            if path.is_dir() {
                for entry in WalkDir::new(path).max_depth(1).into_iter().filter_map(|e| e.ok()) {
                    if entry.file_type().is_file() {
                        if let Some(ext) = entry.path().extension().and_then(|s| s.to_str()) {
                            if ["exe", "com", "bat"].contains(&ext) {
                                let name = entry.path().file_stem().unwrap().to_string_lossy().to_string();
                                if !name.is_empty() && !processed_apps.contains(&name) {
                                    app_list.push(App {
                                        name: name.clone(),
                                        command: entry.path().to_string_lossy().to_string(),
                                        icon: entry.path().to_string_lossy().to_string(),
                                        fromwhere: "PATH".to_string(),
                                    });
                                    processed_apps.insert(name);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn query_uwp_apps(app_list: &mut Vec<App>, processed_apps: &mut std::collections::HashSet<String>) {
    let uwp_output = Command::new("powershell")
        .args(&[
            "-Command",
            "Get-AppxPackage | Select-Object Name, InstallLocation | ConvertTo-Json"
        ])
        .output();

    if let Ok(output) = uwp_output {
        if output.status.success() {
            let result_str = String::from_utf8_lossy(&output.stdout);
            if let Ok(apps) = serde_json::from_str::<Vec<serde_json::Value>>(&result_str) {
                for app in apps {
                    if let (Some(name), Some(_location)) = (app["Name"].as_str(), app["InstallLocation"].as_str()) {
                        if !name.is_empty() && !processed_apps.contains(name) {
                            let app_list_entry = App {
                                name: name.to_string(),
                                command: format!("explorer.exe shell:appsFolder\\{}", name),
                                icon: "".to_string(),
                                fromwhere: "Windows Appstore".to_string(),
                            };
                            app_list.push(app_list_entry);
                            processed_apps.insert(name.to_string());
                        }
                    }
                }
            }
        }
    }
}

#[cfg(target_os = "macos")]
pub fn get_installed_apps() -> Result<Vec<App>, String> {
    let mut app_list: Vec<App> = Vec::new();
    if let Ok(entries) = std::fs::read_dir("/Applications") {
        for entry in entries.flatten() {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.ends_with(".app") {
                    let app_name = file_name.trim_end_matches(".app").to_string();
                    let mut icon_path = "".to_string();
                    let plist_path = format!("/Applications/{}/Contents/Info.plist", file_name);
                    if let Ok(plist_content) = std::fs::read_to_string(plist_path) {
                        if let Some(icon_file_line) = plist_content.lines().find(|line| line.contains("<key>CFBundleIconFile</key>")) {
                            if let Some(next_line) = plist_content.lines().skip_while(|line| !line.contains("<key>CFBundleIconFile</key>")).nth(1) {
                                if let Some(icon_file) = next_line.trim().strip_prefix("<string>").and_then(|s| s.strip_suffix("</string>")) {
                                    icon_path = format!("/Applications/{}/Contents/Resources/{}", file_name, icon_file);
                                }
                            }
                        }
                    }
                    app_list.push(App {
                        name: app_name.clone(),
                        command: format!("open -a \"{}\"", app_name),
                        icon: icon_path,
                        fromwhere: "Applications Folder".to_string(),
                    });
                }
            }
        }
    }
    Ok(app_list)
}

#[cfg(target_os = "linux")]
pub fn get_installed_apps() -> Result<Vec<App>, String> {
    use std::fs;
    let mut app_list: Vec<App> = Vec::new();
    let mut processed_apps: std::collections::HashSet<String> = std::collections::HashSet::new();

    let dirs = ["/usr/share/applications", "/var/lib/snapd/desktop/applications", "/usr/share/applications/kde-org"];
    if let Some(home_dir) = dirs::home_dir() {
        if let Some(local_app_dir) = home_dir.join(".local/share/applications").to_str() {
            let mut all_dirs = dirs.to_vec();
            all_dirs.push(local_app_dir);
            parse_desktop_files(&mut app_list, &mut processed_apps, &all_dirs);
        } else {
            parse_desktop_files(&mut app_list, &mut processed_apps, &dirs);
        }
    }

    Ok(app_list)
}

#[cfg(target_os = "linux")]
fn parse_desktop_files(app_list: &mut Vec<App>, processed_apps: &mut std::collections::HashSet<String>, dirs: &[&str]) {
    for dir in dirs {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                if let Some(path_str) = entry.path().to_str() {
                    if path_str.ends_with(".desktop") {
                        if let Ok(content) = std::fs::read_to_string(path_str) {
                            let mut name = None;
                            let mut command = None;
                            let mut icon = None;
                            for line in content.lines() {
                                if line.starts_with("Name=") {
                                    name = Some(line.trim_start_matches("Name=").to_string());
                                }
                                if line.starts_with("Exec=") {
                                    command = Some(line.trim_start_matches("Exec=").to_string());
                                }
                                if line.starts_with("Icon=") {
                                    icon = Some(line.trim_start_matches("Icon=").to_string());
                                }
                            }
                            if let (Some(name), Some(command)) = (name, command) {
                                if !processed_apps.contains(&name) {
                                    app_list.push(App { name: name.clone(), command, icon: icon.unwrap_or_default(), fromwhere: dir.to_string() });
                                    processed_apps.insert(name);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
pub fn get_installed_apps() -> Result<Vec<App>, String> {
    Err("Unsupported OS".to_string())
}

#[tauri::command]
pub fn launch_app_command(command: String) {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let _ = Command::new("cmd")
            .args(&["/C", "start", "", &command])
            .spawn();
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let _ = Command::new("sh").arg("-c").arg(&command).spawn();
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        let cleaned_command = command
            .replace("%f", "")
            .replace("%F", "")
            .replace("%u", "")
            .replace("%U", "")
            .replace("%i", "")
            .replace("%c", "")
            .replace("%k", "")
            .trim()
            .to_string();
        
        let _ = Command::new("sh").arg("-c").arg(&cleaned_command).spawn();
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        eprintln!("launch_app is not implemented for this OS");
    }
}