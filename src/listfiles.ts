import * as globals from './file-explorer';
import { recentfiles } from './recent_file';
import { stoptmr } from './timer';
// export const { WebviewWindow } = (window as any).__TAURI__.window;
// import {globalvars} from './global';
var foldercount:number;
export function listenforfolcount(){
  (window as any).__TAURI__.event.listen("folder-count", (data: { payload: number }) => {
    console.log("folder-count")
    
    // parentsize.innerHTML=data.payload.toString();.
    globalThis.total=data.payload;
    // console.log(folcount)
    // // console.log("fromhere"+data.payload.toString())
  });
  
}
export type File = {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  rawfs: number;
  lmdate: number;
  timestamp: number;
  foldercon: number;
  ftype: string;
};
type DriveItem = {
  name: string,
  mount_point: string,
  total: string,
  free: string,
  is_removable: boolean,
  disk_type: string,
  file_system: string,
}
export function listfilteredlist(sq:string){
  // settableandtbody();
  let tryele = document.getElementById("listoffiles");
  tryele?.replaceChildren();
  console.log("settingpath");
  // globals.fileList.replaceChildren()

  
  globalThis.lastimefilesloaded=globalThis.latestimefilesloaded;
  globals.ousd.style.display="none";
  globals.filewatch.style.display="none";
// Get the element by id

// Check if it exists
let filteredFilesList = globalThis.lastpopfilelist.filter(function (el) {
  return el.name.includes(sq) || el.path.includes(sq);
}
);
filteredFilesList.forEach(
  function(eachdime,index){
    if(index>10)
    return
    eachfile(eachdime);
  }
)
// for (var ef in filteredFilesList) {
//     // if(globalThis.lastpopfilelist[ef].name.includes(sq)){
      
//         // if(JSON.parse(data.payload) instanceof File)
  
//       // console.log(JSON.stringify(globalThis.lastpopfilelist))

//         eachfile(filteredFilesList[ef]);
//         // else{
//           // eachdrive(JSON.parse(data.payload) as DriveItem);
//         // }
//     // }
//   }
    // globals.htmlbase.innerHTML = ""
    console.log("listfiles")
}
export async function listenforfiles(){
  console.log("here")
  globalThis.lastpopfilelist=[];

  let nooftimes=0;
  globalThis.lastimefilesloaded=await globals.invoke('get_timestamp');

 (window as any).__TAURI__.event.listen("list-files", async (data: { payload: string }) => {

  setautocompletepath();
  console.log("settingpath");

  globalThis.latestimefilesloaded=await globals.invoke('get_timestamp');

  if(globalThis.latestimefilesloaded-globalThis.lastimefilesloaded>120){
    // globals.loader.hidden=true;
    nooftimes+=1;
    if(nooftimes>2){
      stoptmr();
      nooftimes=0;
    }
  }
  globalThis.lastimefilesloaded=globalThis.latestimefilesloaded;
  globals.ousd.style.display="none";
  globals.filewatch.style.display="none";
// Get the element by id
let element = document.getElementById("listoffiles");

globalThis.lastpopfilelist.push(JSON.parse(data.payload) as File)
if(globalThis.lastpopfilelist.length>10)
return
// Check if it exists
if (element!==null) {
  // if(JSON.parse(data.payload) instanceof File)
  // console.log(JSON.stringify(globalThis.lastpopfilelist))

    eachfile(JSON.parse(data.payload) as File);
    // else{
      // eachdrive(JSON.parse(data.payload) as DriveItem);
    // }
} else {
  // globalThis.lastpopfilelist=[];
  // console.log(JSON.stringify(globalThis.lastpopfilelist))
  settableandtbody();
}
    // globals.htmlbase.innerHTML = ""
    console.log("listfiles")
    // pathline.innerHTML != "";
  
    // );
    // parse the data as JSON
    // let files: File[] = JSON.parse(data.payload) as File[];
    // globalThis.loaded=files.length;
    // // console.log("files")
    // clear the file list
    
  });
  
}
export function listenfordrives(){
  // console.log("listdrives")
  let nooftimes=0;
  // globalThis.lastimefilesloaded=await globals.invoke('get_timestamp');

 (window as any).__TAURI__.event.listen("list-drives", async (data: { payload: string }) => {
  console.log("settingpath");

  globalThis.latestimefilesloaded=await globals.invoke('get_timestamp');

  if(globalThis.latestimefilesloaded-globalThis.lastimefilesloaded>120){
    // globals.loader.hidden=true;
    nooftimes+=1;
    if(nooftimes>2){
      stoptmr();
      nooftimes=0;
    }
  }
  globalThis.lastimefilesloaded=globalThis.latestimefilesloaded;
  globals.ousd.style.display="none";
  globals.filewatch.style.display="none";
  setdrivetableandtbody();
// Get the element by id
let element = document.getElementById("listoffiles");

// Check if it exists
if (element!==null) {
  // if(JSON.parse(data.payload) instanceof File)
  for (let ed of JSON.parse(data.payload) as DriveItem[]) {
    eachdrive(ed);
  }
  
    // else{
      // eachdrive(JSON.parse(data.payload) as DriveItem);
    // }
} else {
  settableandtbody();
}
    // globals.htmlbase.innerHTML = ""
    console.log("listfiles")
    // pathline.innerHTML != "";
  
    // );
    // parse the data as JSON
    // let files: File[] = JSON.parse(data.payload) as File[];
    // globalThis.loaded=files.length;
    // // console.log("files")
    // clear the file list
    
  });
  
}
// const getWindowLabel = async () => {
//   const label = await globals.invoke('get_window_label')
//   console.log("-------->"+label) // prints the label of the Tauri window
// }
function eachdrive(drive:DriveItem){
  console.log(drive)
  let tbody=document.getElementById("listoffiles") as HTMLTableElement;
  // create a table row element for each file
  let tr = document.createElement("tr");
  tr.dataset.value = drive.name;
  tr.dataset.name = drive.mount_point;
  tr.dataset.path = drive.mount_point;
  // create two table cell elements for the filename and filesize columns
  let td1 = document.createElement("td");

  td1.textContent = drive.mount_point;
  td1.className = "td1";

  // td1.dataset.isDir = drive.is_removable.toString();
  if (!drive.is_removable) {
    td1.id = "folder"
    
  }
  td1.dataset.size = drive.total.toString();
  tr.appendChild(td1);


  let td4 = document.createElement("td");
  td4.textContent = drive.file_system;
  td4.dataset.value = drive.file_system;
  // append the table cells to the table row

  tr.appendChild(td4);


  
  // if(file.ftype==="Folder" && file.size.toString()===""){

  //   let calcsbutton=document.createElement("button");
  //   calcsbutton.textContent="FS"
  //   calcsbutton.onclick= function () {
  //     (window as any).__TAURI__.invoke(
  //       "foldersize",
  //       {

  //         path: file.path,
  //       }
  //       ).then(
  //         (size:string)=>{calcsbutton.textContent=size}
  //       );
  //   }
  // tr.appendChild(calcsbutton);
  // }
  // else
  // {

    let td2 = document.createElement("td");
    td2.textContent = drive.total.toString();
    td2.dataset.value = drive.total.toString();
    // append the table cells to the table row

    tr.appendChild(td2);

  // }
  let td3 = document.createElement("td");
  td3.textContent = drive.free.toString();
  td3.dataset.value = drive.free.toString();

  tr.appendChild(td3);
  tbody.appendChild(tr);
  // settableheaderandsort();
}
export function eachfile(file:File){
  // console.log(file)
  let tbody=document.getElementById("listoffiles") as HTMLTableElement;
  // create a table row element for each file
  let tr = document.createElement("tr");
  // create two table cell elements for the filename and filesize columns
  tr.dataset.value = file.name;
  tr.dataset.name = file.name;
  tr.dataset.path = file.path;
  let td1 = document.createElement("td");

  td1.textContent = file.name;
  td1.className = "td1";

  td1.dataset.isDir = file.is_dir.toString();
  if (file.is_dir) {
    td1.id = "folder"
    if (file.foldercon > 0) {
      td1.textContent = file.name + " (" + file.foldercon + ")";
    }
    else {
      td1.textContent = file.name;

    }
  }
  td1.dataset.size = file.size.toString();
  // create an anchor element for the filename
  // let a = document.createElement("a");
  // // set the text content of the anchor element to the name of the file
  // a.textContent = file.name;
  // // set the href attribute of the anchor element to google.com/filename
  // a.href = "https://google.com/" + file.name;
  // // append the anchor element to the first table cell
  // td1.appendChild(a);
  // set the text content of the second table cell to the size of the file
  tr.appendChild(td1);

  // Add a listener for the contextmenu event
  // td1.addEventListener("contextmenu", function (e) {
  //   // Prevent the default menu from showing up
  //   e.preventDefault();
  //   frompath=(e.target as HTMLElement).dataset.path as string;

  //   // Show the custom menu
  //   menu.style.display = "block";

  //   // Position the menu according to the mouse coordinates
  //   menu.style.left = e.pageX + "px";
  //   menu.style.top = e.pageY + "px";
  // });


  let td4 = document.createElement("td");
  td4.textContent = file.ftype;
  td4.dataset.value = file.ftype;
  // append the table cells to the table row

  tr.appendChild(td4);


  
  if(file.ftype==="Folder" && file.size.toString()===""){

    let calcsbutton=document.createElement("button");
    calcsbutton.textContent="FS"
    calcsbutton.onclick= function () {
      (window as any).__TAURI__.invoke(
        "foldersize",
        {

          path: file.path,
        }
        ).then(
          (size:string)=>{calcsbutton.textContent=size}
        );
    }
  tr.appendChild(calcsbutton);
  }
  else{

    let td2 = document.createElement("td");
    td2.textContent = file.size.toString();
    td2.dataset.value = file.rawfs.toString();
    // append the table cells to the table row

    tr.appendChild(td2);

  }
  let td3 = document.createElement("td");
  td3.textContent = file.lmdate.toString();
  td3.dataset.value = file.timestamp.toString();
  // td3.dataset.value = file.rawfs.toString();
  // append the table cells to the table row

  tr.appendChild(td3);
  tbody.appendChild(tr);
  settableheaderandsort();
}

