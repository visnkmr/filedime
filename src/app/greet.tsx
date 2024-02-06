'use client'

import FRc from "../components/findsizecomp"
import { useEffect, useMemo, useRef, useState } from 'react';
import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'
import {VideoComponent} from "./videoplaycomp"
import {ForwardIcon, ArrowLeft, SearchIcon, ArrowRightIcon, PlusIcon, XIcon, LayoutGrid, LayoutList, RefreshCcwIcon, HardDriveIcon, RulerIcon, FolderTreeIcon, FolderClockIcon, LogInIcon, EyeIcon, FileIcon, TerminalIcon, CodeIcon, BookIcon, TreesIcon, ScanSearchIcon, GalleryThumbnailsIcon, MoonIcon, SunIcon} from "lucide-react"
import { Badge } from "../components/ui/badge"
import {Checkbox} from "../components/ui/checkbox"
import '../styles/globals.css'
import ReadFileComp, { IMAGE_TYPES, MARKDOWN_TYPES, PLAIN_TEXT, VIDEO_TYPES } from "./readfile"
import Dupelist from "./ad"
// import parse from 'html-react-parser';
// import {appWindow as appWindow2} from "@tauri-apps/api/window"
// import { platform } from '@tauri-apps/api/os'
import React from 'react';
// import { window as uio } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
// import {columns} from "../src/components/columns"
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "../components/ui/popover"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../components/ui/resizeable"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../components/ui/context-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card"
export interface  operationfileinfo{
  sourcepath:String,
  destpath:String,
  existingfilesize:String,
  existingdate:String,
  srcfilesize:String,
  srcfiledate:String,
  replace:boolean
}
interface existingfileinfo{
  sourcepath:String,
  destpath:String,
  existingfilesize:String,
  existingdate:String,
  srcfilesize:String,
  srcfiledate:String
}
// import Link from "next/link"
import { CardContent, Card, CardDescription } from "../components/ui/card"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { FileItem,DriveItem } from "../shared/types"
import { DataTable, focuscolor, hovercolor } from '../src/components/data-table';
export function converttstodt(ts){

  const dateTime = DateTime.fromMillis(ts * 1000); // Convert timestamp to DateTime object
  const utcDateTime = dateTime.toUTC(); // Convert DateTime object to UTC time
  const utcTime = utcDateTime.toFormat('dd MMM yy'); 
  return utcTime
 }
type tabinfo = {
  id: number,
  path: string,
  ff: string,
  tabname: string,
  history:string[]
};
type mark = {
  path:string,
  name:string,
  is_dir:string
};
interface wininfo{
  winname:string,
  tablist:tabinfo[],
  tabidsalloted:number
}

import {  ColumnDef } from '@tanstack/react-table';
import {  ArrowUpDown } from 'lucide-react';

import { DateTime } from 'luxon';
// import LetterClamp from '../../src/components/letterclamp';
import '../styles/committablestyle.css'
import { table } from "console";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem } from "../components/ui/dropdown-menu";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Input } from "../components/ui/input";
import { escape } from "lodash";
import { useTheme } from "next-themes";


// const columns: ColumnDef<eCommit>[] = metadata.map((attribute) => {
// 	return columnHelper.accessor(attribute.id, {
// 		header: attribute.label,
// 		cell: (info) => {
// 			const value = info.getValue();

// 			if (value instanceof Date) {
// 				return value.toUTCString();
// 			}

