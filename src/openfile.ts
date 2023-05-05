import * as globals from './file-explorer';
import { openjs } from './openjs';

export function openfile(target:HTMLElement,path:string,name:string){

    // get the data attributes of the target
    // console.log(target.dataset)
    // if ((name).toLowerCase().endsWith(".js")) {
    // openjs(path!);
    // }
    // else
    {
    // invoke the list_files command from the backend with the path as argument
    (window as any).__TAURI__.invoke(
    "list_files",
    {
    oid: globalThis.tid.toString(),
    path: path,
    ff: ""
    }
    );
    }
    
    // set the value of the path input to the path of the directory
    globals.pathInput.value = path!;
    globalThis.frompath=path!;
    globals.parentsize.innerHTML = target.dataset.parentsize!;
}

export function openhtml(){
    (window as any).__TAURI__.event.listen("load-html", (data: { payload: string }) => {
        globals.ousd.style.display="block";
        globals.filewatch.style.display="block";
        // console.log("grandloc")
        let htmlcode=data.payload;
        globalThis.frompath=globals.pathInput.value;
        globals.fileList.innerHTML = ""
    globals.htmlbase.innerHTML = "";
    globals.htmlbase.innerHTML = htmlcode;

        // lastfolder = data.payload.toString();
        // console.log(data.payload.toString())
      }
    );
}