//add table head
export function addtablehead(){
  // var lastpsize=""
    // get the table element by its id
    // let table = document.getElementById("file-list");
    // create a table head element and a table body element
    let thead = document.createElement("thead");
  
    // create a table row element for the header
    let tr = document.createElement("tr");
    // create two table header cells for the filename and filesize columns
    let th1 = document.createElement("th");
    let th2 = document.createElement("th");
    let th3 = document.createElement("th");
    let th4 = document.createElement("th");
    // set the text content of the header cells
    th1.textContent = "Filename";
    th2.textContent = "Filesize";
    th3.textContent = "Last modified";
    th4.textContent = "File type (LOC)";
    th1.id = "filename";
    th2.id = "filesize";
    th3.id = "lastmod";
    th4.id = "ftype";
    // append the header cells to the header row
    tr.appendChild(th1);
    tr.appendChild(th4);
    tr.appendChild(th2);
    tr.appendChild(th3);
    // append the header row to the table head
    thead.appendChild(tr);
    // append the table head to the table
    globals.fileList.appendChild(thead);
}
export function adddrivestablehead(){
  // var lastpsize=""
    // get the table element by its id
    // let table = document.getElementById("file-list");
    // create a table head element and a table body element
    let thead = document.createElement("thead");
  
    // create a table row element for the header
    let tr = document.createElement("tr");
    // create two table header cells for the filename and filesize columns
    let th1 = document.createElement("th");
    let th2 = document.createElement("th");
    let th3 = document.createElement("th");
    let th4 = document.createElement("th");
    // set the text content of the header cells
    th1.textContent = "Filename";
    th2.textContent = "Total Diskspace";
    th3.textContent = "Filesystem";
    th4.textContent = "Free DiskSpace";
    // th1.id = "filename";
    // th2.id = "filesize";
    // th3.id = "lastmod";
    // th4.id = "ftype";
    // append the header cells to the header row
    tr.appendChild(th1);
    tr.appendChild(th4);
    tr.appendChild(th2);
    tr.appendChild(th3);
    // append the header row to the table head
    thead.appendChild(tr);
    // append the table head to the table
    globals.fileList.appendChild(thead);
}