// 			return value;
// 		},
// 		footer: attribute.label,
// 	});
// });
export let scrollorauto="auto";
export let setcolorpertheme="bg-white dark:bg-gray-800"
export default function Greet() {
  const { theme, setTheme } = useTheme()
  async function setupAppWindow() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow
    console.log("windowname top---------->"+appWindow.label)

    setAppWindow(appWindow)
  }

  useEffect(() => {
    setupAppWindow()
    
    // console.log("windowname---------->"+winInfo.winname)
    // openTab("drives://")
  }, []) 
  const filesobjinit:FileItem[]=[]
  const objinit:string[]=[]
  const driveobjinit:DriveItem[]=[]
  const pathsplitobjinit:pathsplit[]=[]
  const [pathsplitlist, setpsplitl] = useState(pathsplitobjinit);
  const [driveslist, setdriveslist] = useState(driveobjinit);
  const [activetabid,setactivetabid]=useState(0)
  const [listlimit,setll]=useState(true)
  const [isgrid,setig]=useState(false)
  const [startstopfilewatch,setstartstopfilewatch]=useState(false)
  const [watchbuttonvisibility,setwbv]=useState(false)
  const [filecount, setfc] = useState(0);
  const [noofpages,setnop]=useState(1);
  const [currentpage,setpageno]=useState(0)
  const [perpage,setperpage]=useState(15)
  useMemo(()=>{
    setnop(Math.ceil(filecount/perpage))
  },[filecount])
  
  const [tablist,settbl]=useState<tabinfo[]>()
  const [bookmarks,setbms]=useState<mark[]>()
  const [path, setpath] = useState("drives://");
  const [pathitype, setpit] = useState("drives://");
  const [searchstring,setss] = useState("");
  const [fileopsrc,setfos] = useState(objinit);
  let srclist=JSON.stringify(fileopsrc);
  // useEffect(()=>{
  //  srclist= JSON.stringify(fileopsrc)
  // },[fileopsrc])
  const [fileopdest,setfod] = useState("");
  const [parentsize,setps] = useState("");
  const [sampletext,sst]=useState("")
  const [filesetcollectionlist,setfscl]=useState(objinit)
  const [custombuttonlist,setcbl]=useState(objinit)
  // const [pathinput,spi]=useState("")
  const [pathsuggestlist,setpsl]=useState(objinit)
  const [appWindow, setAppWindow] = useState()
  // let wininfo: wininfo = {
  //   winname: appWindow?.label,
  //   winname: appWindow?.label,
  //   tablist: [],
  //   tabidsalloted: 0
  //  };
  //  const [winInfo,setwi]= useState(wininfo)
  // const [history,sethistory]=useState(objinit)
  const [fileslist, setfileslist] = useState(filesobjinit);
  const [sftype,setsftype]=useState("all")

  useMemo(()=>{
    let filestocount=fileslist.filter(function (el) {
      return (searchstring.trim().length>0?
        el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.path.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()):((sftype.trim().length>0?
        (el.ftype===sftype || sftype ==="all"):(true))))
     }).length;
    !!filestocount && perpage && setnop(Math.ceil(filestocount/perpage))
    // !!fileslist && setfileslist((old)=>{
    //   return [...old]
    // })
    setpageno((old)=>{
      console.error(old+"---"+noofpages)
     return old>noofpages?(noofpages-1):(old)
    })
  },[perpage,sftype])
  const [isSheetOpen, setiso] = useState(false);
  // const [backpressed,setbackpressed]=useState(false)
  

  // function openTab(tabPath: string): void {
  //   let temptab=winInfo.tabidsalloted++;
  //   let newTab: tabinfo = {
  //     tabid: temptab,
  //     tabpath: tabPath,
  //     history: []
  //   };
  //   winInfo.tablist.push(newTab);
  //   invoke('list_files', { 
  //     windowname:winInfo.winname,
  //     oid: temptab.toString(),
  //     path: tabPath,
  //     ff: "" 
  // })
  //  }
  //  function navigateToNewPath(tabid: number, newPath: string,oldpath:string): void {
  //   let tabIndex = winInfo.tablist.findIndex(tab => tab.tabid === tabid);
  //   if (tabIndex !== -1 && !backpressed) {
  //     winInfo.tablist[tabIndex].tabpath = newPath;
  //     winInfo.tablist[tabIndex].history.push(oldpath);
  //   }
  //   setbackpressed(false)
  //  }
  //  function closeTab(tabid: number): void {
  //   let tabIndex = winInfo.tablist.findIndex(tab => tab.tabid === tabid);
  //   if (tabIndex !== -1) {
  //    winInfo.tablist.splice(tabIndex, 1);
  //   }
  //  } 
  function reset(p?:string){
    if(p){
      setpath(p);
      setpsplitl(splitpath(p))
      // sst(p)
    }
    setsftype("all")
      setfileslist([])
      // setdriveslist([])
      setfc(0)
      setss("")
      console.log("reset done")
  }
   function activateTab(tab: tabinfo){
    console.log("activating"+JSON.stringify(tab))
    // console.log("activate tab "+tabid)
    // let activeTab = tablist.find(tab => tab.id === tabid );
    // if (activeTab) {
      // setpath(tab.path)s
      setactivetabid(tab.id)
      reset(tab.path)
      // invoke(
      //   "load_tab",
      //   {
      //     windowname:appWindow?.label,
      //     oid: tab.id.toString()
      //   }
      // );
      invoke('list_files', { 
        windowname:appWindow?.label,
        oid: tab.id.toString(),
        path: tab.path,
        ff: "" 
    })
    // }
  //  }
  //   let tabIndex = winInfo.tablist.findIndex(tab => tab.tabid === tabid);
  //   if (tabIndex !== -1) {
  //     sethistory(winInfo.tablist[tabIndex].history)
  //     setactivetabid(tabid)
  //     invoke('list_files', { 
  //       windowname:winInfo.winname,
  //       oid: tabid.toString(),
  //       path: winInfo.tablist[tabIndex].tabpath,
  //       ff: "" 
  //   })
  //    // Activate the tab...
  //   }
   }

  //  function goBack(): void {
  //   let activeTab = winInfo.tablist.find(tab => tab.tabid === activetabid );
  //   if (activeTab && activeTab.history.length > 1) {
  //     setbackpressed(true)
  //     navigateToNewPath(activetabid, activeTab.history[activeTab.history.length - 1],path);
  //     activeTab.history.pop();
  //   }
  //  }
  // Import appWindow and save it inside the state for later usage
  
  useEffect(() => {
    console.log(Math.random());
  }, []);
  type wtd={
    functionname:string,
    arguments:string[]
  } 
   type parentprops={
    path:string,
    tabid:string
  }
  
  // if(mdc){
  //   reset()
  // }
  const [tabHistories, setTabHistories] = useState({});
  const [tabForward, setTabf] = useState({});
    const addToTabHistory = (tabId, item) => {
      setTabHistories((prevHistories) => ({
        ...prevHistories,
        [tabId]: [...(prevHistories[tabId] || []), item],
      }));
   };
    const addTofwdHistory = (tabId, item) => {
      setTabf((fwds) => {({
        ...fwds,
          [tabId]: [...(fwds[tabId] || []), item],
        })}
      );
   }; 
   const getTabHistory = (tabId) => {
    let poppedItem;
    setTabHistories((prevHistories) => {
      const history = prevHistories[tabId] || [];
      if (history.length === 0) {
        return prevHistories;
      }
      // history.pop()
      do{
        poppedItem=history.pop();
      }while((poppedItem===path))
      return {
        ...prevHistories,
        [tabId]: history,
      };
    });
    
    return poppedItem;
 };
 const getTabfwd = (tabId) => {
    let poppedItem;
    setTabf((fwds) => {
      const fwdt = fwds[tabId] || [];
      if (fwdt.length === 0) {
        return fwds;
      }
      // history.pop()
      do{
        poppedItem=fwdt.pop();
      }while((poppedItem===path))
      return {
        ...fwds,
        [tabId]: fwdt,
      };
    });
    return poppedItem;
 };

 // Memoized function to get the length of a tab's history
 const getTabHistoryLength = useMemo(() => (tabId) => {
    return (tabHistories[tabId] || []).length;
 }, [tabHistories]); 
 const getTabfwdLength = useMemo(() => (tabId) => {
    return (tabForward[tabId] || []).length;
 }, [tabForward]);
 const [currentchoice,changechoiceto]=useState("")

  useEffect(() => {

    // listen("load-markdown", (data: { payload: string }) => {
    //   let markdowninfo=JSON.parse(data.payload);
    //     console.log("loadmarkdown")
    //     sst(markdowninfo.filename)
    //     openmarkdown(markdowninfo.htmlfmd)
    //   });
      // listen("send-log", (data: { payload: string }) => {
      //   // console.log("grandloc")
      //   let status=data.payload;
      //   switch(status){
      //       case "stopped":
      //           console.log("file watching stopped")
      //           break;
      //       case "changed":
      //           invoke(
      //               "list_files",
      //               {
      //                 windowname:appWindow?.label,
      //                 oid: activetabid.toString(),
      //                 path: path,
      //                 ff: ""
      //               });
      //           break;
      //   }
      //   // lastfolder = data.payload.toString();
      //   // console.log(data.payload.toString())
      // });
    //   listen("load-html", (data: { payload: string }) => {
    //     setmdc(data.payload)

    //     // lastfolder = data.payload.toString();
    //     // console.log(data.payload.toString())
    //   }
    // );
    // listen("mirror", (data: { payload: string }) => {
    //   let whattodo:wtd=JSON.parse(data.payload)
    //   switch(whattodo.functionname){
    //     case "loadinglist":{
    //       console.log("reload called from "+appWindow2?.label)
          
    //     }
    //   }
      
    // })
    listen("fopprogress", (data: { payload: string }) => {
      let progressinfo = JSON.parse(data.payload);
      console.log(JSON.stringify(progressinfo))
    });listen("parent-loc", (data: { payload: string }) => {
      let whattodo:parentprops=JSON.parse(data.payload)
      setpath(whattodo.path)
      setpsplitl(splitpath(whattodo.path))
      setpit(whattodo.path)
    });
    listen("reloadlist", (data: { payload: string }) => {
      switch(data.payload){
        case 'reload':reloadlist();
        break;
        case 'nosize': reloadsize();
        break;
        case 'folcount': populateimmediatechildcount();
        break;
        case 'recent': recentfiles();
        break;
        default: {
          // let statusofpar:statusmesg=JSON.parse(JSON.stringify(data.payload)) as statusmesg;
          // console.log(statusofpar.message)
          console.log(JSON.stringify(data.payload))
          // console.log(JSON.stringify(data.payload)+"-------->"+statusofpar.message)
        }
        // default:reloadlist();
      }
      //  reloadlist();
      });
    // listen("list-tabs", (data: { payload: string }) => {
    //   console.log("listtabs ")
    
      
    //   let tabs: tabinfo[] = JSON.parse(data.payload) as tabinfo[];
    //   settbl(tabs)
    //   // // console.log("files")
    //   // clear the file list
    //   // tablist.innerHTML = "";
    //   // // console.log(data.payload)
    //   // loop through the files array
    //   // for (let tb of tabs) {
    //   //   // create a table row element for each file
    //   //   // let border=document.createElement("span");
    //   //   // border.className="border-bx"
    //   //   // globals.tablist.appendChild(border);
    //   //   // let tbt=document.createElement("span");
    //   //   // tbt.className="tbt"
  
    //   //   let b = document.createElement("div");
    //   //   b.className = "tab-button";
    //   //   if(tb.path===globalThis.activetab){
    //   //     b.classList.add("active");
    //   //     b.classList.remove("inactive");
    //   //   }
    //   //   else{
    //   //     b.classList.add("inactive");
    //   //     b.classList.remove("active");
    //   //   }
    //   //  invoke(
    //   //     "getuniquewindowlabel",
    //   //     {
            
    //   //     }
    //   //     ).then((returned:string)=>{
    //   //       b.dataset.ul=returned;
    //   //     })
  
    //   //   let sn = document.createElement("span");
    //   //   sn.className = "tab-name"
        
    //   //   let sc = document.createElement("span");
    //   //   sc.className = "tab-close"
    //   //   sn.textContent = tb.tabname;
    //   //   sc.textContent = "x";
    //   //   b.appendChild(sn);
    //   //   b.appendChild(sc);
    //   //   b.id = tb.id.toString();
    //   //   b.dataset.path = tb.path;
    //   //   b.dataset.ff = tb.ff;
    //   //   // b.appendChild(tbt)
    //   //   globals.tablist.appendChild(b);
    //   // }
    // });
    listen("button-names", (data: { payload: string }) => {
      setcbl(JSON.parse(data.payload) as string[]);
      console.log("winnames: "+data.payload.toString())
    });
    listen("folder-size", (data: { payload: string }) => {
      console.log("foldersize")
    
      setps(data.payload.toString())
      // console.log(data.payload.toString())
    });
    listen("fsc", (data: { payload: string }) => {
      // console.log("-------------__>"+((data.payload)))
      // console.log("fscl----->"+JSON.parse(data.payload));
      setfscl(JSON.parse(data.payload));
    });
    listen("load-sresults", (data: { payload: string }) => {
      let fl: FileItem[] = JSON.parse(data.payload) as FileItem[];
      sst("Search Results")
      console.log("Found----->"+fl.length)
      // fl=fl.splice(0,500);
      setfileslist(fl)
      setfc(fl.length)
      // // if(globalThis.lastpopfilelist.length>10)
      // // return
      // if (fileList.length>100){
      //   fileList=fileList.slice(0,100)
      // }
      // fileList.forEach(function(ef){
      //   eachfile(ef)
      // });
    });
    // const unlisten=
    listen('list-drives', (event) => {
      // sst("")
      // spi("drives://")
      // setcbl([])
      // setfscl([])
        console.log("loading drives---->"+event.payload);
        setdriveslist(JSON.parse(event.payload));
    })
    .then(result => {
            // console.log(uio.getCurrent().label)
            console.log(result)
        })
    .catch(console.error);
    
    // const unlisten1=
    listen('list-files', (event) => {
      setwbv(false)
      setfc((old) => {
        const newFileCount = old + 1;
        // if (newFileCount < 11)
         {
          // setpsplitl(splitpath(path))

          setfileslist((plog) => [...plog, JSON.parse(event.payload)]);
          
        }
        return newFileCount;
       });
        console.log("loading files---->"+event.payload);
    })
    .then(result => {
            // console.log(uio.getCurrent().label)
            console.log(result)
            
        })
    .catch(console.error);
    listen("load-marks", (data: { payload:string }) => {
      console.log("listmarks ")
      setbms(JSON.parse(data.payload) as mark[])
    });
    // lfiles();
    
    // openTab("drives://")
    // invoke('list_files', { 
    //     windowname:winInfo.winname,
    //     oid: activetabid,
    //     path: "drives://",
    //     ff: "" 
    // })
    // .then(result => {
    //     // console.log(uio.getCurrent().label)
    //     console.log(result)
        
    // })
    // .catch(console.error)
    // return () => {
    //   unlisten.then(f => f());
    //   unlisten1.then(f => f());
    // }
  },[])
  useEffect(()=>{
    if(!appWindow)
      return
      if(!startstopfilewatch){
        invoke('senddriveslist', { 
          windowname:appWindow?.label,
          
      }).then(

      )
                  reset("drives://")
                  setpath("drives://")
                  newtab("drives://");
                  // populatesearchlist("drives://");
              // })
              //   .catch(console.error)
        
      }
  },[appWindow])
  const [showthumbnail,setst]=useState(false)
