import uio, * as globals from './file-explorer';
import { settableandtbody } from './listfiles';
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
type statusmesg={
message:string,
status:string
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
        // case 'tsearch': populatesearchlist();
        // break;
        case "resettable":settableandtbody();
          break;
        default: {
          // let statusofpar:statusmesg=JSON.parse(JSON.stringify(data.payload)) as statusmesg;
          // console.log(statusofpar.message)
          console.log(JSON.stringify(data.payload))
          // console.log(JSON.stringify(data.payload)+"-------->"+statusofpar.message)
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