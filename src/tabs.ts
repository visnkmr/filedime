import { invoke, path } from '@tauri-apps/api';
import uio, * as globals from './file-explorer';

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
    let tabs: tabinfo[] = JSON.parse(data.payload) as tabinfo[];
    // // console.log("files")
    // clear the file list
    globals.tablist.innerHTML = "";
    // // console.log(data.payload)
    // loop through the files array
    for (let tb of tabs) {
      // create a table row element for each file
      // let border=document.createElement("span");
      // border.className="border-bx"
      // globals.tablist.appendChild(border);
      // let tbt=document.createElement("span");
      // tbt.className="tbt"

      let b = document.createElement("div");
      b.className = "tab-button";
      if(tb.path===globalThis.activetab){
        b.classList.add("active");
        b.classList.remove("inactive");
      }
      else{
        b.classList.add("inactive");
        b.classList.remove("active");
      }
     (window as any).__TAURI__.invoke(
        "getuniquewindowlabel",
        {
          
        }
        ).then((returned:string)=>{
          b.dataset.ul=returned;
        })

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
      // b.appendChild(tbt)
      globals.tablist.appendChild(b);
    }
  });
}
export function lfat(){
  
  (window as any).__TAURI__.event.listen("lfat", (data: { wname: string,path:string }) => {
    console.log("new------_______>"+data);
    addtab(data.wname,data.path)
  });
}
export function addtab(wname:string,path:string){
    // get the value of the path input
    // let path = pathInput.value;
    globalThis.tid = globalThis.tid as number + 1 as number;
    // invoke the list_files command from the backend with the path as argument
    (window as any).__TAURI__.invoke(
      "newtab",
      {
        windowname:wname,
        oid: globalThis.tid.toString(),
        path: path,
        ff: ""
      }
    );
    globals.tablist.childNodes.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        (child as HTMLDivElement).classList.add('inactive');
        (child as HTMLDivElement).classList.remove('active');
      }
    });
    let b = document.createElement("div");
      b.classList.add( "tab-button");
      
      b.classList.add( "active");
      // b.className="inactive"
      let sn = document.createElement("span");
      sn.className = "tab-name"
      
      let sc = document.createElement("span");
      sc.className = "tab-close";
       (window as any).__TAURI__.invoke(
        "tabname",
        {
          path:path,
        }
      ).then((returned:string)=>{
        // console.log("what was returned....."+returned)
        sn.textContent =returned
      });
      sc.textContent = "x";
      b.appendChild(sn);
      b.appendChild(sc);
      b.id = globalThis.tid.toString();
      b.dataset.path = path;
      b.dataset.ff = "";
      // b.appendChild(tbt)
      globals.tablist.appendChild(b);
      (window as any).__TAURI__.invoke(
        "load_tab",
        {
          windowname:uio.appWindow.label,
          oid: globalThis.tid.toString()
        }
      );
console.log("added to "+uio.appWindow.label)

}