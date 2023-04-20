const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;


// web app code

window.addEventListener("DOMContentLoaded", () => {
    window.__TAURI__.invoke(
        "list_files",
        {path: "/home/roger/Downloads/github/"
      });

// get a reference to the back button element
const backButton = document.getElementById("back-button");
lastfolder="/home/roger/Downloads/github/"
// add a click event listener to the back button
backButton.addEventListener("click", () => {
    if(lastfolder==="")
        lastfolder="."
    pathInput.value=lastfolder
    htmlbase.innerHTML=""
  // check if there is any previous path in the history
  window.__TAURI__.invoke(
    "list_files",
    {path: lastfolder
  });
});

// get the elements from the HTML document
const pathInput = document.getElementById("path-input");
const listButton = document.getElementById("list-button");
const fileList = document.getElementById("file-list");
const htmlbase = document.getElementById("htmlbase");
const parentsize = document.getElementById("parent-size");

// add an event listener to the list button
listButton.addEventListener("click", async () => {
  // get the value of the path input
  let path = pathInput.value;
  // invoke the list_files command from the backend with the path as argument
  await window.__TAURI__.invoke(
    "list_files",
    {path: path
  });
  pathInput.value=path
});

// add an event listener to the file list
fileList.addEventListener("click", async (event) => {
  // get the target element of the event
  let target = event.target;
  parentsize.innerHTML=target.dataset.parentsize;
  // check if the target is a list item
  if (target.tagName === "LI") {
    // get the data attributes of the target
    let name = target.dataset.name;
    let path = target.dataset.path;
    let isDir = target.dataset.isDir;
    // check if the target is a directory
    if (isDir === "true") {
      // set the value of the path input to the path of the directory
      pathInput.value = path;
      // invoke the list_files command from the backend with the path as argument
      window.__TAURI__.invoke(
        "list_files",
        {
            path: path
        }
      );
    } else {
        let mdext=".md";
        console.log(target.dataset.name)
        console.log(target.dataset.parent)
        if(name.includes(mdext)){
            fileList.innerHTML=""
            htmlbase.innerHTML = await window.__TAURI__.invoke("loadmarkdown", { name: path });
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
        // window.__TAURI__.invoke(
        //     "list_files",
        //     {
        //         path: path
        //     }
        //   );
      // alert the name and path of the file
    //   alert(`You clicked on ${name} at ${path}`);
    }
  }
});

// listen for the list-files event from the backend
window.__TAURI__.event.listen("list-files", (data) => {
    
    console.log(data.payload)
  // parse the data as JSON
  let files = JSON.parse(data.payload);
  // clear the file list
  fileList.innerHTML = "";
  // loop through the files array
  for (let file of files) {
    // create a list item element for each file
    let li = document.createElement("li");
    // set the text content of the list item to the name of the file
    li.textContent = file.name+" "+file.size;
    // set the data attributes of the list item to the properties of the file
    li.dataset.name = file.name;
    li.dataset.path = file.path;
    li.dataset.isDir = file.is_dir;
    li.dataset.size = file.size;
    li.dataset.parent = file.parent;
    li.dataset.grandparent = file.grandparent;
    li.dataset.parentsize = file.parentsize;
    lastfolder=file.grandparent;
    // console.log(lastfolder)
    parentsize.innerHTML=file.parentsize;
    pathInput.value=file.parent
    // pathInput.value=file.parent
    // console.log(file.parent);
    // append the list item to the file list
    fileList.appendChild(li);
  }
});
});