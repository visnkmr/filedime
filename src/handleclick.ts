import setsendpath from './copynpaste';
import { copyToClipboard } from './ctc';
import uio, * as globals from './file-explorer';
import { wholesearch } from './getpathoptions';
import { settableandtbody, sortby } from './listfiles';
import { loader } from './loader';
import { populateimmediatechildcount, populatesearchlist, reloadlist, reloadsize } from './menu_apis';
import { openfile } from './openfile';
import { recentfiles } from './recent_file';
import { addtab } from './tabs';
// declare var globalThis.tid:number|string
// declare var globalThis.frompath:string
export function handleclicks(e:Event){
    let target = e.target! as HTMLElement;
    if(target==globals.ousd){
      (window as any).__TAURI__.invoke(
        "openpath",
        {
          windowname:uio.appWindow.label,
          path:globalThis.frompath
        }
        );
    }
    if(target===globals.newwin){
    // invoke the list_files command from the backend with the path as argument
      (window as any).__TAURI__.invoke(
        "newwindow",
        {
          id: globalThis.tid as number + 1,
          path: "./",
          ff:""
        });
    }
    // if(target===globals.otb){
    //   console.log("clicked here");
    // // invoke the list_files command from the backend with the path as argument
    //   (window as any).__TAURI__.invoke(
    //     "otb",
    //     {
    //       path: globals.pathInput.value,
    //     }
    //     );
    // }
    if(target==globals.filewatch){
          globalThis.startstopfilewatchertoggle=!globalThis.startstopfilewatchertoggle;
          if(globalThis.startstopfilewatchertoggle){

            // console.log("startserve");
            (window as any).__TAURI__.invoke(
              "startserver",
              {
                windowname:uio.appWindow.label,
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
              windowname:uio.appWindow.label,
              path:""
            }
          );
        }
      }
    if(target===globals.newtab){
    addtab(uio.appWindow.label,"/home/roger/Downloads/");
    // (window as any).__TAURI__.invoke(
    //   "load_tab",
    //   {
    //     windowname:uio.appWindow.label,
    //     oid: globalThis.tid.toString()
    //   }
    // );
    }
    if(target===globals.nosize){
      reloadsize();
    }
    
    // if(target===globals.tsearch){
    //   populatesearchlist();
    // }
    
    if(target===globals.folcount){
      populateimmediatechildcount();
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
      globalThis.activetab=(pen.parentNode as HTMLDivElement).dataset.path!;
      // let sn = pen as HTMLSpanElement;
      // (window as any).__TAURI__.invoke(
      //   "tabname",
      //   {
      //     path:(pen.parentNode as HTMLDivElement).dataset.path!,
      //   }
      // ).then((returned:string)=>{
      //   console.log("what was returned....."+returned)
      //   sn.textContent =returned
      // });
      
      globals.tablist.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          (child as HTMLDivElement).classList.add('inactive');
          (child as HTMLDivElement).classList.remove('active');
        }
      });
      (pen.parentNode as HTMLDivElement).classList.add("active");
      (pen.parentNode as HTMLDivElement).classList.remove("inactive");

      // Do something when name is clicked
      // console.log("Loadtab");
      // Stop the event from bubbling up to the button element
      e.stopPropagation();
      
      (window as any).__TAURI__.invoke(
        "load_tab",
        {
          windowname:uio.appWindow.label,
          oid: globalThis.tid.toString()
        }
      );
      console.log("remthis----->"+uio.appWindow.label+" "+globalThis.tid.toString());
    }
    else if (pen.className === "tab-close") {
      // Do something when X is clicked
      // console.log("Close");
      // Stop the event from bubbling up to the button element
      e.stopPropagation();
      (window as any).__TAURI__.invoke(
        "closetab",
        {
        windowname:uio.appWindow.label,
          id: globalThis.tid.toString()
        }
      );
      (pen.parentNode as HTMLDivElement).remove()
    }

    // pathInput.value = (target).dataset.path!
  }
  if (
    (target).parentNode === globals.menu
  ) {
    var id = (e.target as HTMLLIElement).id;

    // Do something based on the id
    switch (id) {
      case "o7":
       
      // invoke the list_files command from the backend with the path as argument
        (window as any).__TAURI__.invoke(
          "newwindow",
          {
            id: (globalThis.tid as number + 1).toString(),
            path: globalThis.frompath,
            ff:""
          });
          // addtab()
        // console.log("o1")
        // console.log(e)
        // Code for option 1
        break;
      case "o2":
        setsendpath(globalThis.frompath)
        break;
      case "o1":
        var label=uio.getCurrent().label;
        addtab(label,globalThis.frompath);
        // console.log("live--------->"+globalThis.frompath);
        // console.log(((e.target as HTMLElement).parentNode! as HTMLElement).parentNode);
      // console.log("o1")
      // console.log(e)
      // Code for option 1
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
        windowname:uio.appWindow.label,
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
        windowname:uio.appWindow.label,
            path: globalThis.frompath
          }
        );
        // console.log("o3")
        // console.log(e)
        // Code for option 3
        break;
      case "o6":
        copyToClipboard(globalThis.frompath);
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
    (target).tagName === "TD" || (e.target as HTMLElement).className=="td1"
  ) {
    let clicksource=target.parentNode as HTMLTableRowElement;
    // console.log("tryopen--------->"+JSON.stringify(target.parentNode.dataset))
      openfile(clicksource,clicksource.dataset.path!,clicksource.dataset.name!)     
  }
  switch (
  e.target
  ) {
    case globals.recent:
      recentfiles();
      break;
    case document.getElementById("wholesearch") as HTMLButtonElement:
      wholesearch(globals.searchInput.value);
      break;
    case globals.reload:
      reloadlist();
      break;
    case globals.sth:
      isdark=!isdark
      var elements = document.querySelectorAll('*');
      elements.forEach(function(element) {
        if(isdark){

          (element as HTMLElement).style.color="white";
          (element as HTMLElement).style.backgroundColor="black";
        }
        else{
          (element as HTMLElement).style.color="black";
          (element as HTMLElement).style.backgroundColor="white";
        }
      });
      break;
    case globals.namesort:
      sortby("name");
      if(order=="asc"){
        globals.namesort.textContent="Name (Z-A)"
      }
      else{
        globals.namesort.textContent="Name (A-Z)"
      }
      // globals.namesort.textContent="Name"
      globals.sizesort.textContent="Size"
      globals.datesort.textContent="Date"
      globals.ftypesort.textContent="Filetype"
      break; 
    case globals.sizesort:
      sortby("size");
      if(order=="asc"){
        globals.sizesort.textContent="Size (1-0)"
      }
      else{
        globals.sizesort.textContent="Size (0-1)"
      }
      globals.namesort.textContent="Name"
      // globals.sizesort.textContent="Size"
      globals.datesort.textContent="Date"
      globals.ftypesort.textContent="Filetype"
      break;
    case globals.datesort:
      sortby("date");
      if(order=="asc"){
        globals.datesort.textContent="Date (Old-New)"
      }
      else{
        globals.datesort.textContent="Date (New-Old)"
      }
      globals.namesort.textContent="Name"
      globals.sizesort.textContent="Size"
      // globals.datesort.textContent="Date"
      globals.ftypesort.textContent="Filetype"
      break; 
    case globals.sl:
      globalThis.isthumbnail=!globalThis.isthumbnail;
      reloadlist();
      break;
    case globals.ftypesort:
      sortby("ftype");
      if(order=="asc"){
        globals.ftypesort.textContent="Filetype (Z-A)"
      }
      else{
        globals.ftypesort.textContent="Filetype (A-Z)"
      }
      globals.namesort.textContent="Name"
      globals.sizesort.textContent="Size"
      globals.datesort.textContent="Date"
      // globals.ftypesort.textContent="Filetype"
      break; 
    case globals.backButton:
      (window as any).__TAURI__.invoke(
        "backbutton", 
        {
        windowname:uio.appWindow.label,
          oid: globalThis.tid.toString(),
        }
      )
      .then((options:string) => {
        // console.log(options)
        // Clear the datalist options
        globalThis.frompath=options;
        if (options !== null) {
          (window as any).__TAURI__.invoke(
            "list_files",
            {
        windowname:uio.appWindow.label,
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
        windowname:uio.appWindow.label,
        oid: globalThis.tid.toString(),
        path: pathtg,
        ff: ""
      })
      // globals.loader.hidden=false
  }
  if((target).className=="mark-button"){
    var gpath=(target).dataset.path!;
    addtab(uio.appWindow.label,gpath);
    // (window as any).__TAURI__.invoke(
    //   "load_tab",
    //   {
    //     windowname:uio.appWindow.label,
    //     oid: globalThis.tid.toString()
    //   }
    // ).await;
  }
}