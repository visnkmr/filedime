import { loadmarks } from './bookmarks';
import { getpathlist } from './getpathoptions';
import { handleclicks } from './handleclick';
import { listenforfiles, listenforfolcount } from './listfiles';
import { loadmarkdown } from './markdown';
import { listtabs } from './tabs';
import { starttimer } from './timer';
// globalThis.tid=globalThis.globalThis.tid;
// import * from globalsthis;
// export declare var globalThis.tid:number|string;
// globalThis.tid=0;
// declare var globalThis.frompath:string;
// globalThis.frompath=""
globalThis.frompath="";
globalThis.tid=0;
export const { invoke } = (window as any).__TAURI__.tauri;
export const { listen } = (window as any).__TAURI__.event;
export const pathInput = document.getElementById("path-input") as HTMLInputElement;
export const listButton = document.getElementById("list-button") as HTMLButtonElement;
export const fileList = document.getElementById("file-list") as HTMLTableElement;
export const tablist = document.getElementById("tabs-list") as HTMLTableElement;
export const marklist = document.getElementsByClassName("markslist")[0] as HTMLTableElement;
export const htmlbase = document.getElementById("htmlbase") as HTMLDivElement;
export const pathline = document.getElementById("path") as HTMLDivElement;
export const parentsize = document.getElementById("parent-size") as HTMLParagraphElement;
export const menu = document.getElementById("menu") as HTMLUListElement;
export const reload = document.getElementById("reload") as HTMLButtonElement;
export const newtab = document.getElementById("newtab") as HTMLButtonElement;
export const backButton = document.getElementById("back-button") as HTMLButtonElement;
export const nosize = document.getElementById("no-size") as HTMLButtonElement;
export const datalist = document.getElementById("path-list") as HTMLDataListElement;

// Get the name and X elements
var bname = document.querySelector(".tab-name") as HTMLSpanElement;
var bclose = document.querySelector(".tab-close") as HTMLSpanElement;
var thistory: string[] = [];
var tforward: string[] = [];

var lastfolder = "/home/roger/.cargo/registry/src/github.com-1ecc6299db9ec823/";


(window as any).__TAURI__.event.listen("folder-size", (data: { payload: string }) => {
  console.log("foldersize")

  parentsize.innerHTML = data.payload.toString();
  // console.log(data.payload.toString())
});

(window as any).__TAURI__.event.listen("grandparent-loc", (data: { payload: string }) => {
  console.log("grandloc")
  
  lastfolder = data.payload.toString();
  // console.log(data.payload.toString())
});
(window as any).__TAURI__.event.listen("parent-loc", (data: { payload: string }) => {
  console.log("--------------parentloc---"+data.payload)
  pathInput.value = data.payload.toString();
  // console.log(data.payload.toString())
});





// listen for the list-files event from the backend
// parse the data as JSON

// var globalThis.tid = 0;
// web app code

window.addEventListener("DOMContentLoaded", () => {
  listenforfiles();
console.log("hui");
loadmarkdown();
  // (window as any).__TAURI__.invoke(
  //   "newtab",
  //   {
  //     oid: globalThis.tid.toString(),
  //     path: "/home/roger/.cargo/registry/src/github.com-1ecc6299db9ec823/os_info-3.7.0/src/macos",
  //     ff: ""
  //   });

  // (window as any).__TAURI__.invoke(
  //     "load_tab",
  //     {
  //       oid: globalThis.tid.toString()
  //     }
  //   );

  (window as any).__TAURI__.invoke(
    "list_files",
    {
      oid: globalThis.tid.toString(),
      path: "/home/roger/.cargo/registry/src/github.com-1ecc6299db9ec823/",
      ff: ""
    });
    starttimer();
    
  // add a click event listener to the back button
  nosize.addEventListener("click", () => {
    // check if there is any previous path in the history
    (window as any).__TAURI__.invoke(
      "nosize",
      {
        id: globalThis.tid.toString(),
        path: pathInput.value
      });
  });


  // add an event listener to the list button
  listButton.addEventListener("click", async () => {
    // get the value of the path input
    let path = pathInput.value;
    // invoke the list_files command from the backend with the path as argument
    await (window as any).__TAURI__.invoke(
      "list_files",
      {
        oid: globalThis.tid.toString(),
        path: path,
        ff: ""
      });
    pathInput.value = path
  });

  // add an event listener to the button
  newtab.addEventListener("click", async () => {
    // get the value of the path input
    // let path = pathInput.value;
    globalThis.tid = globalThis.tid as number + 1;
    // invoke the list_files command from the backend with the path as argument
    await (window as any).__TAURI__.invoke(
      "newtab",
      {
        oid: globalThis.tid.toString(),
        path: "/home/roger/Downloads/",
        ff: ""
      }
    );
    await (window as any).__TAURI__.invoke(
      "load_tab",
      {
        oid: globalThis.tid.toString()
      }
    );

    // pathInput.value=path
  });
  document.addEventListener("contextmenu", function (e) {
    // console.log(e)
    if((e.target as HTMLElement).className=="td1"){
      
      // Prevent the default menu from showing up
      e.preventDefault();
      globalThis.frompath=(e.target as HTMLElement).dataset.path as string;
      menu.replaceChildren();
      let o1=document.createElement("li")
      o1.id="o1"
      o1.textContent="Open in new tab"
      menu.appendChild(o1);
     let o2=document.createElement("li")
      o2.id="o2"
      o2.textContent="Copy"
      menu.appendChild(o2);
     let o3=document.createElement("li")
      o3.id="o3"
      o3.textContent="paste"
      menu.appendChild(o3);
     let o4=document.createElement("li")
      o4.id="o4"
      o4.textContent="add bookmark"
      menu.appendChild(o4);
      // Show the custom menu
      menu.style.display = "block";

  
      // Position the menu according to the mouse coordinates
      menu.style.left = e.pageX + "px";
      menu.style.top = e.pageY + "px";
    }
    else if((e.target as HTMLElement).className=="mark-button"){
      
      // Prevent the default menu from showing up
      e.preventDefault();
      globalThis.frompath=(e.target as HTMLElement).dataset.path as string;
      menu.replaceChildren();
      let o1=document.createElement("li")
      o1.id="o5"
      o1.textContent="remove bookmark"
      menu.appendChild(o1);

      menu.style.display = "block";

  
      // Position the menu according to the mouse coordinates
      menu.style.left = e.pageX + "px";
      menu.style.top = e.pageY + "px";
    }
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

  // Add a listener for the keydown event on the document
  document.addEventListener("keydown", function (e) {
    // Hide the menu if the user presses Esc
    if (e.key === "Escape") {
      menu.style.display = "none";
    }
  });

});

listenforfolcount();
listtabs();
loadmarks();