//   useEffect(() => {
//     invoke<string>('greet', { 
//         name: "test"
//     })
//       .then(result => {
//         console.log(uio.getCurrent().label)
//         console.log(result)
//         addone(result)
//     })
//       .catch(console.error)
//   }, [count])

const columns: ColumnDef<FileItem>[] = [
   
  // {
  //   accessorKey: 'reponame',
  //   header: 'Reponame',
  // },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: true,
  },

  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          // variant='ghost'
          onClick={() => {
            // console.error("pressed name")
            column.toggleSorting(column.getIsSorted() === 'asc')
          }}
        >
          FileName
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({
      row,
      getValue,
      row: {
        original: { path,name,foldercon,size,rawfs,is_dir,timestamp },
      },
    }) => {
      const rname = getValue()

      return (
        <div className={`max-w-sm overflow-hidden`}>
          <ContextMenu>
          <ContextMenuTrigger>
            <HoverCard>
              <HoverCardTrigger>
              <button className="w-full h-full flex justify-start whitespace-nowrap " onDoubleClick={
                ()=>
                { 
                  // console.log("gridlayout clicked");
                    if(is_dir){
                      reset(path)
                      updatetabs(path)
                    
                      // setpath()
                      // setpsplitl(splitpath(path))
                      // sst(name)
                      addToTabHistory(activetabid.toString(),path)
                    }
                  // useEffect(() => {
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: activetabid.toString(),
                      path: path,
                      ff: "" 
                  }).catch((e)=>console.error(e));
                  // },[])
                  }
                }>
                {/* <CardContent > */}
                <div>

                  {is_dir?<FolderIcon className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />}
                </div>
                  {/* <span className="font-medium text-lg"> */}
                    {name}{foldercon>0 ? "(" + foldercon + ")" : ""}
                    {/* </span> */}
                {/* </CardContent> */}
              </button>
              </HoverCardTrigger>
              <HoverCardContent className={`flex flex-col ${setcolorpertheme}`}>
               {path}
               <br/>
               {`${foldercon>0?`Contains ${foldercon} ${is_dir?"files":"lines"}`:""}`}
               <br/>
               {converttstodt(timestamp)}
              <FRc location={path} size={size} rawsize={rawfs}/>
              </HoverCardContent>
            </HoverCard>

            
          </ContextMenuTrigger>
          <ContextMenuContent className=''>
            <p className='text-sm'>{path}</p>
            <ContextMenuItem onSelect={(e)=>{
              invoke("newwindow",
              {
                // id: (winInfo.tabidsalloted++).toString(),
                path: path,
                ff:""
              });

            }}>Open in new window</ContextMenuItem>
            <ContextMenuItem onSelect={(e)=>{
              // openTab(path)
              invoke(
                "newtab",
                {
                  windowname:appWindow?.label,
                  oid: activetabid.toString(),
                  path: path,
                  ff: ""
                }
              );
            }}>Open in new tab</ContextMenuItem>
            <ContextMenuItem onSelect={()=>{
              invoke(
                "addmark",
                {
              windowname:appWindow?.label,
                  path: path
                }
              );
            }}>Add bookmark</ContextMenuItem>
            <ContextMenuItem onSelect={(e)=>{
              useEffect(() => {
              if (typeof window !== 'undefined'){

                try {
                  navigator.clipboard.writeText(path);
                  console.log('Content copied to clipboard');
                } catch (err) {
                  console.error('Failed to copy: ', err);
                }
              }
            },[])}}
            >Copy path to clipboard</ContextMenuItem>
            <ContextMenuItem onSelect={(e)=>{
              setfos((old)=>[...old,path])
            }}>Copy</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
          {/* <button className='w-32' onDoubleClick={
            ()=>
            { 
              reset(path)
          updatetabs(path)
          // setpath()
          // setpsplitl(splitpath(message.path))
          sst(path)
          console.log(path)
          invoke('list_files', { 
            windowname:appWindow?.label,
            oid: activetabid.toString(),
            path: path,
            ff: "" 
        })
          }
          }>{`${name}`}</button> */}
        </div>
        // <div className="text-right">
        //   {original_price_incl_tax !== price && (
        //     <Tooltip
        //       content="The price has been overridden in a price list, that is applicable to this order."
        //       side="top"
        //     >
        //       <p className="cursor-default text-grey-40 line-through">
        //         {formatAmountWithSymbol({
        //           amount: original_price_incl_tax || 0,
        //           currency: order.currency_code,
        //         })}
        //       </p>
        //     </Tooltip>
        //   )}
        //   <p>
        //     {formatAmountWithSymbol({
        //       amount: price || 0,
        //       currency: order.currency_code,
        //     })}
        //   </p>
        // </div>
      )
    },
    
  }
  // ,{
  //   accessorKey: 'additions',
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         // variant='ghost'
  //         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
  //       >
  //         Additions
  //         <ArrowUpDown className='ml-2 h-4 w-4' />
  //       </Button>
  //     );
  //   },
  // },{
  //   accessorKey: 'deletions',
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         // variant='ghost'
  //         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
  //       >
  //         Deletions
  //         <ArrowUpDown className='ml-2 h-4 w-4' />
  //       </Button>
  //     );
  //   },
  // }
  ,{
    accessorKey: 'ftype',
    header: ({ column }) => {
      return (
        <Button
          // variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Filetype
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({
      getValue,
      row: {
        original: { ftype },
      },
    }) => {
      const rname = getValue()

      return (
          <p className='w-10 sm:w-64 wolc'>{ftype}</p>
      )
    },
  },{
    accessorKey: 'rawfs',
    header: ({ column }) => {
      return (
        <Button
          // variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Size
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({
      getValue,
      row: {
        original: { size,rawfs },
      },
    }) => {
      const rname = getValue()

      return (
          <p className='w-10 sm:w-64 wolc'>{size}</p>
      )
    },
  },{
    accessorKey: 'timestamp',
    header: ({ column }) => {
      return (
        <Button
          // variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date Modified
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({
      row: {
        original: { timestamp },
      },
    }) => {
      const dateTime = DateTime.fromMillis(timestamp * 1000); // Convert timestamp to DateTime object
      const utcDateTime = dateTime.toUTC(); // Convert DateTime object to UTC time
      const utcTime = utcDateTime.toFormat('dd MMM yy'); // Format UTC time in ddmmyyhhss format

      return (
          <p>{utcTime}</p>
      )
    },
  },
  
  // {
  //   accessorKey: 'deletions',
  //   header: () => <div className='text-right'>Deletions</div>,
  //   cell: ({ row }) => {
  //     const amount = parseFloat(row.getValue('amount'));
  //     const formatted = new Intl.NumberFormat('en-US', {
  //       style: 'currency',
  //       currency: 'USD',
  //     }).format(amount);

  //     return <div className='text-right font-medium'>{formatted}</div>;
  //   },
  // },
  // {
  //   id: 'actions',
  //   cell: ({ row }) => {
  //     const payment = row.original;

  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button 
  //           // variant='ghost' 
  //           className='h-8 w-4 p-0'>
  //             <span className='sr-only'>Open menu</span>
  //             {/* <MoreHorizontal className='h-4 w-4' /> */}
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align='end'>
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuItem
  //             onClick={() => navigator.clipboard.writeText(payment.id)}
  //           >
  //             Copy payment ID
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem>View customer</DropdownMenuItem>
  //           <DropdownMenuItem>View payment details</DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
  // ...
];
// const useActiveElement = () => {
//   const [active, setActive] = useState(document.activeElement);
   
//   const handleFocusIn = (e) => {
//      setActive(document.activeElement);
//   }
   
//   useEffect(() => {
//      document.addEventListener('focusin', handleFocusIn)
//      return () => {
//        document.removeEventListener('focusin', handleFocusIn)
//   };
//   }, [])
   
//   return active;
//  }
//  const focusedElement = useActiveElement();
  
//  useEffect(() => {
//      if (focusedElement) {
//        focusedElement.value && console.log(focusedElement.value);
//      }
//     console.log(focusedElement);
//  }, [focusedElement])
  
 
 function reloadlist(){
      reset(path)
          // setpath()
          // setpsplitl(splitpath(message.path))
      // invoke the list_files command from the backend with the path as argument
      invoke(
        "list_files",
        {
        windowname:appWindow?.label,
          oid: activetabid.toString(),
          path: path,
          ff: ""
        });
}
function populatesearchlist(spath){
  invoke(
    "searchload", {
      path:spath
  }).catch((e)=>console.error(e))
}
function populateimmediatechildcount(){
  reset(path)
  invoke(
    "folcount",
    {
    windowname:appWindow?.label,
      id: activetabid.toString(),
      path: path
    });
}

function recentfiles(){
    console.log("recent");
    invoke(
    "recent_files", {
      windowname:appWindow?.label,
      string: "",
  })
}
function loadsearchdb(tospath){
    invoke(
    "loadsearchlist", {
      windowname:appWindow?.label,
      id: activetabid.toString(),
      path: tospath
  })
}
 
function updatetabs(tabpath){
  console.log("update tabs called")
  invoke(
    "tabname",
    {
      path:tabpath,
    }
  ).then((returned:string)=>{
    sst(returned)
    console.log("preupdate tablist--->"+JSON.stringify(tablist))
     if(tablist && tablist.length>0){

    let tempstoreoldtablist=tablist;
    let objIndex = tempstoreoldtablist!.findIndex((obj => obj.id === activetabid));
    if(objIndex !== -1){

      tempstoreoldtablist![objIndex!].path = tabpath;
      tempstoreoldtablist![objIndex!].tabname = returned;
      settbl(tempstoreoldtablist!);
    }
    console.log("udpated tabs---->"+JSON.stringify(tempstoreoldtablist))
  }
  })
  .catch((e)=>{
    console.error(e)
  })
}
function closetab(closeid){
  if(tablist && tablist.length>1){
      
    let tempstoreoldtablist=tablist;
    let objIndex = tempstoreoldtablist!.findIndex((obj => obj.id === closeid));
    if(objIndex !== -1){
      const removed=tempstoreoldtablist.splice(objIndex,1)
      console.log("closed tab now tablist is "+JSON.stringify(tempstoreoldtablist)+"\t removed"+JSON.stringify(removed))
      // closeall();
      // tempstoreoldtablist.map((tab,index)=>{
      
    // })
      settbl(tempstoreoldtablist!);
      
    }
    
  }
}
  function newtab(gotopath?:string){
    reset()
    // console.error(gotopath)
    let newtabid=new Date().getTime();
                      invoke(
                        "tabname",
                        {
                          path:gotopath,
                        }
                      ).then((returned:string)=>{
                        console.log("what was returned....."+returned)
                        invoke(
                          "newtab",
                          {
                            windowname:appWindow?.label,
                            oid: newtabid.toString(),
                            path: gotopath,
                            ff: ""
                          }
                        );
                        
                        settbl((old)=>{
                          return (old && old?.length>0)?
                          [...old,{
                            id:newtabid,
                            path:gotopath,
                            ff:"",
                            tabname:returned,
                            history:[]
                          } as tabinfo]:
                          [{
                            id:newtabid,
                            path:gotopath,
                            ff:"",
                            tabname:returned,
                            history:[]
                          } as tabinfo]
                        
                        })
      // console.log("opened tab now tablist is "+JSON.stringify(tablist))

                        
                        setactivetabid(newtabid)
                        // setpath(message.path)
                        // setpsplitl(splitpath(message.path))
                        // sst(message.name)
                        // invoke(
                        //   "load_tab",
                        //   {
                        //     windowname:appWindow?.label,
                        //     oid: newtabid.toString()
                        //   }
                        // );
                        addToTabHistory(newtabid.toString(),gotopath)
                        // addTofwdHistory(newtabid.toString(),path)
                        invoke('list_files', { 
                          windowname:appWindow?.label,
                          oid: newtabid.toString(),
                          path: gotopath,
                          ff: "" 
                      })
                      });
  }
  function reloadsize(){
    reset(path)
    console.log("loading size js---->1");
    if(appWindow){
      const thensobj={windowname: appWindow?.label,
      id: activetabid.toString(),
      path: path,
    };
    console.log(appWindow?.label+"------>"+JSON.stringify(thensobj))
    invoke(
      "nosize",
      thensobj);
    console.log("loading size js----->2")
    }
  }
const [isvalid,setvalid]=useState(true);
  
const [width, setWidth] = useState(200);
 const [isDragging, setIsDragging] = useState(false);

 const handleMouseDown = (event) => {
    setIsDragging(true);
    event.stopPropagation();
 };

 const handleMouseMove = (event) => {
    if (!isDragging) return;
    setWidth(window.innerWidth - event.clientX);
 };

 const handleMouseUp = () => {
    setIsDragging(false);
 };
  
  
  
  const[dupes,setdupes]=useState([] as operationfileinfo[])
  const[showalertdialog,setsal]=useState(false)
  const[dest,setdest]=useState("")
  const [size, setSize] = useState({
    a: 10,
    b: 90,
  });

  useEffect(() => {
    // Can't change size.
    setTimeout(() => setSize({ a: 50, b: 50 }), 1000);
  }, []);

  return (
    // <div className="overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="overflow-hidden">
        <ResizablePanel defaultSize={size.a} className="bg-gray-100/40 dark:bg-gray-800/40">

        <div className="flex h-full flex-col gap-2">

          <div className="flex p-3  border-b">
            
            <div className="flex flex-row p-2 items-center">

            <button className="flex items-center gap-2 font-semibold">
              <FolderIcon className="h-6 w-6" />
              <span className="">Filedime</span>
            </button>
            <LogInIcon className="w-4 h-4" onClick={()=>{
              console.log(JSON.stringify(tablist))
              console.log(JSON.stringify(tabHistories))
              console.log(JSON.stringify(tabForward))
            }}/>
            </div>
            {/* <div className="grid items-start px-4 text-sm font-medium"> */}
              
          </div>
          <div className="px-4 p-2">

            <button
                className={`text-sm font-medium flex w-full items-center  gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor}`}
                onClick={()=>
                  { 
                    setTheme(theme === 'light' ? 'dark' : 'light')
                  }
                  }
              >
                <div>

                {theme === 'light' ? (<MoonIcon className="h-4 w-4" />) : (<SunIcon className="h-4 w-4" />)}
                </div>
                <p className="overflow-hidden line-clamp-1">
                  Switch to {theme === 'light' ? ("Dark Mode") : ("Light Mode")}
                  </p>
                
              </button>
          </div>

          {/* </div> */}
            
          
          <div className="overflow-y-auto overflow-x-hidden">
            
          
              {/* </div> */}
         
              <Dupelist dst={dest} srclist={srclist} dupes={dupes} showad={showalertdialog} setshowad={setsal}/>
          {fileopsrc.length>0?( 
          <div className='flex items-center gap-2 font-semibold border-b h-[60px] px-2'>
                 <HoverCard>
              <HoverCardTrigger>
              <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                  ()=>{
                    // fileopsrc.map((eachsource)=>{

                      invoke('checkforconflicts', { 
                      srclist:JSON.stringify(fileopsrc),
                      dst:path,
                  }).then((a)=>{
                    console.log(a)
                    let listofdupes:existingfileinfo[]=JSON.parse(a);
                    let newArray: operationfileinfo[] = listofdupes.map((item): operationfileinfo => ({
                      ...item,
                      replace: false
                  }));
                    console.log(typeof listofdupes[0])
                    if(listofdupes.length===0)
                    {
                      invoke('fileop', { 
                        srclist:JSON.stringify(fileopsrc),
                        dst:path,
                        dlastore:JSON.stringify([])
                    })
                    }
                    else{
                      setdest(path)
                      setdupes(newArray)
                      setsal(true);
                      return 
                    }
                  })
                  // invoke('fileop_with_progress', { 
                  //     windowname:appWindow?.label,
                  //     src:JSON.stringify(fileopsrc),
                  //     dst:path,
                  //     removefile:false
                  // }).catch((e)=>console.error(e))
                    // })
                    
                  // .then(()=>{
                    console.log("done");
                    setfos([])
                    setfod("")
                    // reset(path)
                    // sst(path)
                  //   invoke('list_files', { 
                  //     windowname:appWindow?.label,
                  //     oid: activetabid.toString(),
                  //     path: path,
                  //     ff: "" 
                  // // })
                    
                  // })
                  }
              }>
              <CardDescription className="flex items-center space-x-2 p-2">
              Paste ({fileopsrc.length})
                
              </CardDescription>
            </Card>
              </HoverCardTrigger>
              <HoverCardContent className={`flex flex-col ${setcolorpertheme}`}>
               {fileopsrc.map((eachsource)=>{
                return <>
                <p>{eachsource}</p>
                <br/>
                </>
               })}
              </HoverCardContent>
            </HoverCard>
                 
            </div>
              )
              :(null)}
          <div className="">
            <nav className="grid items-start px-4 text-sm font-medium">
              <button onClick={()=>
                { 
                    reset("drives://")
                    // sst("drives://")
                    updatetabs("drives://")
                    // setpath()
                    // console.log(message);
                    addToTabHistory(activetabid.toString(),"drives://")
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: activetabid.toString(),
                      path: "drives://",
                      ff: "" 
                  })
                }
                }
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all  dark:text-gray-400  ${hovercolor} ${focuscolor}`}
                
              >
                <HomeIcon className="h-4 w-4" />
                Home
              </button>
              {/* <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900  transition-all hover:text-gray-900  dark:text-gray-50 dark:hover:text-gray-50"
                href="#"
              ><FolderIcon className="h-4 w-4" />{sampletext}</Link> */}
              <button
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor}`}
                
              >
                <TrashIcon className="h-4 w-4" />
                Trash
              </button>
              <button
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor}`}
                onClick={()=>
                  { 
                      // setfileslist([])
                      // setdriveslist([])
                      // sst("drives://")
                      // setpath("drives://")
                      // setss("")
                      // console.log(message);
                      
                      // openTab("drives://");
                      
                      newtab("drives://");
                  }
                  }
              >
                <PlusIcon className="h-4 w-4" />
                New Tab
              </button>
              
              
            </nav>
          </div>
          <div className="grid items-start px-4 text-sm font-medium">

              {bookmarks && bookmarks.length>0 ?(<>
          <span className='h-8'/>
              <h1 className='p-2'>Bookmarks</h1>
              {
                
               bookmarks.map((mark, index) => (
                <ContextMenu>
                  <ContextMenuTrigger>
                <button key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor}`}
                  onClick={()=>
                    { 
                      if(mark.is_dir){
                        reset(mark.path)
                        updatetabs(mark.path)
                      }
                      invoke(
                        "list_files",
                        {
                          windowname:appWindow?.label,
                          oid: activetabid.toString(),
                          path: mark.path,
                          ff: ""
                        }
                      ).catch((e)=>console.error(e));
                      // console.error(mark.path)
                      // newtab(mark.path)
                        // setfileslist([])
                        // setdriveslist([])
                        // sst("drives://")
                        // setpath("drives://")
                        // setss("")
                        // console.log(message);
                        
                        // activateTab(tab)
                    }
                    }
                >
                   {/* {mark.is_dir?<FolderIcon className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />} */}
                   <BookIcon className="h-6 w-6 mr-3" />
                  {mark.name}
                  
                </button>
                    
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={()=>{
                      invoke(
                        "removemark",
                        {
                      windowname:appWindow?.label,
                          path: mark.path
                        }
                      );
                    }}>Remove bookmark</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                ))

              }
              </>):(null)}
              
              {tablist?(<>
              <span className='h-8'/>
              <h1 className='p-2'>Tabs ({tablist.length})</h1>
              {
                
               tablist.map((tab, index) => (
                <button key={index}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor} ${activetabid === tab.id ? setcolorpertheme : ''}`}
                  onClick={()=>
                    { 
                        // setfileslist([])
                        // setdriveslist([])
                        // sst("drives://")
                        // setpath("drives://")
                        // setss("")
                        // console.log(message);
                        
                        activateTab(tab)
                    }
                    }
                >
                  <FolderIcon className="h-4 w-4" />
                  {/* {activetabid === tab.id ? sampletext: */}
                  {tab.tabname}
                  {/* } */}
                  <HoverCard>
                    <HoverCardTrigger>
                      <Button onClick={()=>{
                        populatesearchlist(tab.path)
                      }}>

                      <ScanSearchIcon className="h-4 w-4"/>
                      </Button>
                   </HoverCardTrigger>
                    <HoverCardContent  className={`${setcolorpertheme}`}>
                    Load folder contents to search
                    </HoverCardContent>
                  </HoverCard>
                  <XIcon className={`h-4 w-4  ${tablist.length>1 ? '' : 'hidden'}`} onClick={(e)=>{
                    e.stopPropagation();
                    closetab(tab.id);
                    activateTab(tablist[tablist.length-1])
                  }}/>
                </button>
                ))

              }
              </>):(null)}
              {driveslist && driveslist.length>0 ?(<>
              <span className='h-8'/>
              <h1 className='p-2'>Drives ({driveslist.length})</h1>
              {
                
               driveslist.map((message, index) => (
                <ContextMenu>
                  <ContextMenuTrigger>
                <button key={index}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 whitespace-nowrap text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor} line-clamp-1`}
                  onClick={()=>
                    { 
                      reset(message.mount_point)
                      updatetabs(message.mount_point)
                      // spi(message.mount_point)
                      // setpath()
                      // sst(message.mount_point)
                      // console.log(message);
                      invoke('list_files', { 
                        windowname:appWindow?.label,
                        oid: activetabid.toString(),
                        path: message.mount_point,
                        ff: "" 
                    }).catch((e)=>console.error(e))
                    }
                    }
                >
                   {/* {mark.is_dir?<FolderIcon className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />} */}
                   <HardDriveIcon className="h-6 w-6" />
                    {message.name ? message.name + "(" + message.mount_point + ")" : message.mount_point}
                
                </button>
                    
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                  <ContextMenuItem>Open in new tab</ContextMenuItem>
                  <ContextMenuItem>Open in new window</ContextMenuItem>
                </ContextMenuContent>
                </ContextMenu>
                ))

              }
              </>):(null)}
          </div>
          </div>
          {/* <div className=" w-full flex"> */}
        </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={size.b} className="flex flex-col pt-3 ps-3">
        <div className="mb-4">

