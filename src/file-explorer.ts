const { invoke } = (window as any).__TAURI__.tauri;
const { listen } = (window as any).__TAURI__.event;
var folcount=0;
(window as any).__TAURI__.event.listen("folder-count", (data: { payload: number }) => {
  // parentsize.innerHTML=data.payload.toString();.
  folcount=data.payload;
  console.log(folcount)
  // console.log("fromhere"+data.payload.toString())
});
// get the elements from the HTML document
const pathInput = document.getElementById("path-input") as HTMLInputElement;
const listButton = document.getElementById("list-button") as HTMLButtonElement;
const fileList = document.getElementById("file-list") as HTMLTableElement;
const htmlbase = document.getElementById("htmlbase") as HTMLDivElement;
const parentsize = document.getElementById("parent-size") as HTMLParagraphElement;
var reload = document.getElementById("reload") as HTMLButtonElement;

// web app code
var interval:number ;
window.addEventListener("DOMContentLoaded", () => {
    (window as any).__TAURI__.invoke(
        "list_files",
        {path: "/home/roger/Downloads/github/"
      });
      

// get a reference to the back button element
const backButton = document.getElementById("back-button") as HTMLButtonElement;
var lastfolder="/home/roger/Downloads/github/"
// add a click event listener to the back button
backButton.addEventListener("click", () => {
    if(lastfolder==="")
        lastfolder="."
    pathInput.value=lastfolder
    htmlbase.innerHTML="";
  // check if there is any previous path in the history
  (window as any).__TAURI__.invoke(
    "list_files",
    {path: lastfolder
  });
});

// get a reference to the back button element
const nosize = document.getElementById("no-size") as HTMLButtonElement;
// add a click event listener to the back button
nosize.addEventListener("click", () => {
  // check if there is any previous path in the history
  (window as any).__TAURI__.invoke(
    "nosize",
    {
      path: pathInput.value
  });
});


// add an event listener to the list button
listButton.addEventListener("click", async () => {
  // get the value of the path input
  let path = pathInput.value;
  // invoke the list_files command from the backend with the path as argument
//   if((name as string).toLowerCase().endsWith(".md")){
//     // let mdext=".md";
//     // console.log(target.dataset.name)
//     // console.log(target.dataset.parent)
//     {
//         fileList.innerHTML=""
//         htmlbase.innerHTML = await (window as any).__TAURI__.invoke("loadmarkdown", { name: path });
//         // document.body.innerHTML = await window.__TAURI__.invoke("loadmarkdown", { name: path });
//         var links = document.getElementsByTagName("a"); // get all links
//         for (var i = 0; i < links.length; i++) { // loop through them
//             var link = links[i]; // get current link
//             // var href = link.getAttribute("href"); // get href attribute
//             // if (href && href.startsWith("http") && !href.includes("yourdomain")) { // check conditions
//             link.setAttribute("target", "_blank"); // set target attribute
//             // }
//         }
//     }
//     // window.__TAURI__.invoke(
//     //     "list_files",
//     //     {
//     //         path: path
//     //     }
//     //   );
//   // alert the name and path of the file
// //   alert(`You clicked on ${name} at ${path}`);
// }
// else{
//   (window as any).__TAURI__.invoke(
//     "openpath",
//     {
//         path: path
//     }
//   );
// }
  await (window as any).__TAURI__.invoke(
    "list_files",
    {path: path
  });
  pathInput.value=path
});
var loaded=0;

// add an event listener to the list button
reload.addEventListener("click", async () => {
  // get the value of the path input
  let path = pathInput.value;
  // invoke the list_files command from the backend with the path as argument
//   if((name as string).toLowerCase().endsWith(".md")){
//     // let mdext=".md";
//     // console.log(target.dataset.name)
//     // console.log(target.dataset.parent)
//     {
//         fileList.innerHTML=""
//         htmlbase.innerHTML = await (window as any).__TAURI__.invoke("loadmarkdown", { name: path });
//         // document.body.innerHTML = await window.__TAURI__.invoke("loadmarkdown", { name: path });
//         var links = document.getElementsByTagName("a"); // get all links
//         for (var i = 0; i < links.length; i++) { // loop through them
//             var link = links[i]; // get current link
//             // var href = link.getAttribute("href"); // get href attribute
//             // if (href && href.startsWith("http") && !href.includes("yourdomain")) { // check conditions
//             link.setAttribute("target", "_blank"); // set target attribute
//             // }
//         }
//     }
//     // window.__TAURI__.invoke(
//     //     "list_files",
//     //     {
//     //         path: path
//     //     }
//     //   );
//   // alert the name and path of the file
// //   alert(`You clicked on ${name} at ${path}`);
// }
// else{
//   (window as any).__TAURI__.invoke(
//     "openpath",
//     {
//         path: path
//     }
//   );
// }
  await (window as any).__TAURI__.invoke(
    "list_files",
    {path: path
  });
  // pathInput.value=path
});
// listen for the list-files event from the backend
(window as any).__TAURI__.event.listen("list-files", (data: { payload: string }) => {
  type File = {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    rawfs: number;
    lmdate:number;
    timestamp:number;
    foldercon:number;
  };
  // parse the data as JSON
  let files:File[] = JSON.parse(data.payload);
  // console.log("files")
  // clear the file list
  fileList.innerHTML = "";
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
    // set the text content of the header cells
    th1.textContent = "Filename";
    th2.textContent = "Filesize";
    th3.textContent = "Last modified";
    th1.id = "filename";
    th2.id = "filesize";
    th3.id = "lastmod";
    // append the header cells to the header row
    tr.appendChild(th1);
    tr.appendChild(th2);
    tr.appendChild(th3);
    // append the header row to the table head
    thead.appendChild(tr);
    // append the table head to the table
    fileList.appendChild(thead);

    
    let tbody = document.createElement("tbody");
    console.log(files.length)
    loaded=files.length;
    var percomp=(loaded/folcount*100);
    var setp=document.getElementById("myprogress") as HTMLProgressElement;
    setp.value=percomp;
    if(percomp==100)
      setp.className="hide"
      else
      setp.className="show"
  console.log("here"+percomp.toString());


    // console.log(data.payload)
  // loop through the files array
  for (let file of files) {
    // create a table row element for each file
    let tr = document.createElement("tr");
    // create two table cell elements for the filename and filesize columns
    let td1 = document.createElement("td");

    td1.textContent = file.name;
    td1.dataset.value = file.name;
    td1.dataset.name = file.name;
    td1.dataset.path = file.path;
    
    td1.dataset.isDir = file.is_dir.toString();
    if (file.is_dir){
      td1.id="folder"
    if (file.foldercon>0){
      td1.textContent = file.name+" ("+file.foldercon+")";
    }
    else{
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
  fileList.appendChild(tbody);

  let order = "asc";
  // create a function to compare two values based on the order
  function compare(a:number, b:number) {
    if (order === "asc") {
      return a < b ? -1 : a > b ? 1 : 0;
    } else {
      return a > b ? -1 : a < b ? 1 : 0;
    }
  }
  // create a function to sort the table rows based on the column index
  function sortTable(index:number) {
    // get the table rows as an array
    let rows = Array.from(tbody.rows);
    // sort the rows based on the cell value at the given index
    rows.sort(function (a, b) {
      if(index!==1)
      return compare(a.cells[index].dataset.value, b.cells[index].dataset.value);
      else
      return compare(parseInt(a.cells[index].dataset.value as string),parseInt(b.cells[index].dataset.value as string));
      
    });
    // append the sorted rows to the table body
    for (let row of rows) {
      tbody.appendChild(row);
    }
    // toggle the order for the next click
    order = order === "asc" ? "desc" : "asc";
  }
  let filename = document.getElementById("filename") as HTMLTableCellElement;
  let filesize = document.getElementById("filesize")as HTMLTableCellElement;
  let lastmod = document.getElementById("lastmod")as HTMLTableCellElement;
   // add a click event listener to the filename th element
   filename.addEventListener("click", function () {
    // call the sortTable function with index 0
    sortTable(0);
  });
  // add a click event listener to the filesize th element
  filesize.addEventListener("click", function () {
    // call the sortTable function with index 1
    sortTable(1);
  });
  // add a click event listener to the lastmod th element
  lastmod.addEventListener("click", function () {
    // call the sortTable function with index 1
    sortTable(2);
  });
  // // loop through the files array
  // for (let file of files) {
  //   // create a list item element for each file
  //   let li = document.createElement("li");
  //   // set the text content of the list item to the name of the file
  //   li.textContent = file.name+" "+file.size;
  //   // set the data attributes of the list item to the properties of the file
  //   li.dataset.name = file.name;
  //   li.dataset.path = file.path;
  //   li.dataset.isDir = file.is_dir.toString();
  //   if (file.is_dir){
  //     li.id="folder"
  //   }
  //   li.dataset.size = file.size.toString();
  //   // li.dataset.parent = file.parent;
  //   // li.dataset.grandparent = file.grandparent;
  //   // li.dataset.parentsize = file.parentsize.toString();
    
  //   // console.log(lastfolder)
  //   // lastpsize=file.parentsize.toString();
    
    
  //   // pathInput.value=file.parent
  //   // console.log(file.parent);
  //   // append the list item to the file list
  //   fileList.appendChild(li);
  // }
  // parentsize.innerHTML=lastpsize;
  // console.log(lastpsize)
});
// add an event listener to the file list
fileList.addEventListener("click", async (event) => {

  console.log("here")
  // get the target element of the event
  let target = event.target as HTMLElement;
  console.log(target.tagName)
  // check if the target is a list item
  if (target.tagName === "TD") {
    // get the data attributes of the target
    console.log(target.dataset)
    let name = target.dataset.name;
    let path = target.dataset.path;
    let isDir = target.dataset.isDir;
    // check if the target is a directory
    if (isDir === "true") {
      console.log("dir")
      // set the value of the path input to the path of the directory
      pathInput.value = path!;
      parentsize.innerHTML=target.dataset.parentsize!;

      // invoke the list_files command from the backend with the path as argument
      (window as any).__TAURI__.invoke(
        "list_files",
        {
            path: path
        }
      );
    } else if((name as string).toLowerCase().endsWith(".md")){
        openmarkdown(await (window as any).__TAURI__.invoke("loadmarkdown", { name: path }))
    }
    else{
      openpath(path as string);
    }
  }
});

// Get the input element
// const input = document.getElementById("path-input");

// Get the datalist element
const datalist = document.getElementById("path-list") as HTMLDataListElement;

// Add an input event listener to the input element
pathInput.addEventListener("input", async () => {
  // Get the current value of the input element
  console.log("here")
  const path = pathInput.value;
  console.log(path);

  // Invoke the Rust function with the path as an argument
  await (window as any).__TAURI__.invoke(
    "get_path_options",{
    path: path,
  })
    .then((options) => {
      console.log(options)
      // Clear the datalist options
      if(options!==null)
      {

        datalist.innerHTML = "";
  
        // Loop through the options returned by Rust
        for (const option of options) {
          // Create a new option element with the option value
          const optionElement = document.createElement("option");
          // console.log("here#1")
          optionElement.value = option;
  
          // Append the option element to the datalist element
          datalist.appendChild(optionElement);
        }
      }
    })
    .catch((error) => {
      // Handle any errors from Rust
      console.error(error);
    });
});

(window as any).__TAURI__.event.listen("load-markdown", (data: { payload: string }) => {
  openmarkdown(data.payload)
});
// notify();
// listen for the list-files event from the backend
(window as any).__TAURI__.event.listen("folder-size", (data: { payload: string }) => {
  parentsize.innerHTML=data.payload.toString();
  console.log(data.payload.toString())
});

(window as any).__TAURI__.event.listen("grandparent-loc", (data: { payload: string }) => {
  lastfolder=data.payload.toString();
  console.log(data.payload.toString())
});
(window as any).__TAURI__.event.listen("parent-loc", (data: { payload: string }) => {
  pathInput.value=data.payload.toString();
  console.log(data.payload.toString())
});

(window as any).__TAURI__.event.listen("start-timer", (data: { payload: string }) => {
  timer.className="show"
  updatetimer();
});

(window as any).__TAURI__.event.listen("stop-timer", (data: { payload: string }) => {
  timer.className="hide"
  clearInterval(interval);
});
// notify();

});

// Declare the type of the timer element
type TimerElement = HTMLElement & {
  textContent: string;
};
let timer = document.getElementById("timer") as TimerElement;
timer.className="hide"
// Declare the type of the interval variableZ
function updatetimer() {
  // Get the timer element
 

  // Set the start time
  let startTime = new Date();

  // Update the timer every second
  interval = setInterval(function () {
    // Get the current time
    let currentTime = new Date();

    // Calculate the elapsed time
    let elapsedTime = currentTime.getTime() - startTime.getTime();

    // Convert the elapsed time to minutes and seconds
    let minutes: number = Math.floor(elapsedTime / 1000 / 60);
let seconds: number = Math.floor((elapsedTime / 1000) % 60);

// Pad the minutes and seconds with leading zeros if needed
let paddedMinutes: string = minutes < 10 ? "0" + minutes : minutes.toString();
let paddedSeconds: string = seconds < 10 ? "0" + seconds : seconds.toString();

    // Display the elapsed time
    timer.textContent = paddedMinutes + ":" + paddedSeconds;
  }, 1000);
}

function notify() {
  
  // Get the popup element
  var popup = document.getElementById("popup") as HTMLDivElement;

  // Show the popup
  popup.style.display = "block";

  // Set a timeout to hide the popup
  setTimeout(function() {
      popup.style.display = "none";
  }, 5000); // 5 seconds
}

function openmarkdown(htmlfrommd:string){
  fileList.innerHTML=""
  htmlbase.innerHTML = htmlfrommd;
  // document.body.innerHTML = await window.__TAURI__.invoke("loadmarkdown", { name: path });
  var links = document.getElementsByTagName("a"); // get all links
  for (var i = 0; i < links.length; i++) { // loop through them
      var link = links[i]; // get current link
      // var href = link.getAttribute("href"); // get href attribute
      // if (href && href.startsWith("http") && !href.includes("yourdomain")) { // check conditions
      link.setAttribute("target", "_blank"); // set target attribute
      // }
  }
}
async function openpath(path:string) {
(window as any).__TAURI__.invoke(
"openpath",
{
  path: path
}
);
}
