import { loadmarks } from './bookmarks';
import setsendpath, { resetpaste, setpasteclick } from './copynpaste';
import  showdialog, { listendialog } from './debug';
// import { sendlog } from './debug';
import { watchfile } from './filechangewatcher';
import { getpathlist, searchforit } from './getpathoptions';
import { handleclicks } from './handleclick';
import { handlerightclick, hovered } from './handlerightclick';
import { listenfordrives, listenforfiles, listenforfolcount, settableandtbody } from './listfiles';
import { loadmarkdown } from './markdown';
import { menuapilistener } from './menu_apis';
import { openhtml } from './openfile';
import { progress } from './progress';
import { recentfiles } from './recent_file';
import { loadsearchresult, searchterm } from './searchresult';
import { addtab, lfat, listtabs } from './tabs';
import { starttimer, stoptimer } from './timer';
import { window as uio } from '@tauri-apps/api';
export default uio;
// import { WebviewWindow } from '@tauri-apps/api/window'
// globalThis.tid=globalThis.globalThis.tid;
// import * from globalsthis;
// export declare var globalThis.tid:number|string;
// globalThis.tid=0;
// declare var globalThis.frompath:string;
// globalThis.frompath=""
globalThis.frompath = "";
globalThis.startstopfilewatchertoggle = false;
export const { invoke } = (window as any).__TAURI__.tauri;
export const { listen } = (window as any).__TAURI__.event;

let current="20px";
window.addEventListener('wheel', function(event) {
  if (event.ctrlKey) {
    if (event.deltaY < 0) {
      current =(parseInt(current)+2)+'px';
    } else if (event.deltaY > 0) {
      current =(parseInt(current)-2)+'px';
    }
    var elements = document.querySelectorAll('*');
    elements.forEach(function(element) {
    (element as HTMLElement).style.fontSize=current;

    });
    console.log(current);
  }
});

globalThis.activetab="";

export const pathInput = document.getElementById("path-input") as HTMLInputElement;
export const searchInput = document.getElementById("search-input") as HTMLInputElement;
export const listButton = document.getElementById("list-button") as HTMLButtonElement;
export const fileList = document.getElementById("file-list") as HTMLTableElement;
export const tablist = document.getElementById("tabs-list") as HTMLTableElement;
export const marklist = document.getElementsByClassName("markslist")[0] as HTMLTableElement;
export const htmlbase = document.getElementById("htmlbase") as HTMLDivElement;
export const sow = document.getElementById("setsofwhat") as HTMLSpanElement;
export const pathline = document.getElementById("path") as HTMLDivElement;
export const ousd = document.getElementById("ousd") as HTMLDivElement;
export const filewatch = document.getElementById("startserve") as HTMLDivElement;
export const parentsize = document.getElementById("parent-size") as HTMLParagraphElement;
export const menu = document.getElementById("menu") as HTMLUListElement;
export const ht = document.getElementById("hovertip") as HTMLDivElement;
// export const loader = document.getElementById('loader-toggle') as HTMLDivElement;
// Declare the type of the timer element

export const reload = document.getElementById("reload") as HTMLButtonElement;
globalThis.sendpath=[]
// let sendpath="";

export const recent = document.getElementById("recent") as HTMLButtonElement;
export const newtab = document.getElementById("newtab") as HTMLButtonElement;
export const newwin = document.getElementById("new_window") as HTMLButtonElement;
export const otb = document.getElementById("otb") as HTMLButtonElement;

export const copy = document.getElementById("copy") as HTMLButtonElement;
  export const sync = document.getElementById("sync") as HTMLButtonElement;

export const backButton = document.getElementById("back-button") as HTMLButtonElement;
export const nosize = document.getElementById("no-size") as HTMLButtonElement;
export const folcount = document.getElementById("fol-count") as HTMLButtonElement;
export const tsearch = document.getElementById("t-search") as HTMLButtonElement;
export const datalist = document.getElementById("path-list") as HTMLDataListElement;
// var lastfolder;

 // an array to store the timer IDs

// var bclose = document.querySelector(".tab-close") as HTMLSpanElement;
// var thistory: string[] = [];
// var tforward: string[] = [];
// var label=uio.getCurrent().label;
// if (label=="main"){
//   // globalThis.defpath = "C:/Users/wkramer/Downloads/github"
//   // lastfolder = globalThis.defpath;
// }
// else{

  
  
// }



globalThis.lastimefilesloaded=0;
// web app code