<div 
  className={`flex flex-row overflow-${scrollorauto} p-1 gap-2`}
  // className={`flex flex-row hover:${checkifwithinbounds()?"":"overflow-scroll"} p-1`}
>
  <div>

          {/* <Button size={"sm"} variant={"ghost"} className=""> */}

        <HoverCard>
              <HoverCardTrigger>
            <Button className='rounded-lg border bg-card text-card-foreground shadow-sm'onClick={
                ()=>{
                  setig((old)=>{return !old})
                }
            }>
            {/* <CardDescription className="flex items-center space-x-2 p-2"> */}
            {isgrid?<LayoutGrid className="h-4 w-4"/>:<LayoutList className="h-4 w-4"/>}
              
            {/* </CardDescription> */}
          </Button>
          </HoverCardTrigger>
              <HoverCardContent className={`${setcolorpertheme}`} >
               List / Grid
              </HoverCardContent>
            </HoverCard>
          {/* </Button> */}
  </div>
  <div>


            <HoverCard>
              <HoverCardTrigger>
          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm'onClick={
                ()=>{
                  reloadlist()
                }
            }>
            {/* <CardDescription className="flex items-center space-x-2 p-2"> */}
            <RefreshCcwIcon className="h-4 w-4"/>
              
            {/* </CardDescription> */}
          </Button>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Reload
              </HoverCardContent>
            </HoverCard>
  </div>
  <div>


            <HoverCard>
              <HoverCardTrigger>
          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm 'onClick={
                ()=>{
                  reloadsize()
                }
            }>
            <RulerIcon className="h-4 w-4"/>
              
          </ Button>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Show size of folder
              </HoverCardContent>
            </HoverCard>
  </div>
            <div  className={`${watchbuttonvisibility ? '' : 'hidden'}`}>

            {/* <HoverCard>
              <HoverCardTrigger>
          <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                ()=>{
                  setstartstopfilewatch((old)=>{let newv= !old;
                    if(newv){

                      // console.log("startserve");
                      invoke(
                        "startserver",
                        {
                          windowname:appWindow?.label,
                          pathstr:path
                        }
                        );
                    }
                    // }
                    // else if (target==globals.stopserve){
                    // console.log("stopserve");
                    else{
                    invoke(
                      "stopserver",
                      {
                        windowname:appWindow?.label,
                        path:""
                      }
                    );
                  }
                  return newv});
          
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
            <EyeIcon className="h-4 w-4"/>
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent >
               Hot reload (Monitor changes and reload as necessary)
              </HoverCardContent>
            </HoverCard> */}
            </div>
            {/* <HoverCard>
              <HoverCardTrigger>
          <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                ()=>{
                  reloadsize()
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
            <RulerIcon className="h-4 w-4"/>
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent >
               Show size of folder
              </HoverCardContent>
            </HoverCard> */}
            <div>


            <HoverCard>
              <HoverCardTrigger>
          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm 'onClick={
                ()=>{
                  populateimmediatechildcount()
                }
            }>
            <FolderTreeIcon className="h-4 w-4"/>
              
          </Button>
          </HoverCardTrigger>
              <HoverCardContent   className={`${setcolorpertheme}`}>
               Count immediate children of folders
              </HoverCardContent>
            </HoverCard>
            </div>
            <div>
              

            <HoverCard>
              <HoverCardTrigger>
          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm 'onClick={
                ()=>{
                  recentfiles()
                }
            }>
            <FolderClockIcon className="h-4 w-4"/>
              
          </Button>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Recent Files
              </HoverCardContent>
            </HoverCard>
            </div>
            <div>


            <HoverCard>
              <HoverCardTrigger>
          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm 'onClick={
                ()=>{
                  loadsearchdb(path)
                }
            }>
            <ScanSearchIcon className="h-4 w-4"/>
              
          </Button>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               load Search from this directory
              </HoverCardContent>
            </HoverCard>
            </div>
        {custombuttonlist.map((bn, index) => (
          <div key={index} className="">


          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm  p-1'   onClick={
            ()=>{
              invoke(
                "otb",
                {
                  bname: bn,
                  path: path,
                }
                ).catch((e)=>{
                  console.log(`error: ${e}`)
                });
            }
        } >
              <CodeIcon className="h-4 w-4" />
              <span className="font-medium text-sm ps-2">{bn}</span>
          </Button>
          </div>
            ))}
        </div>
        </div>
      <div className="justify-between mb-2 ">
          <div className={`flex flex-row gap-2 overflow-${scrollorauto}`}>
            <div>

            <Button variant={"ghost"} className={` ${getTabHistoryLength(activetabid.toString())>0?"":"hidden"}`} onClick={()=>{
                // addTofwdHistory(activetabid.toString(),path)
                let pathtogoto=getTabHistory(activetabid.toString())
                if(pathtogoto && pathtogoto.trim().length>0){

                  reset(pathtogoto)
                  updatetabs(pathtogoto)
                  // setpath()
                  // setpsplitl(splitpath(pathtogoto))
                  // sst("")
                  // useEffect(() => {
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: activetabid.toString(),
                      path: pathtogoto,
                      ff: "" 
                  });
                }
              }}><ArrowLeft className="h-4 w-4"
              /></Button>
            </div>
          {/* <div className="flex items-center gap-2"> */}
            {/* <Button size="sm" variant="ghost"> */}
              
            {/* </Button> */}
            <Button className={` ${getTabfwdLength(activetabid.toString())>0?"":"hidden"}`} variant="ghost"  onClick={()=>{
                let pathtogoto=getTabfwd(activetabid.toString())
                if(pathtogoto && pathtogoto.trim().length>0){

                  reset(pathtogoto)
                  updatetabs(pathtogoto)
                  // setpath()
                  // setpsplitl(splitpath(pathtogoto))
                  // sst("")
                  // useEffect(() => {
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: activetabid.toString(),
                      path: pathtogoto,
                      ff: "" 
                  });
                }
              }}>
              <ForwardIcon className="h-4 w-4" 
             />
            </Button>
          {/* </div> */}
            {/* <div className="flex-grow"> */}
            <datalist id="path-list">
            {pathsuggestlist.map((message, index) => (
              <option key={index} value={message}/>
            ))}
            </datalist>
              <input
                className="min-w-64 max-w-full w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Path"
                type="search"
                list="path-list"
                value={pathitype}
                onChange={(event) =>
                  {
                    setpit(event.target.value);
                    invoke('doespathexist', { 
                              path: event.target.value
                          })
                            .then(result => {
                              setvalid(result)
                          })
                            .catch(console.error)
                    invoke(
                      "get_path_options", 
                      {
                        windowname:appWindow?.label,
                        path: event.target.value,
                      })
                      .then((options:string[]) => {
                        // console.log(options)
                        // Clear the datalist options
                        if (options !== null) {
                          setpsl(options)
                    
                          // Loop through the options returned by Rust
                          // for (const option of options) {
                          //   const optionElement = document.createElement("option");
                          //   // // console.log("here#1")
                          //   optionElement.value = option;
                    
                          //   // Append the option element to the datalist element
                          //   datalist.appendChild(optionElement);
                          // }
                          // for (const option of globalThis.lastpopfilelist) {
                          //   // Create a new option element with the option value
                          //   const optionElement = document.createElement("option");
                          //   // // console.log("here#1")
                          //   optionElement.value = option.path;
                    
                          //   // Append the option element to the datalist element
                          //   datalist.appendChild(optionElement);
                          // }
                        }
                      })
                      .catch((error:string) => {
                        // Handle any errors from Rust
                        console.error(error);
                      });
                  }
                }
              />
              
            {/* </div> */}
            <div>

            <Button className={`${isvalid?"":"hidden"}`} onClick={()=>{
              reset(pathitype)
              invoke(
                "list_files",
                {
                windowname:appWindow?.label,
                oid: activetabid.toString(),
                path: pathitype,
                ff: ""
                }
                ).then(()=>{
                  
                  updatetabs(pathitype)
                  //  setpath(message.name)
                  //  sst(message.path)
                  addToTabHistory(activetabid.toString(),pathitype)
                })
                .catch((e)=>console.error(e))
            }}>
              <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
            {/* <div className="flex-grow "> */}
              <input
                className="min-w-32 max-w-[20%] w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Search"
                type="search"
                value={searchstring}
                onChange={(event) =>
                  {
                    let tosearch=event.target.value;
                    setss(tosearch)
                  }
                }
              />
            {/* </div> */}
            <div>

            <Button variant={"ghost"}  onClick={
              ()=>{
                if(searchstring.trim().length>0){
                  // invoke(
                  //   "populate_try", {
                  //     path:path
                  // })
                  // .then(()=>{
                    invoke(
                    "search_try", {
                      windowname:appWindow?.label,
                      // path: pathInput.value,
                      string: searchstring
                    }).catch((e)=>console.error(e))
                  // })
                  // .catch((e)=>console.error(e))
                  
                }
              }
            }>

            <SearchIcon className="h-4 w-4"/>
            </Button>
            </div>
            {/* <div className="flex items-center gap-2"> */}
              <div className="flex items-center">

              <span className=" whitespace-nowrap">{parentsize}</span>
              </div>
              {/* <Button variant="ghost">Tab 2</Button>
              <Button variant="ghost">Tab 3</Button> */}
            {/* </div> */}
          </div>
        </div>
        <div>

        <div className={`flex items-center space-x-6 ms-2 overflow-${scrollorauto}`}>
          {pathsplitlist
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map((eachif,index)  => {
            if(eachif.pathtofol.trim().length>0){

              return <button key={index} onClick={
                ()=>
                { 
                  reset(eachif.pathtofol)
                  updatetabs(eachif.pathtofol)
                  // spi(message.mount_point)
                  // setpath()
                  // sst(eachif.pathtofol)
                  addToTabHistory(activetabid.toString(),eachif.pathtofol)
                  // console.log(message);
                  invoke('list_files', { 
                    windowname:appWindow?.label,
                    oid: activetabid.toString(),
                    path: eachif.pathtofol,
                    ff: "" 
                })}
            }>
              {/* <TreesIcon className="h-4 w-4 "/> */}
              {eachif.interfolpath}</button>
            }
            return;
        })}
        </div>
        </div>
        <div className="">

        <div className='grid grid-flow-col justify-start overflow-x-auto'> 
        <Button onClick={()=>setsftype("all")} className="m-2 p-[-5px] whitespace-nowrap min-w-min" variant="ghost" key="all"><Badge variant={"outline"}>all</Badge></Button>
          {
          Object.entries(filesetcollectionlist)
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map(([key, value],index)  => (
            <Button onClick={()=>setsftype((old)=>old===key?"all":key)} className="m-2 p-[-5px] whitespace-nowrap min-w-min" variant="ghost" key={index}><Badge variant={"outline"}>{key}({value})</Badge></Button>
          ))}
        </div>
        </div>
        {/* <span className="flex flex-row space-x-4"> */}

        {/* <h1 className="font-semibold text-lg md:text-2xl">
          {fileslist.length>0||watchbuttonvisibility?sampletext:"Drives"} 
          Contains: {fileslist.length>0?filecount:driveslist.length} Items</h1> */}
        {/* <Button className={`border border-b-2  p-2 border-gray-900 ${fileslist.length<500?"hidden":""}`} onClick={()=>{
              setll((old)=>{return !old});
            }}>Show all</Button> */}
        {/* </span> */}
        {/* <p>{searchstring.trim().length>0?"":path}</p> */}
       
        <span className={`overflow-${scrollorauto} ${(fileslist.length>0) && !isgrid ? 'block' : 'hidden'}`}>
        
          <DataTable columns={columns} data={fileslist} searchstring={searchstring} filetype={sftype}/>
        </span>
        
        <div className={`${isgrid?"flex flex-row":"hidden"}`}>
        {/* <div className={`${isgrid?"mb-3 mt-3":"hidden"}`}> */}

