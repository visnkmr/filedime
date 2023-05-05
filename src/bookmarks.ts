import * as globals from './file-explorer';

export function loadmarks(){
(window as any).__TAURI__.event.listen("load-marks", (data: { payload:string }) => {
    console.log("listmarks ")
      type mark = {
        path:string,
        name:string
      };
      // type tabinfo = {
      //   oid: number,
      //   path: string,
      //   ff: string,
      //   tabname: string
      // };
      // let tabs: tabinfo[] = JSON.parse(data.payload);
      // // console.log("files")
      // clear the file list
      globals.marklist.replaceChildren();
      // console.log(data.payload)
      let r:mark[]=JSON.parse(data.payload);
      console.log(r)
      // loop through the files array
      // for (let tb of data.payload) {
      // let i=data.payload;
      for (var i = 0; i < r.length; i++) {
      // create a table row element for each file
      let b = document.createElement("button");
      b.className = "mark-button"
      // let sn = document.createElement("span");
      // sn.className = "tab-name"
      // let sc = document.createElement("span");
      // sc.className = "tab-close"
      b.textContent = r[i].name;
      b.dataset.path= r[i].path
      // sc.textContent = "x";
      // b.appendChild(sn);
      // b.appendChild(sc);
      // b.id = tb.id.toString();
      // b.dataset.path = tb.path;
      // b.dataset.ff = tb.ff;
      globals.marklist.appendChild(b);
    }
  });
}