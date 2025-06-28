use serde::{Serialize, Deserialize};
use std::process::Command;
use serde_json;

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct App {
    name: String,
    command: String,
    icon: String,
}

#[test]
fn testmod(){
    for app in get_installed_apps().unwrap(){
        if(app.name.to_lowercase().contains("code")){

            println!("{}",app.command);
        }
    }

}

#[cfg(target_os = "windows")]
pub fn get_installed_apps() -> Result<Vec<App>, String> {
    let mut app_list: Vec<App> = Vec::new();
    let mut processed_apps: std::collections::HashSet<String> = std::collections::HashSet::new();

    // Query standard registry locations for installed programs
    let registry_paths = [
        "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    ];

    for path in &registry_paths {
        let output = Command::new("powershell")
            .args(&[
                "-Command",
                &format!("Get-ItemProperty {} | Select-Object DisplayName, DisplayIcon | ConvertTo-Json", path)
            ])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let result_str = String::from_utf8_lossy(&output.stdout);
                if let Ok(apps) = serde_json::from_str::<Vec<serde_json::Value>>(&result_str) {
                    for app in apps {
                        if let Some(name) = app["DisplayName"].as_str() {
                            if !name.is_empty() && !processed_apps.contains(name) {
if let Some(command) = app["DisplayIcon"].as_str() {
                                    app_list.push(App {
                                        name: name.to_string(),
                                        command: command.to_string(),
                                        icon: command.to_string(),
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

    // Query for Microsoft Store apps
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
                    if let (Some(name), Some(location)) = (app["Name"].as_str(), app["InstallLocation"].as_str()) {
                        if !name.is_empty() && !processed_apps.contains(name) {
let app_list_entry = App {
                                name: name.to_string(),
                                command: format!("explorer.exe shell:appsFolder\\{}", name),
                                icon: "".to_string(),
                            };
                            if !app_list.contains(&app_list_entry) {
                                app_list.push(app_list_entry);
                                processed_apps.insert(name.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(app_list)
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
    use std::path::Path;

    let mut app_list: Vec<App> = Vec::new();
    let mut processed_apps: std::collections::HashSet<String> = std::collections::HashSet::new();

    let dirs = ["/usr/share/applications", "/var/lib/snapd/desktop/applications", "/usr/share/applications/kde-org", "/usr/share/applications/org.kde.dolphin.desktop"];
    if let Some(home_dir) = dirs::home_dir() {
        if let Some(local_app_dir) = home_dir.join(".local/share/applications").to_str() {
            let dirs_with_home = ["/usr/share/applications", local_app_dir];
            parse_desktop_files(&mut app_list, &mut processed_apps, &dirs_with_home);
        } else {
            parse_desktop_files(&mut app_list, &mut processed_apps, &dirs);
        }
    } else {
        parse_desktop_files(&mut app_list, &mut processed_apps, &dirs);
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
                                    app_list.push(App { name: name.clone(), command, icon: icon.unwrap_or_default() });
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
