Filedime, an open source almost feature complete file explorer written in Rust (for all filesystem interaction,backend), Tauri(for frontend, front-backend intercom).

Features implemented:

- [x] multi window, open in new window open in right click context menu
- [x] tabs, open in new tab option in context menu
- [x] hot reload/ monitor for changes: markdown, html files using the watch button that shows up on opening the file.
- [x] search with speed and responsiveness parity with fzf
- [x] folder size compute with speed and responsiveness parity with baobab(Disk Usage Analyzer).
- [x] preview html, markdown files.
- [x] LOC for ts, rs, js, java, md ,css, html, toml, etc more can be implemented as required.
- [x] bookmark files or folders.
- [x] details screen for list sort by date, size.
- [x] path autocomplete as you type.
- [x] recent files list that ignores node_modules, and hidden folders and files etc.
- [x] no of each file type in present location.
- [x] optionally show immediate sub folder count of a folder.
- [x] show image dimension along with file type.
- [x] System Tray icons for opening new window and access recent files.
- [ ] rsync based copy, cut, move, etc.

Subtle features
- [x] show name of right click file above context menu
- [x] show file location on hover at bottom left of window when scrolling over results of search

Thanks Tauri, Typescript, Webpack->RSPack, 


## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Build from source
  
clone the repo  
npm i  
npm run watch  
in a new terminal window "cargo tauri dev" for testing.  
in a new terminal window "cargo tauri build" for making .exe.  

