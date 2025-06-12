use std::fs::{self, DirBuilder};
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::{Manager, State, Window};
use crate::appstate::AppStateStore;

#[derive(Serialize, Deserialize, Debug)]
pub struct ExtensionManifest {
    name: String,
    version: String,
    author: String,
    description: String,
    entry_point: String,
    permissions: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ExtensionInfo {
    id: String,
    manifest: ExtensionManifest,
    enabled: bool,
}

#[tauri::command]
pub async fn get_extensions_dir(app_handle: tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle.path_resolver().app_data_dir().unwrap_or_else(|| {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        home.join(".filedime")
    });
    let extensions_dir = app_dir.join("extensions");
    if !extensions_dir.exists() {
        DirBuilder::new()
            .recursive(true)
            .create(&extensions_dir)
            .unwrap();
    }
    extensions_dir
}

#[tauri::command]
pub async fn install_extension(app_handle: tauri::AppHandle, source_path: String) -> Result<String, String> {
    let extensions_dir = get_extensions_dir(app_handle.clone()).await;
    let source_path_clone = source_path.clone();
    let source = PathBuf::from(source_path);
    
    if !source.exists() {
        return Err(format!("Source path does not exist: {}", source_path_clone));
    }
    
    let extension_id = source.file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown_extension".to_string());
    let dest_path = extensions_dir.join(&extension_id);
    
    if dest_path.exists() {
        return Err(format!("Extension already installed: {}", extension_id));
    }
    
    // Copy the extension files to the extensions directory
    fs_extra::copy_items(&vec![source], &extensions_dir, &fs_extra::dir::CopyOptions::new())
        .map_err(|e| format!("Failed to copy extension: {}", e))?;
    
    // Check for manifest file
    let manifest_path = dest_path.join("extension.json");
    if !manifest_path.exists() {
        fs::remove_dir_all(&dest_path).ok(); // Clean up if manifest is missing
        return Err("Extension manifest (extension.json) not found".to_string());
    }
    
    // Read and parse manifest
    let manifest_content = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read manifest: {}", e))?;
    let manifest: ExtensionManifest = serde_json::from_str(&manifest_content)
        .map_err(|e| format!("Invalid manifest format: {}", e))?;
    
    // Save extension info with enabled set to true by default
    let extension_info = ExtensionInfo {
        id: extension_id.clone(),
        manifest,
        enabled: true,
    };
    let info_path = extensions_dir.join(format!("{}.info.json", extension_id));
    fs::write(&info_path, serde_json::to_string_pretty(&extension_info).unwrap())
        .map_err(|e| format!("Failed to save extension info: {}", e))?;
    
    Ok(format!("Extension {} installed successfully", extension_id))
}

#[tauri::command]
pub async fn uninstall_extension(app_handle: tauri::AppHandle, extension_id: String) -> Result<String, String> {
    let extensions_dir = get_extensions_dir(app_handle.clone()).await;
    let extension_path = extensions_dir.join(&extension_id);
    let info_path = extensions_dir.join(format!("{}.info.json", extension_id));
    
    if !extension_path.exists() {
        return Err(format!("Extension not found: {}", extension_id));
    }
    
    fs::remove_dir_all(&extension_path)
        .map_err(|e| format!("Failed to remove extension directory: {}", e))?;
    if info_path.exists() {
        fs::remove_file(&info_path)
            .map_err(|e| format!("Failed to remove extension info: {}", e))?;
    }
    
    Ok(format!("Extension {} uninstalled successfully", extension_id))
}

#[tauri::command]
pub async fn list_extensions(app_handle: tauri::AppHandle) -> Result<Vec<ExtensionInfo>, String> {
    let extensions_dir = get_extensions_dir(app_handle.clone()).await;
    let mut extensions = Vec::new();
    
    if !extensions_dir.exists() {
        return Ok(extensions);
    }
    
    for entry in fs::read_dir(&extensions_dir)
        .map_err(|e| format!("Failed to read extensions directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();
        if path.is_dir() {
            let id = path.file_name()
                .map(|name| name.to_string_lossy().to_string())
                .unwrap_or_default();
            let info_path = extensions_dir.join(format!("{}.info.json", id));
            if info_path.exists() {
                let info_content = fs::read_to_string(&info_path)
                    .map_err(|e| format!("Failed to read extension info for {}: {}", id, e))?;
                let info: ExtensionInfo = serde_json::from_str(&info_content)
                    .map_err(|e| format!("Invalid extension info format for {}: {}", id, e))?;
                extensions.push(info);
            }
        }
    }
    
    Ok(extensions)
}


#[tauri::command]
pub async fn toggle_extension(app_handle: tauri::AppHandle, extension_id: String, enable: bool) -> Result<String, String> {
    let extensions_dir = get_extensions_dir(app_handle.clone()).await;
    let info_path = extensions_dir.join(format!("{}.info.json", extension_id));
    
    if !info_path.exists() {
        return Err(format!("Extension not found: {}", extension_id));
    }
    
    let mut info_content = fs::read_to_string(&info_path)
        .map_err(|e| format!("Failed to read extension info: {}", e))?;
    let mut info: ExtensionInfo = serde_json::from_str(&info_content)
        .map_err(|e| format!("Invalid extension info format: {}", e))?;
    info.enabled = enable;
    info_content = serde_json::to_string_pretty(&info).unwrap();
    fs::write(&info_path, &info_content)
        .map_err(|e| format!("Failed to update extension info: {}", e))?;
    
    Ok(format!("Extension {} {}", extension_id, if enable { "enabled" } else { "disabled" }))
}

#[tauri::command]
pub async fn load_extension_content(app_handle: tauri::AppHandle, extension_id: String, resource: String) -> Result<String, String> {
    let extensions_dir = get_extensions_dir(app_handle.clone()).await;
    let extension_path = extensions_dir.join(&extension_id);
    
    if !extension_path.exists() {
        return Err(format!("Extension not found: {}", extension_id));
    }
    
    let resource_clone = resource.clone();
    let resource_path = extension_path.join(resource);
    if !resource_path.exists() {
        return Err(format!("Resource not found: {}", resource_clone));
    }
    
    let content = fs::read_to_string(&resource_path)
        .map_err(|e| format!("Failed to read resource: {}", e))?;
    Ok(content)
}

#[tauri::command]
pub async fn get_extension_bundle_url(app_handle: tauri::AppHandle, extension_id: String) -> Result<String, String> {
    let extensions_dir = get_extensions_dir(app_handle.clone()).await;
    let extension_path = extensions_dir.join(&extension_id);
    
    if !extension_path.exists() {
        return Err(format!("Extension not found: {}", extension_id));
    }
    
    // Check for the bundled file in dist/index.js or dist/index.html
    let js_bundle_path = extension_path.join("dist").join("index.js");
    let html_bundle_path = extension_path.join("dist").join("index.html");
    println!("{}--{}",js_bundle_path.exists(),html_bundle_path.exists());
    
    // if js_bundle_path.exists() {
    //     // Construct a URL for JavaScript bundle
    //     let bundle_url = format!("http://localhost:8477/extensions/{}/dist/index.js", extension_id);
    //     return Ok(bundle_url);
    // } else 
    if html_bundle_path.exists() {
        // Construct a URL for HTML content
        let bundle_url = format!("http://localhost:8477/extensions/{}/dist/index.html", extension_id);
        return Ok(bundle_url);
    } else {
        return Err(format!("Bundle not found for extension: {}", extension_id));
    }
}