<DropdownMenu>
<DropdownMenuTrigger className="p-4" asChild>
  <Button 
    variant='outline' 
    className='whitespace-nowrap overflow-hidden mr-2'>
    Sort by {currentchoice}
  </Button>
</DropdownMenuTrigger>
<DropdownMenuContent align='end' className='bg-white dark:bg-gray-900'>
  
        <DropdownMenuItem
          className='capitalize text-black dark:text-white'
          // checked={issize}
          // onCheckedChange={(value:boolean) => {}}
          onClick={()=>{
            changechoiceto("Size")
            fileslist.sort((b, a) => a.rawfs - b.rawfs);
          }}
        >
          Size
        </DropdownMenuItem>
        <DropdownMenuItem
          className='capitalize text-black dark:text-white'
          // checked={issize}
          // onCheckedChange={(value:boolean) => {}}
          onClick={()=>{
            changechoiceto("Name")
            fileslist.sort((a, b) => {
              if (a.name < b.name) {
                  return -1;
              }
              if (a.name > b.name) {
                  return 1;
              }
              return 0;
          });
          }}
        >
          Name
        </DropdownMenuItem>
        <DropdownMenuItem
          className='capitalize text-black dark:text-white'
          // checked={issize}
          // onCheckedChange={(value:boolean) => {}}
          onClick={()=>{
            changechoiceto("Type")
            fileslist.sort((a, b) => {
              if (a.ftype < b.ftype) {
                  return -1;
              }
              if (a.ftype > b.ftype) {
                  return 1;
              }
              return 0;
          });
          }}
        >
          Type
        </DropdownMenuItem>
        <DropdownMenuItem
          className='capitalize text-black dark:text-white'
          // checked={issize}
          // onCheckedChange={(value:boolean) => {}}
          onClick={()=>{
            changechoiceto("Date")
            fileslist.sort((b, a) => a.timestamp - b.timestamp);
          }}
        >
          Date
        </DropdownMenuItem>
      