window.addEventListener("DOMContentLoaded", () => {
  // console.log("downloaded")
  listenfordrives();
  listenforfiles();
  starttimer();
  menuapilistener();

  // window.find();
  var dev=false;
  console.log("1....."+uio.getCurrent().label);
  if(uio.getCurrent().label==="main"){
globalThis.tid = 0;

    console.log("main")
    
  // globalThis.defpath =dev? "/home/roger/.local/share/Zeal/Zeal/docsets/JavaScript.docset/Contents/Resources/Documents":"/";
  globalThis.defpath="drives://"
    addtab("main",globalThis.defpath);
    (window as any).__TAURI__.invoke(
    "list_files",
    {
      windowname:"main",
      oid: globalThis.tid.toString(),
      path: globalThis.defpath,
      ff: ""
    });
    // loader.hidden=false;
  }
  else{
  // globalThis.defpath="drives://"

globalThis.tid = 0;
// addtab(uio.appWindow.label,globalThis.defpath);

    // (window as any).__TAURI__.invoke(
    //   "newwindow",
    //   {
    //     id: (globalThis.tid as number + 1).toString(),
    //     path: globalThis.frompath,
    //     ff:""
    //   });
    let label=uio.getCurrent().label;
    console.log(label+"------"+globalThis.tid);
      (window as any).__TAURI__.invoke(
      "whattoload",
      {
        windowname:label,
      })  
      .then((path:string)=>{
        addtab(label,path)
      });
      
      //addtab here TODO
      // (window as any).__TAURI__.invoke(
      //   "getpathfromid",
      //   {
      //     id:globalThis.tid.toString()
      //   }).then(
      //     (returned:string)=>{
      //       addtab(uio.appWindow.label,returned);
      //       console.log(returned)
      //     }
      //   );
  }
  // showdialog("opening screen");
  // lfat();
  
  document.addEventListener("contextmenu", function (e) {
    // console.log(e)
    handlerightclick(e);
  });
  
  document.addEventListener("mouseover", function (e) {
    // console.log(e)
    hovered(e);
  });

  // Add a listener for the click event on the document
  document.addEventListener("click", function (e: Event) {
    // console.log(e)
    // Hide the menu if the user clicks outside of it
    handleclicks(e);

  });

  // Add an input event listener to the input element
  pathInput.addEventListener("input", async () => {
    // Get the current value of the input element
    const path = pathInput.value;

    // Invoke the Rust function with the path as an argument
    getpathlist(path);
  });

  searchInput.addEventListener("input", async () => {
    // Get the current value of the input element

    // Invoke the Rust function with the path as an argument
    searchforit(searchInput.value);
  });

  // Add a listener for the keydown event on the document
  document.addEventListener("keydown", function (e) {
    // Hide the menu if the user presses Esc
    if (e.key === "Escape") {
      menu.style.display = "none";
    }
  });
  

  copy.onclick= function () {
    setsendpath(pathInput.value);
  }
  setpasteclick();

});
listendialog();
loadmarkdown();
listeningapi();
listenforfolcount();
listtabs();
loadmarks();
// sendlog();
watchfile();
openhtml();

function listeningapi() {
  (window as any).__TAURI__.event.listen("folder-size", (data: { payload: string }) => {
    console.log("foldersize")
  
    parentsize.innerHTML = data.payload.toString();
    // console.log(data.payload.toString())
  });
  
  (window as any).__TAURI__.event.listen("load-complete", (data: { payload: string }) => {
    console.log("load complete")
    var setp = document.getElementById("myprogress") as HTMLProgressElement;
    setp.className = "hide"
  });
  type fsc={
    name:string,
    count:number
  }
  (window as any).__TAURI__.event.listen("fsc", (data: { payload: string }) => {
    console.log("-------------__>"+((data.payload)))
    let fscs = JSON.parse(data.payload) as Map<string,number>;
    sow.replaceChildren();
    for (let [key, value] of Object.entries(fscs)) {
      let filep = document.createElement("span");
      filep.id=key
      filep.className="fsc"
      let filet = document.createElement("p");
      filet.textContent=key+" ("+value+") "
      filep.appendChild(filet)
      sow.appendChild(filep);
      // console.log(key + ": " + value);
    }
  
  
    // sow
    // var setp = document.getElementById("myprogress") as HTMLProgressElement;
    // setp.className = "hide"
  });
  
  (window as any).__TAURI__.event.listen("grandparent-loc", (data: { payload: string }) => {
    console.log("grandloc")
  
    // lastfolder = data.payload.toString();
    // console.log(data.payload.toString())
  });
  type Parentloc={
    path:String;
    tabid:String;
  }
  (window as any).__TAURI__.event.listen("parent-loc", (data: { payload: string }) => {
    console.log("--------------parentloc---" + data.payload)
    let r:Parentloc=JSON.parse(data.payload) as Parentloc;
    let tabid=r.tabid;
    tablist.childNodes.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        // console.log("1........."+((child as HTMLDivElement)).id);
        if(((child as HTMLDivElement)).id==tabid){
          (window as any).__TAURI__.invoke(
            "tabname",
            {
              path:r.path,
            }
          ).then((returned:string)=>{
            // console.log("what was returned....."+returned)
            ((child as HTMLDivElement).firstChild as HTMLSpanElement).textContent =returned
          });
          
        }
      }
    });
    pathInput.value = r.path.toString();
    // console.log(data.payload.toString())
  });
  (window as any).__TAURI__.event.listen("button-names", (data: { payload: string }) => {
    let blis=document.getElementsByClassName("additional_buttons")[0] as HTMLSpanElement;
    blis.replaceChildren()
    let r:string[]=JSON.parse(data.payload) as string[];
    r.forEach((value, index) =>{
  
      let addb=document.createElement("button");
      addb.textContent=value
      addb.onclick= function () {
        (window as any).__TAURI__.invoke(
          "otb",
          {
            bname: value,
            path: pathInput.value,
          }
          );
    }
      blis.appendChild(addb)
    });
    console.log("winnames: "+data.payload.toString())
  });
  loadsearchresult();
  searchterm();
  progress();
  stoptimer();
}
