const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;

let greetInputEl;
let greetMsgEl;

async function loadmarkdown() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  document.body.innerHTML = await invoke("loadmarkdown", { name: "fg" });
  var links = document.getElementsByTagName("a"); // get all links
  for (var i = 0; i < links.length; i++) { // loop through them
    var link = links[i]; // get current link
    // var href = link.getAttribute("href"); // get href attribute
    // if (href && href.startsWith("http") && !href.includes("yourdomain")) { // check conditions
      link.setAttribute("target", "_blank"); // set target attribute
    // }
  }
  
}
listen('message', (event) => {
    // console.log(event.payload[0]);
    console.log(event.payload);
    // const data = event.payload;
    // let upload = data[0];
    // let download = data[1];
    // let todaytotal = data[2];
    // if (last_upload > 0) {
    //     if (upload < last_upload)
    //         upload_speed = 0;
    //     else
    //         upload_speed = upload - last_upload;
    // }
    // if (last_download > 0) {
    //     if (download < last_download)
    //         down_speed = 0;
    //     else
    //         down_speed = download - last_download;
    // }
    // last_upload = upload;
    // last_download = download;
    document.getElementById("content").innerHTML = event.payload;
});
loadmarkdown();
// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document
//     .querySelector("#greet-button")
//     .addEventListener("click", () => greet());
// });


