import uio, * as globals from './file-explorer';
import { listfilteredlist } from './listfiles';

export async function getpathlist(path:string){
    await (window as any).__TAURI__.invoke(
    "get_path_options", 
    {
      windowname:uio.appWindow.label,
    path: path,
  })
    .then((options:string[]) => {
      // console.log(options)
      // Clear the datalist options
      if (options !== null) {

        globals.datalist.innerHTML = "";

        // Loop through the options returned by Rust
        for (const option of options) {
          // Create a new option element with the option value
          const optionElement = document.createElement("option");
          // // console.log("here#1")
          optionElement.value = option;

          // Append the option element to the datalist element
          globals.datalist.appendChild(optionElement);
        }
      }
    })
    .catch((error:string) => {
      // Handle any errors from Rust
      console.error(error);
    });
}

export async function searchforit(text:string){
  //   (window as any).__TAURI__.invoke(
  //   "search_try", {
  //     windowname:uio.appWindow.label,
  //     path: globals.pathInput.value,
  //     string: text
  // })
  listfilteredlist(text);
  console.log(globalThis.lastpopfilelist);
  // .error((option:any)=>{
  //   console.log(option);
  // });
    // .then((options:string) => {
    //   // console.log(options)
    //   // Clear the datalist options
    //   if (options !== null) {

    //     // globals.datalist.innerHTML = "";

    //     // // Loop through the options returned by Rust
    //     for (const option of options) {
    //       console.log(option)
    //     //   // Create a new option element with the option value
    //     //   const optionElement = document.createElement("option");
    //     //   // // console.log("here#1")
    //     //   optionElement.value = option;

    //     //   // Append the option element to the datalist element
    //     //   globals.datalist.appendChild(optionElement);
    //     }
    //   }
    // })
    // .catch((error:string) => {
    //   // Handle any errors from Rust
    //   console.error(error);
    // });
}