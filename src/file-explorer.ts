import { loadmarks } from './bookmarks';
import { sendlog } from './debug';
import { watchfile } from './filechangewatcher';
import { getpathlist } from './getpathoptions';
import { handleclicks } from './handleclick';
import { handlerightclick } from './handlerightclick';
import { listenforfiles, listenforfolcount } from './listfiles';
import { loadmarkdown } from './markdown';
import { openhtml } from './openfile';
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
globalThis.startstopfilewatchertoggle=false;
export const { invoke } = (window as any).__TAURI__.tauri;
export const { listen } = (window as any).__TAURI__.event;
export const pathInput = document.getElementById("path-input") as HTMLInputElement;
export const listButton = document.getElementById("list-button") as HTMLButtonElement;
export const fileList = document.getElementById("file-list") as HTMLTableElement;
export const tablist = document.getElementById("tabs-list") as HTMLTableElement;
export const marklist = document.getElementsByClassName("markslist")[0] as HTMLTableElement;
export const htmlbase = document.getElementById("htmlbase") as HTMLDivElement;
export const pathline = document.getElementById("path") as HTMLDivElement;
export const ousd = document.getElementById("ousd") as HTMLDivElement;
export const filewatch = document.getElementById("startserve") as HTMLDivElement;
export const parentsize = document.getElementById("parent-size") as HTMLParagraphElement;
export const menu = document.getElementById("menu") as HTMLUListElement;


export const reload = document.getElementById("reload") as HTMLButtonElement;
export const newtab = document.getElementById("newtab") as HTMLButtonElement;



export const backButton = document.getElementById("back-button") as HTMLButtonElement;
export const nosize = document.getElementById("no-size") as HTMLButtonElement;
export const datalist = document.getElementById("path-list") as HTMLDataListElement;

// var bclose = document.querySelector(".tab-close") as HTMLSpanElement;
// var thistory: string[] = [];
// var tforward: string[] = [];
globalThis.defpath="../src/"
var lastfolder = globalThis.defpath;


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

// web app code

window.addEventListener("DOMContentLoaded", () => {
  listenforfiles();
  loadmarkdown();

  (window as any).__TAURI__.invoke(
    "list_files",
    {
      oid: globalThis.tid.toString(),
      path: globalThis.defpath,
      ff: ""
    });
    starttimer();

  document.addEventListener("contextmenu", function (e) {
    // console.log(e)
    handlerightclick(e);
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
sendlog();
watchfile();
openhtml();