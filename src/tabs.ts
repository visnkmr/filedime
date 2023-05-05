import * as globals from './file-explorer';

export function listtabs(){
    (window as any).__TAURI__.event.listen("list-tabs", (data: { payload: string }) => {
    console.log("listtabs ")
  
    type tabinfo = {
      id: number,
      path: string,
      ff: string,
      tabname: string,
      history:string[]
    };
    let tabs: tabinfo[] = JSON.parse(data.payload);
    // // console.log("files")
    // clear the file list
    globals.tablist.innerHTML = "";
    // // console.log(data.payload)
    // loop through the files array
    for (let tb of tabs) {
      // create a table row element for each file
      let b = document.createElement("button");
      b.className = "tab-button"
      let sn = document.createElement("span");
      sn.className = "tab-name"
      let sc = document.createElement("span");
      sc.className = "tab-close"
      sn.textContent = tb.tabname;
      sc.textContent = "x";
      b.appendChild(sn);
      b.appendChild(sc);
      b.id = tb.id.toString();
      b.dataset.path = tb.path;
      b.dataset.ff = tb.ff;
      globals.tablist.appendChild(b);
    }
  });
}