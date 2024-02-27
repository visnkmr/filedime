use tauri::State;

use crate::{navtimeline::BrowserHistory, tabname, AppStateStore};

#[tauri::command]
pub async fn disablenav(
    tabid: String,
    dir: bool,
    state: State<'_, AppStateStore>,
) -> Result<(), ()> {
    if let Ok(writetohistory) = state.history.read() {
        if let Some(history_entry) = writetohistory.get(&tabid) {
            println!("CPvalue-------{:?}", history_entry.current_page);

            if (dir) {
                //back check
                if (history_entry.current_page == 0) {
                    return Err(());
                }
                return Ok(());
            } else {
                //forward check
                if (history_entry.current_page == history_entry.browser_timeline.len() - 1) {
                    return Err(());
                }
                return Ok(());
            }
        }
    }
    (return Err(()));
}
#[tauri::command]
pub async fn addtotabhistory(
    tabid: String,
    path: String,
    state: State<'_, AppStateStore>,
) -> Result<(), String> {
    println!("added to{}-------{}", tabid, path);
    let mut writetohistory = state.history.write().unwrap();
    let history_entry = writetohistory
        .entry(tabid)
        .or_insert_with(|| BrowserHistory::default());
    history_entry.visit_page(path.clone(), tabname(path));
    println!("go to-------{:?}", history_entry);
    Ok(())
}
#[tauri::command]
pub async fn navbrowsetimeline(
    tabid: String,
    dir: bool,
    state: State<'_, AppStateStore>,
) -> Result<String, String> {
    println!("go to{}-------{}", tabid, dir);

    let mut writetohistory = state.history.write().unwrap();
    let history_entry = writetohistory
        .entry(tabid)
        .or_insert_with(|| BrowserHistory::default());
    println!("go to-------{:?}", history_entry);

    match (if (dir) {
        history_entry.go_back()
    } else {
        history_entry.go_forward()
    }) {
        Some(page) => return Ok(page.url.clone()),
        None => return Err("None found".to_string()),
    }
}