</DropdownMenuContent>
</DropdownMenu>
{/* </div> */}
                <Button variant={"outline"} className="mr-2 "  onClick={()=>setpageno((old)=>old>0 && old<noofpages?old-1:noofpages-1)}>Previous</Button> <Button variant={"outline"} className="mr-2 "  onClick={()=>setpageno((old)=>old<noofpages-1?old+1:0)}>Next</Button>
                <HoverCard>
                <HoverCardTrigger>
                <Button variant={"outline"} className={`${isgrid?"":"hidden"}`} onClick={()=>setst((old)=>!old)}><GalleryThumbnailsIcon className="h-4 w-4"/></Button>
                </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Reload
              </HoverCardContent>
            </HoverCard>
                <p className='ms-3 flex items-center'>Page {currentpage+1} / {noofpages} pages</p>
                
                <div className="ms-2 flex whitespace-nowrap overflow-hidden">

                <Input value={perpage}
                className="w-16"
                type="number"
                placeholder="Per Page Count"
                onChange={(event) =>
                  {
                    let pp=Number(event.target.value);
                    setperpage(pp)
                  }
                }/>
                </div>
        </div>
        <div className={`${isgrid?`grid sm:grid-cols-2 lg:grid-cols-4 mt-6 overflow-${scrollorauto}`:"hidden"}`}>

        {isgrid && fileslist.filter(function (el) {
                     return (searchstring.trim().length>0?
                       el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.path.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()):((sftype.trim().length>0?
                       (el.ftype===sftype || sftype ==="all"):(true))))
                    })
                    .slice(currentpage*perpage,((currentpage)+1)*perpage)
                    .map((message, index) => (
                      <div key={index} className="m-3 flex flex-row">
                      <Button size={"none"} variant={"outline"} className="relative m-0 h-full w-full flex justify-start overflow-hidden focus:bg-gray-200 focus:dark:bg-gray-700">

                      <ContextMenu >
                      <ContextMenuTrigger className="h-full w-full overflow-hidden">
                        <HoverCard >
                          <HoverCardTrigger className="h-full w-full">
                            

                           

                            {/* <Card  key={index} > */}
                              {/* <CardContent className=" overflow-hidden"> */}
                              <span className="flex justify-items-center w-full h-full p-6 overflow-hidden" onDoubleClick={
                              ()=>
                              { 
                                if(message.is_dir){
                                  reset(message.path)
                                  updatetabs(message.path)
                                  addToTabHistory(activetabid.toString(),message.path)
                                }
                                // console.log("gridlayout clicked");
                                
                                // setpath()
                                // setpsplitl(splitpath(message.path))
                                // sst(message.name)
                                // useEffect(() => {
                                invoke('list_files', { 
                                  windowname:appWindow?.label,
                                  oid: activetabid.toString(),
                                  path: message.path,
                                  ff: "" 
                                }).catch((e)=>console.error(e));
                                // },[])
                                }
                              }>
                                <div className="w-full">
                                  <div className={`w-full ${showthumbnail?"":"hidden"}`}>
                              {![...IMAGE_TYPES,...VIDEO_TYPES].some(type => message.name.includes(type))?<div 
                              className={`flex bg-gray-200 dark:bg-slate-500 w-full place-items-center h-[200px] overflow-${scrollorauto}`}
                            ></div>:""}
                               {IMAGE_TYPES.some(type => message.name.includes(type))?(
                              <div 
                              className={`flex bg-gray-200 dark:bg-slate-500 w-full place-items-center h-[200px] overflow-${scrollorauto}`}
                            >
                            <LazyLoadImage 
                            className="w-full object-fill" 
                            src={`${convertFileSrc(message.path)}`}/></div>
                            
                            ):""} 
                            {VIDEO_TYPES.some(type => message.name.includes(type))?(
                            <VideoComponent path={message.path} hoverplay={true}/>):""}
                                  </div>
                             <div className="flex flex-row justify-start gap-3 items-center">

                              <div className="overflow-visible">

                              {message.is_dir?<FolderIcon className="h-6 w-6" />:<FileIcon className="h-6 w-6" />}
                              </div>
                              <div className="w-full flex justify-between overflow-hidden">

                                <span className="font-medium text-lg overflow-hidden">{message.name}{message.foldercon>0 ? "(" + message.foldercon + ")" : ""}</span>
                                
                              </div>
                             </div>
                              </div>
                            </span>
                              {/* </CardContent> */}
                            {/* </Card> */}
                            {/* </div> */}
                            
                          </HoverCardTrigger>
                          <HoverCardContent className={`${setcolorpertheme} flex flex-col text-center`} >
                          {message.name}
                          <br/>  
                          {message.path}
                          <br/>
                          {`${message.foldercon>0?`Contains ${message.foldercon} ${message.is_dir?"files":"lines"}`:""}`}
                          <br/>
                          {converttstodt(message.timestamp)}
                          <FRc location={message.path} size={message.size} rawsize={message.rawfs}/>
                          </HoverCardContent>
                        </HoverCard>

                        
                      </ContextMenuTrigger>
                      <ContextMenuContent className=''>
                        <p className='text-sm'>{message.path}</p>
                        <ContextMenuItem onSelect={(e)=>{
                          invoke("newwindow",
                          {
                            // id: (winInfo.tabidsalloted++).toString(),
                            path: message.path,
                            ff:""
                          });

                        }}>Open in new window</ContextMenuItem>
                        <ContextMenuItem onSelect={(e)=>{
                          // reset(message.path)
                          newtab(message.path)
                          // sst("drives://")
                          // updatetabs(message.path)
                        //   // setpath()
                        //   // console.log(message);
                        //   addToTabHistory(activetabid.toString(),"drives://")
                        //   invoke('list_files', { 
                        //     windowname:appWindow?.label,
                        //     oid: activetabid.toString(),
                        //     path: message.path,
                        //     ff: "" 
                        // })
                        }}>Open in new tab</ContextMenuItem>
                        <ContextMenuItem onSelect={()=>{
                          invoke(
                            "addmark",
                            {
                          windowname:appWindow?.label,
                              path: message.path
                            }
                          );
                        }}>Add bookmark</ContextMenuItem>
                        <ContextMenuItem onSelect={(e)=>{
                          useEffect(() => {
                            if (typeof window !== 'undefined'){
              
                              try {
                                navigator.clipboard.writeText(path);
                                console.log('Content copied to clipboard');
                              } catch (err) {
                                console.error('Failed to copy: ', err);
                              }
                            }
                          },[])}}
                        >Copy path to clipboard</ContextMenuItem>
                        <ContextMenuItem onSelect={(e)=>{
                          setfos((old)=>[...old,message.path])
                        }}>Copy</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                    <div className="absolute end-0 ">

                    {!message.is_dir
                                // &&
                                // [...MARKDOWN_TYPES,...PLAIN_TEXT,...IMAGE_TYPES,...].some(type => message.path.includes(type))
                                // &&(message.name.includes(".pdf")||IMAGE_TYPES.some(type => message.name.includes(type))||HTML_TYPE.some(type => message.name.includes(type))||AUDIO_TYPES.some(type => message.name.includes(type)))
                                ?(
                            <Sheet modal={false}>
                            <SheetTrigger className="h-full px-3 p-4 focus:bg-gray-200 focus:dark:bg-gray-700">
                              <HoverCard>
                                <HoverCardTrigger>
                                  <EyeIcon className="h-4 w-4 "/>
                                  </HoverCardTrigger>
                                <HoverCardContent  className={`${setcolorpertheme}`}>
                                Preview
                                </HoverCardContent>
                              </HoverCard>
                              </SheetTrigger>
                              <SheetContent 
                                // style={{ width: `${width}px` }}
                                // onMouseDown={handleMouseDown}
                                // onMouseMove={handleMouseMove}
                                // onMouseUp={handleMouseUp}
                                // onMouseLeave={handleMouseUp}
                                className={`${setcolorpertheme} h-[90%] overflow-hidden`} side={"right"} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                                  {/* <ResizablePanelGroup direction="horizontal" className="pointer-events-none">
                                  <ResizablePanel/>
                                  <ResizableHandle />
                                  <ResizablePanel className={"bg-white dark:bg-gray-800"}> */}
                                   
                          
                                  <ReadFileComp message={message}/>
                                  {/* </ResizablePanel>
                                </ResizablePanelGroup> */}
                                  
                            
                                  {/* <SheetDescription></SheetDescription> */}
                                
                              </SheetContent>
                            </Sheet>):(
                            <div className="">
                              <HoverCard>

                              <HoverCardTrigger>
                              <button className="h-full p-4 px-3 focus:bg-gray-200 focus:dark:bg-gray-700" size={"none"} variant={"ghost"}  onClick={()=>{
                    populatesearchlist(message.path)
                  }}><ScanSearchIcon className="h-4 w-4"/></button>
                  </HoverCardTrigger>
                    <HoverCardContent  className={`${setcolorpertheme}`}>
                    Load folder contents to search
                    </HoverCardContent>
                  </HoverCard>
                            </div>
                            )}
                    </div>
                        </Button>
                        </div>
        
        // <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
        ))}
         
        {/* <span>

          {mdc}
        </span> */}
        </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
     
    // </div>
  )
}

function FolderIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  )
}


function HomeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}


function PencilIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}


function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}


export function Other() {
    
  const [count, addone] = useState(0);

  // Necessary because we will have to use Greet as a component later.
  return (
  <div>
    <h1>Greet</h1>
      <button type="button" onClick={() => {
        // invoke<string>('list_files', { 
        //     // windowname:appWindow?.label,
        //     oid: "0",
        //     path: "drives://",
        //     ff: "" 
        // })
        // let addo=count+1
        addone((oldone)=>oldone+1);
      }
    }>Add One</button>
    <p>
    {count}
    {/* {driveslist} */}
    </p>
  </div>
  );
}
interface pathsplit{
  interfolpath:string,
  pathtofol:string
}
function splitpath(pathInput:string):pathsplit[] {
  let splitat=  /[\\/]/;
  var arr = pathInput.split(splitat); // arr is ["a", "b", "c", "d"]
  var prefixes: string[] = [];
  var prefix = "";
  for (var i = 0; i < arr.length; i++) {
    prefix += arr[i]; // append the current element to the prefix
    prefixes.push(prefix); // add the prefix to the prefixes array
    prefix += "/"; // add a slash for the next iteration
  }
  var fols=[]
  console.log(pathInput.split(splitat))
  fols = pathInput.split(splitat);
  console.log(fols.length);
  let listinpath:pathsplit[]=[];
  for (var i = 0; i < fols.length; i++){ 
  // fols.forEach(
    // function (fol, index) {
      listinpath.push(
        {
          interfolpath:fols[i],
          pathtofol:prefixes[i]
        }
      ) 
      
      // // console.log(index)
    }
    return listinpath;
}
