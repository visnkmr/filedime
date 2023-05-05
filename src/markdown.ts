import * as globals from './file-explorer';

export function openmarkdown(htmlfrommd: string) {
  globals.ousd.style.display="block";
  globals.filewatch.style.display="block";

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
