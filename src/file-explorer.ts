const { invoke } = (window as any).__TAURI__.tauri;
const { listen } = (window as any).__TAURI__.event;


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

// get the elements from the HTML document
const pathInput = document.getElementById("path-input") as HTMLInputElement;
const listButton = document.getElementById("list-button") as HTMLButtonElement;
const fileList = document.getElementById("file-list") as HTMLUListElement;
const htmlbase = document.getElementById("htmlbase") as HTMLDivElement;
const parentsize = document.getElementById("parent-size") as HTMLParagraphElement;

// add an event listener to the list button
listButton.addEventListener("click", async () => {
  // get the value of the path input
  let path = pathInput.value;
  // invoke the list_files command from the backend with the path as argument
  await (window as any).__TAURI__.invoke(
    "list_files",
    {path: path
  });
  pathInput.value=path
});

// add an event listener to the file list
fileList.addEventListener("click", async (event) => {
  // get the target element of the event
  let target = event.target as HTMLElement;
  parentsize.innerHTML=target.dataset.parentsize!;
  // check if the target is a list item
  if (target.tagName === "LI") {
    // get the data attributes of the target
    let name = target.dataset.name;
    let path = target.dataset.path;
    let isDir = target.dataset.isDir;
    // check if the target is a directory
    if (isDir === "true") {
      // set the value of the path input to the path of the directory
      pathInput.value = path!;
      // invoke the list_files command from the backend with the path as argument
      (window as any).__TAURI__.invoke(
        "list_files",
        {
            path: path
        }
      );
    } else {
        let mdext=".md";
        console.log(target.dataset.name)
        console.log(target.dataset.parent)
        if(name!.includes(mdext)){
            fileList.innerHTML=""
            htmlbase.innerHTML = await (window as any).__TAURI__.invoke("loadmarkdown", { name: path });
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

// Get the input element
// const input = document.getElementById("path-input");

// Get the datalist element
const datalist = document.getElementById("path-list");

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
          console.log("here#1")
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

// listen for the list-files event from the backend
(window as any).__TAURI__.event.listen("list-files", (data: { payload: string }) => {
  type File = {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
  };
    console.log(data.payload)
  // parse the data as JSON
  let files:File[] = JSON.parse(data.payload);
  // clear the file list
  fileList.innerHTML = "";
  // var lastpsize=""
  // loop through the files array
  for (let file of files) {
    // create a list item element for each file
    let li = document.createElement("li");
    // set the text content of the list item to the name of the file
    li.textContent = file.name+" "+file.size;
    // set the data attributes of the list item to the properties of the file
    li.dataset.name = file.name;
    li.dataset.path = file.path;
    li.dataset.isDir = file.is_dir.toString();
    if (file.is_dir){
      li.id="folder"
    }
    li.dataset.size = file.size.toString();
    // li.dataset.parent = file.parent;
    // li.dataset.grandparent = file.grandparent;
    // li.dataset.parentsize = file.parentsize.toString();
    
    // console.log(lastfolder)
    // lastpsize=file.parentsize.toString();
    
    
    // pathInput.value=file.parent
    // console.log(file.parent);
    // append the list item to the file list
    fileList.appendChild(li);
  }
  // parentsize.innerHTML=lastpsize;
  // console.log(lastpsize)
});
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
  updatetimer();
});

(window as any).__TAURI__.event.listen("stop-timer", (data: { payload: string }) => {
  clearInterval(interval);
});

});

// Declare the type of the timer element
type TimerElement = HTMLElement & {
  textContent: string;
};

// Declare the type of the interval variableZ
function updatetimer() {
  // Get the timer element
  let timer = document.getElementById("timer") as TimerElement;

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