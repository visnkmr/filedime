import * as globals from './file-explorer';

export async function getpathlist(path:string){
    await (window as any).__TAURI__.invoke(
    "get_path_options", {
    path: path,
  })
    .then((options:string) => {
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