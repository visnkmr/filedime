import * as globals from './file-explorer';
import { File, eachfile, settableandtbody } from './listfiles';
// import {globalvars} from './global';
var foldercount:number;

export function loadsearchresult(){

  

    (window as any).__TAURI__.event.listen("load-sresults", (data: { payload: string }) => {
      let fileList: File[] = JSON.parse(data.payload) as File[];

      globalThis.lastpopfilelist=fileList
      // if(globalThis.lastpopfilelist.length>10)
      // return
      if (fileList.length>100){
        return
      }
      fileList.forEach(function(ef){
        eachfile(ef)
      });

      // if(files.length===0)
      //   return
    //  globals.ousd.style.display="none";
    //  globals.filewatch.style.display="none";
   
    //    globals.htmlbase.innerHTML = ""
      //  console.log("list_search_result_files");
      //  // pathline.innerHTML != "";
      //  let tryele = document.getElementById("listoffiles");
      //  tryele?.replaceChildren();
       console.log("settingpath");
       // globals.fileList.replaceChildren()
     
       
       globalThis.lastimefilesloaded=globalThis.latestimefilesloaded;
       globals.ousd.style.display="none";
       globals.filewatch.style.display="none";
       
     // Get the element by id
    //  let element = document.getElementById("listoffiles");
    //    // Check if it exists
    //   // for (var ef in globalThis.lastpopfilelist) {
    //     // if(globalThis.lastpopfilelist[ef].name.includes(sq))
    //     {
          
    //       if (element!==null) {
    //         // if(JSON.parse(data.payload) instanceof File)

    //       // console.log(JSON.stringify(globalThis.lastpopfilelist))

    //         eachfile(onresfile);
    //         // else{
    //           // eachdrive(JSON.parse(data.payload) as DriveItem);
    //         // }
    //       } else {
    //         // console.log(JSON.stringify(globalThis.lastpopfilelist))
    //         settableandtbody();
    //       }
    //     }
      // }
  // globals.htmlbase.innerHTML = ""
  console.log("listfiles")
     
});
}

   export function searchterm(){
    (window as any).__TAURI__.event.listen("sterm", (data: { payload: string }) => {
      globals.pathline.replaceChildren();
    
    let pathn = document.createElement("span");
           pathn.textContent = data.payload+" "+globalThis.lastpopfilelist.length+" results found";
          //  pathn.dataset.loc = prefixes[i];
           globals.pathline?.appendChild(pathn);
    });
   }