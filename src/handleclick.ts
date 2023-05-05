import * as globals from './file-explorer';
import { openfile } from './openfile';
// declare var globalThis.tid:number|string
// declare var globalThis.frompath:string
export function handleclicks(e:Event){
    let target = e.target! as HTMLElement;
    if(target==globals.ousd){
      (window as any).__TAURI__.invoke(
        "openpath",
        {
          path:globalThis.frompath
        }
        );
    }
    if(target==globals.filewatch){
          globalThis.startstopfilewatchertoggle=!globalThis.startstopfilewatchertoggle;
          if(globalThis.startstopfilewatchertoggle){

            // console.log("startserve");
            (window as any).__TAURI__.invoke(
              "startserver",
              {
                pathstr:globalThis.frompath
              }
              );
          }
          // }
          // else if (target==globals.stopserve){
          // console.log("stopserve");
          else{
          (window as any).__TAURI__.invoke(
            "stopserver",
            {
              path:""
            }
          );
        }
      }
    if(target===globals.newtab){
      // get the value of the path input
    // let path = pathInput.value;
    globalThis.tid = globalThis.tid as number + 1;
    // invoke the list_files command from the backend with the path as argument
    (window as any).__TAURI__.invoke(
      "newtab",
      {
        oid: globalThis.tid.toString(),
        path: "/home/roger/Downloads/",
        ff: ""
      }
    );
    (window as any).__TAURI__.invoke(
      "load_tab",
      {
        oid: globalThis.tid.toString()
      }
    );
    }
    if(target===globals.nosize){
      (window as any).__TAURI__.invoke(
        "nosize",
        {
          id: globalThis.tid.toString(),
          path: globals.pathInput.value
        });
    }

    if(target===globals.listButton){
        openfile(target,globals.pathInput.value,globals.pathInput.value);
    }
    if (
    (target).id !== "td1" &&
    (target).parentNode !== globals.menu
  ) {
    globals.menu.style.display = "none";
  }
  //tab clicked
  if (
    ((target).parentNode!).parentNode === globals.tablist
  ) {
    globalThis.tid = (((target).parentNode! as ParentNode)as HTMLElement).id;
    // console.log("here");
    // // console.log(e.target.id);
    var pen = (target);
    if (pen.className === "tab-name") {
      // Do something when name is clicked
      // console.log("Loadtab");
      // Stop the event from bubbling up to the button element
      e.stopPropagation();
      (window as any).__TAURI__.invoke(
        "load_tab",
        {
          oid: globalThis.tid.toString()
        }
      );
    }
    else if (pen.className === "tab-close") {
      // Do something when X is clicked
      // console.log("Close");
      // Stop the event from bubbling up to the button element
      e.stopPropagation();
      (window as any).__TAURI__.invoke(
        "closetab",
        {
          id: globalThis.tid.toString()
        }
      );
    }

    // pathInput.value = (target).dataset.path!
  }
  if (
    (target).parentNode === globals.menu
  ) {
    var id = (e.target as HTMLLIElement).id;

    // Do something based on the id
    switch (id) {
      case "o1":
        // console.log("o1")
        // console.log(e)
        // Code for option 1
        break;
      case "o2":
        // console.log("o2")
        // console.log(e)
        // Code for option 2
        break;
      case "o3":
        // console.log("o3")
        // console.log(e)
        // Code for option 3
        break;
      case "o4":

        console.log(globalThis.frompath);
        (window as any).__TAURI__.invoke(
          "addmark",
          {
            path: globalThis.frompath
          }
        );
        // console.log("o3")
        // console.log(e)
        // Code for option 3
        break;
      case "o5":
        console.log(globalThis.frompath);
        (window as any).__TAURI__.invoke(
          "removemark",
          {
            path: globalThis.frompath
          }
        );
        // console.log("o3")
        // console.log(e)
        // Code for option 3
        break;
      default:
        // console.log("o4")
        // console.log(e)
        // Code for other cases
        break;
    }
    globals.menu.style.display = "none";
  }
  if (
    (target).tagName === "TD"
  ) {
      openfile(target,target.dataset.path!,target.dataset.name!)    
  }
  switch (
  e.target
  ) {
    case globals.reload:
      // console.log("reload")
      // get the value of the path input
      let path = globals.pathInput.value;
      // invoke the list_files command from the backend with the path as argument
      (window as any).__TAURI__.invoke(
        "list_files",
        {
          oid: globalThis.tid.toString(),
          path: path,
          ff: ""
        });
      break;
    case globals.backButton:
      (window as any).__TAURI__.invoke(
        "back", {
        oid: globalThis.tid.toString(),
      })
        .then((options:string) => {
          // console.log(options)
          // Clear the datalist options
          globalThis.frompath=options;
          if (options !== null) {
            (window as any).__TAURI__.invoke(
              "list_files",
              {
                oid: globalThis.tid.toString(),
                path: options,
                ff: "back"
              });
          }
        })
        .catch((error:string) => {
          // Handle any errors from Rust
          console.error(error);
        });
      // if (lastfolder === "")
      //   lastfolder = "."
      // pathInput.value = lastfolder
      // htmlbase.innerHTML = "";
      // // check if there is any previous path in the history
      // (window as any).__TAURI__.invoke(
      //   "list_files",
      //   {
      //     oid:globalThis.tid.toString(),
      //     path: lastfolder,
      //     ff:""
      //   });
      break;

  }
  if((target).id=="goloc"){
    var pathtg=(target).dataset.loc;
    globalThis.frompath=pathtg!;
    (window as any).__TAURI__.invoke(
      "list_files",
      {
        oid: globalThis.tid.toString(),
        path: pathtg,
        ff: ""
      });
  }
  if((target).className=="mark-button"){
    var gpath=(target).dataset.path;
    globalThis.tid = globalThis.tid as number + 1;
    // invoke the list_files command from the backend with the path as argument
    (window as any).__TAURI__.invoke(
      "newtab",
      {
        oid: globalThis.tid.toString(),
        path: gpath,
        ff: ""
      }
    ).await;
    (window as any).__TAURI__.invoke(
      "load_tab",
      {
        oid: globalThis.tid.toString()
      }
    ).await;
  }
}