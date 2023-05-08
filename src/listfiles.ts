import * as globals from './file-explorer';
import { stoptimer } from './timer';
// import {globalvars} from './global';
var foldercount:number;
export function listenforfolcount(){
  (window as any).__TAURI__.event.listen("folder-count", (data: { payload: number }) => {
    console.log("folder-count")
    
    // parentsize.innerHTML=data.payload.toString();.
    foldercount=data.payload;
    // console.log(folcount)
    // // console.log("fromhere"+data.payload.toString())
  });
  
}
export function listenforfiles(){

  

 (window as any).__TAURI__.event.listen("list-files", (data: { payload: string }) => {
  globals.ousd.style.display="none";
  globals.filewatch.style.display="none";

    globals.htmlbase.innerHTML = ""
    console.log("listfiles")
    // pathline.innerHTML != "";
  
    
  
    type File = {
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
    var arr = globals.pathInput.value.split("/"); // arr is ["a", "b", "c", "d"]
    var prefixes: string[] = [];
    var prefix = "";
    for (var i = 0; i < arr.length; i++) {
      prefix += arr[i]; // append the current element to the prefix
      prefixes.push(prefix); // add the prefix to the prefixes array
      prefix += "/"; // add a slash for the next iteration
    }
    var fols=[]
    console.log(globals.pathInput.value.split("/"))
    fols = globals.pathInput.value.split("/");
    console.log(fols.length);
    globals.pathline.replaceChildren();

    for (var i = 0; i < fols.length; i++){ 
    // fols.forEach(
      // function (fol, index) {
        let pathn = document.createElement("span");
        pathn.id="goloc"
        pathn.textContent = fols[i] + "\n";
        pathn.dataset.loc = prefixes[i];
        globals.pathline?.appendChild(pathn);
        // // console.log(index)
      }
    // );
    // parse the data as JSON
    let files: File[] = JSON.parse(data.payload);
    // // console.log("files")
    // clear the file list
    globals.fileList.innerHTML = "";
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
  
  
    let tbody = document.createElement("tbody");
    // console.log(files.length)
    let loaded = 0;

      loaded = files.length;
    var percomp = (loaded / foldercount! * 100);
    var setp = document.getElementById("myprogress") as HTMLProgressElement;
      setp.value = percomp;
    if (percomp == 100)
      setp.className = "hide"
    else
      setp.className = "show"
    // console.log("here" + percomp.toString());
  
    // // console.log(data.payload)
    // loop through the files array
    for (let file of files) {
      // create a table row element for each file
      let tr = document.createElement("tr");
      // create two table cell elements for the filename and filesize columns
      let td1 = document.createElement("td");
  
      td1.textContent = file.name;
      td1.className = "td1";
      td1.dataset.value = file.name;
      td1.dataset.name = file.name;
      td1.dataset.path = file.path;
  
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
  
  
      let td2 = document.createElement("td");
      td2.textContent = file.size.toString();
      td2.dataset.value = file.rawfs.toString();
      // append the table cells to the table row
  
      tr.appendChild(td2);
  
      let td3 = document.createElement("td");
      td3.textContent = file.lmdate.toString();
      td3.dataset.value = file.timestamp.toString();
      // td3.dataset.value = file.rawfs.toString();
      // append the table cells to the table row
  
      tr.appendChild(td3);
  
  
      // append the table row to the table body
      tbody.appendChild(tr);
    }
    // // append the table body to the table
    globals.fileList.appendChild(tbody);
  
    let order = "asc";
    // create a function to compare two values based on the order
    function compare(a: number|string, b: number|string) {
      if (order === "asc") {
        return a < b ? -1 : a > b ? 1 : 0;
      } else {
        return a > b ? -1 : a < b ? 1 : 0;
      }
    }
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
  });
  stoptimer();
}