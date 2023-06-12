import uio, * as globals from './file-explorer';
import { recentfiles } from './recent_file';


export function reloadlist(){
    let path = globals.pathInput.value;
      // invoke the list_files command from the backend with the path as argument
      (window as any).__TAURI__.invoke(
        "list_files",
        {
        windowname:uio.appWindow.label,
          oid: globalThis.tid.toString(),
          path: path,
          ff: ""
        });
}
export function reloadsize(){
  (window as any).__TAURI__.invoke(
    "nosize",
    {
    windowname:uio.appWindow.label,
      id: globalThis.tid.toString(),
      path: globals.pathInput.value
    });
}
export function menuapilistener(){
    (window as any).__TAURI__.event.listen("reloadlist", (data: { payload: string }) => {
      switch(data.payload){
        case 'reload':reloadlist();
        break;
        case 'nosize': reloadsize();
        break;
        case 'folcount': populateimmediatechildcount();
        break;
        case 'recent': recentfiles();
        break;
        case 'tsearch': populatesearchlist();
        break;
        default: {
          let statusofpar=JSON.stringify(data.payload);
          console.log(statusofpar)
          console.log(statusofpar.)
        }
        // default:reloadlist();
      }
      //  reloadlist();
      });
    
}

export function populatesearchlist(){
  (window as any).__TAURI__.invoke(
    "loadsearchlist",
    {
    windowname:uio.appWindow.label,
      id: globalThis.tid.toString(),
      path: globals.pathInput.value
    });
}

export function populateimmediatechildcount(){
  (window as any).__TAURI__.invoke(
    "folcount",
    {
    windowname:uio.appWindow.label,
      id: globalThis.tid.toString(),
      path: globals.pathInput.value
    });
}