import * as globals from './file-explorer';

export function openmarkdown(htmlfrommd: string) {
    globals.fileList.innerHTML = ""
    globals.htmlbase.innerHTML = htmlfrommd;
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

  export function loadmarkdown(){
      (window as any).__TAURI__.event.listen("load-markdown", (data: { payload: string }) => {
        console.log("loadmarkdown")
        
        openmarkdown(data.payload)
      });
    
  }