//init detail list
export function settableandtbody(){
  globalThis.lastpopfilelist=[];

  globals.fileList.replaceChildren();
    addtablehead();
  
  
    let tbody = document.createElement("tbody");
    tbody.id="listoffiles"
    globals.fileList.appendChild(tbody);
}
export function setdrivetableandtbody(){
  globals.fileList.replaceChildren();
    adddrivestablehead();
  
  
    let tbody = document.createElement("tbody");
    tbody.id="listoffiles"
    globals.fileList.appendChild(tbody);
}

export function settableheaderandsort(){
  let order = "asc";
    // create a function to compare two values based on the order
    function compare(a: number|string, b: number|string) {
      if (order === "asc") {
        return a < b ? -1 : a > b ? 1 : 0;
      } else {
        return a > b ? -1 : a < b ? 1 : 0;
      }
    }
    let tbody=document.getElementById("listoffiles") as HTMLTableElement;
    // create a function to sort the table rows based on the column index
    function sortTable(index: number) {
      // get the table rows as an array
      let rows = Array.from(tbody.rows);
      // sort the rows based on the cell value at the given index
      rows.sort(function (a, b) {
        if (index !== 2){
          return compare(String(a.cells[index].dataset.value), String(b.cells[index].dataset.value));
        }
        else
          return compare(parseInt(a.cells[index].dataset.value as string), parseInt(b.cells[index].dataset.value as string));
  
      });
      // append the sorted rows to the table body
      for (let row of rows) {
        tbody.appendChild(row);
      }
      // toggle the order for the next click
      order = order === "asc" ? "desc" : "asc";
    }
    let filename = document.getElementById("filename") as HTMLTableCellElement;
    let filesize = document.getElementById("filesize") as HTMLTableCellElement;
    let lastmod = document.getElementById("lastmod") as HTMLTableCellElement;
    let ftype = document.getElementById("ftype") as HTMLTableCellElement;
    // add a click event listener to the filename th element
    filename.addEventListener("click", function () {
      // call the sortTable function with index 0
      sortTable(0);
    });
    // add a click event listener to the filesize th element
    filesize.addEventListener("click", function () {
      // call the sortTable function with index 1
      sortTable(2);
    });
    // add a click event listener to the lastmod th element
    lastmod.addEventListener("click", function () {
      // call the sortTable function with index 1
      sortTable(3);
    });
  
    ftype.addEventListener("click", function () {
      // call the sortTable function with index 1
      sortTable(1);
    });
}

function setautocompletepath() {
  let splitat=  /[\\/]/;
  var arr = globals.pathInput.value.split(splitat); // arr is ["a", "b", "c", "d"]
  var prefixes: string[] = [];
  var prefix = "";
  for (var i = 0; i < arr.length; i++) {
    prefix += arr[i]; // append the current element to the prefix
    prefixes.push(prefix); // add the prefix to the prefixes array
    prefix += "/"; // add a slash for the next iteration
  }
  var fols=[]
  console.log(globals.pathInput.value.split(splitat))
  fols = globals.pathInput.value.split(splitat);
  console.log(fols.length);
  globals.pathline.replaceChildren();

  for (var i = 0; i < fols.length; i++){ 
  // fols.forEach(
    // function (fol, index) {
      let pathn = document.createElement("span");
      pathn.id="goloc"
      pathn.textContent = fols[i]   + "\n";
      pathn.dataset.loc = prefixes[i];
      globals.pathline?.appendChild(pathn);
      // // console.log(index)
    }
}
