'use client'

import FRc from "../components/findsizecomp"
import { useEffect, useMemo, useState } from 'react';
import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'

import {ForwardIcon, ArrowLeft, SearchIcon, ArrowRightIcon, PlusIcon, XIcon, LayoutGrid, LayoutList, RefreshCcwIcon, HardDriveIcon, RulerIcon, FolderTreeIcon, FolderClockIcon, LogInIcon, EyeIcon, FileIcon, TerminalIcon, CodeIcon, BookIcon} from "lucide-react"
import { Badge } from "../components/ui/badge"
import ReadFileComp from "./readfile"
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

// import Link from "next/link"
import { CardContent, Card, CardDescription } from "../components/ui/card"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { FileItem,DriveItem } from "../shared/types"
import { DataTable } from '../src/components/data-table';
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
  // is_dir:string
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


export let setcolorpertheme="bg-white dark:bg-gray-800"
export default function Greet() {
  async function setupAppWindow() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow
    console.log("windowname top---------->"+appWindow.label)

    setAppWindow(appWindow)
  }

  useEffect(() => {
    setupAppWindow()
    // console.log("windowname---------->"+winInfo.winname)
    // openTab("/home/roger/Downloads")
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
  const [tablist,settbl]=useState<tabinfo[]>()
  const [bookmarks,setbms]=useState<mark[]>()
  const [path, setpath] = useState("/home/roger/Downloads");
  const [pathitype, setpit] = useState("/home/roger/Downloads");
  const [searchstring,setss] = useState("");
  const [fileopsrc,setfos] = useState("");
  const [fileopdest,setfod] = useState("");
  const [parentsize,setps] = useState("");
  const [sampletext,sst]=useState("Downloads")
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
      setfileslist([])
      setdriveslist([])
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
  
  // if(mdc){
  //   reset()
  // }
  const [tabHistories, setTabHistories] = useState({});
  const [sftype,setsftype]=useState("")
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
      // spi("/home/roger/Downloads")
      setcbl([])
      setfscl([])
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
    
    // openTab("/home/roger/Downloads")
    // invoke('list_files', { 
    //     windowname:winInfo.winname,
    //     oid: activetabid,
    //     path: "/home/roger/Downloads",
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
        reset("/home/roger/Downloads")
        setpath("/home/roger/Downloads")
        newtab();
      }
  },[appWindow])
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
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },

  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          // variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          FileName
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({
      getValue,
      row: {
        original: { path,name,foldercon,size,rawfs,is_dir },
      },
    }) => {
      const rname = getValue()

      return (
        <div>
          <ContextMenu>
          <ContextMenuTrigger>
            <HoverCard>
              <HoverCardTrigger>
              <button className="flex items-center" onDoubleClick={
                ()=>
                { 
                  // console.log("gridlayout clicked");
                  reset(path)
                  updatetabs(path)
                 
                  // setpath()
                  // setpsplitl(splitpath(path))
                  // sst(name)
                  addToTabHistory(activetabid.toString(),path)
                  // useEffect(() => {
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: activetabid.toString(),
                      path: path,
                      ff: "" 
                  });
                  // },[])
                  }
                }>
                {/* <CardContent > */}
                  {is_dir?<FolderIcon className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />}
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
              try {
                navigator.clipboard.writeText(path);
                console.log('Content copied to clipboard');
              } catch (err) {
                console.error('Failed to copy: ', err);
              }
            }}>Copy path to clipboard</ContextMenuItem>
            <ContextMenuItem onSelect={(e)=>{
              setfos(path)
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
  function newtab(){
    let newtabid=new Date().getTime();
                      invoke(
                        "tabname",
                        {
                          path:path,
                        }
                      ).then((returned:string)=>{
                        console.log("what was returned....."+returned)
                        invoke(
                          "newtab",
                          {
                            windowname:appWindow?.label,
                            oid: newtabid.toString(),
                            path: path,
                            ff: ""
                          }
                        );
                        
                        settbl((old)=>{
                          return (old && old?.length>0)?
                          [...old,{
                            id:newtabid,
                            path:path,
                            ff:"",
                            tabname:returned,
                            history:[]
                          } as tabinfo]:
                          [{
                            id:newtabid,
                            path:path,
                            ff:"",
                            tabname:returned,
                            history:[]
                          } as tabinfo]
                        
                        })
      // console.log("opened tab now tablist is "+JSON.stringify(tablist))

                        reset()
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
                        addToTabHistory(newtabid.toString(),path)
                        // addTofwdHistory(newtabid.toString(),path)
                        invoke('list_files', { 
                          windowname:appWindow?.label,
                          oid: newtabid.toString(),
                          path: path,
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
  return (
    <div className="grid grid-cols-[300px_1fr] h-screen">
      <aside className="border-r bg-gray-100/40 dark:bg-gray-800/40">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
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
         

          {fileopsrc?( 
          <div className='flex items-center gap-2 font-semibold border-b h-[60px] px-2'>
                 <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                  ()=>{
                    invoke('fileop_with_progress', { 
                      windowname:appWindow?.label,
                      src:fileopsrc,
                      dst:path,
                      removefile:false
                  }).then(()=>{
                    console.log("done");
                    setfos("")
                    setfod("")
                    reset(path)
                    sst(path)
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: activetabid.toString(),
                      path: path,
                      ff: "" 
                  })
                    
                  })
                  }
              }>
              <CardDescription className="flex items-center space-x-2 p-2">
              Paste
                
              </CardDescription>
            </Card>
            </div>
              )
              :(null)}
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <button onClick={()=>
                { 
                    reset("/home/roger/Downloads")
                    // sst("/home/roger/Downloads")
                    updatetabs("/home/roger/Downloads")
                    // setpath()
                    // console.log(message);
                    addToTabHistory(activetabid.toString(),"/home/roger/Downloads")
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: activetabid.toString(),
                      path: "/home/roger/Downloads",
                      ff: "" 
                  })
                }
                }
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                
              >
                <HomeIcon className="h-4 w-4" />
                Home
              </button>
              {/* <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900  transition-all hover:text-gray-900  dark:text-gray-50 dark:hover:text-gray-50"
                href="#"
              ><FolderIcon className="h-4 w-4" />{sampletext}</Link> */}
              <button
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                
              >
                <TrashIcon className="h-4 w-4" />
                Trash
              </button>
              <button
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                onClick={()=>
                  { 
                      // setfileslist([])
                      // setdriveslist([])
                      // sst("/home/roger/Downloads")
                      // setpath("/home/roger/Downloads")
                      // setss("")
                      // console.log(message);
                      
                      // openTab("/home/roger/Downloads");
                      
                      newtab();
                  }
                  }
              >
                <PlusIcon className="h-4 w-4" />
                New Tab
              </button>
              
              {bookmarks && bookmarks.length>0 ?(<>
              <span className='h-16'/>
              <h1 className=''>Bookmarks</h1>
              {
                
               bookmarks.map((mark, index) => (
                <ContextMenu>
                  <ContextMenuTrigger>
                <button key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50`}
                  onClick={()=>
                    { 
                      invoke(
                        "newtab",
                        {
                          windowname:appWindow?.label,
                          oid: activetabid.toString(),
                          path: mark.path,
                          ff: ""
                        }
                      );
                        // setfileslist([])
                        // setdriveslist([])
                        // sst("/home/roger/Downloads")
                        // setpath("/home/roger/Downloads")
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
              <span className='h-16'/>
              {tablist?(<>
              <h1 className=''>Tabs</h1>
              {
                
               tablist.map((tab, index) => (
                <button key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 ${activetabid === tab.id ? setcolorpertheme : ''}`}
                  onClick={()=>
                    { 
                        // setfileslist([])
                        // setdriveslist([])
                        // sst("/home/roger/Downloads")
                        // setpath("/home/roger/Downloads")
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
                  <XIcon className={`h-4 w-4  ${tablist.length>1 ? '' : 'hidden'}`} onClick={(e)=>{
                    e.stopPropagation();
                    closetab(tab.id);
                    activateTab(tablist[tablist.length-1])
                  }}/>
                </button>
                ))

              }
              </>):(null)}
            </nav>
          </div>
        </div>
      </aside>
      <main className="flex flex-col p-6 overflow-hidden">
        <div className='flex flex-row mb-4'>
        <HoverCard>
              <HoverCardTrigger>
            <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                ()=>{
                  setig((old)=>{return !old})
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
            {isgrid?<LayoutGrid className="h-4 w-4"/>:<LayoutList className="h-4 w-4"/>}
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent className={`${setcolorpertheme}`} >
               List / Grid
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger>
          <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                ()=>{
                  reloadlist()
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
            <RefreshCcwIcon className="h-4 w-4"/>
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Reload
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
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
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Show size of folder
              </HoverCardContent>
            </HoverCard>
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
            <HoverCard>
              <HoverCardTrigger>
          <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                ()=>{
                  populateimmediatechildcount()
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
            <FolderTreeIcon className="h-4 w-4"/>
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent   className={`${setcolorpertheme}`}>
               Count immediate children of folders
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger>
          <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4'onClick={
                ()=>{
                  recentfiles()
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
            <FolderClockIcon className="h-4 w-4"/>
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Recent Files
              </HoverCardContent>
            </HoverCard>
        {custombuttonlist.map((bn, index) => (
          <Card className='rounded-lg border bg-card text-card-foreground shadow-sm mr-4' key={index} onClick={
                ()=>{
                  invoke(
                    "otb",
                    {
                      bname: bn,
                      path: path,
                    }
                    );
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
              <CodeIcon className="h-4 w-4" />
              <span className="font-medium text-sm">{bn}</span>
            </CardDescription>
          </Card>
            ))}
        </div>
      <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* <Button size="sm" variant="ghost"> */}
              <ArrowLeft className={` ${getTabHistoryLength(activetabid.toString())>0?"h-4 w-4":"hidden"}`} 
              onClick={()=>{
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
              }} />
            {/* </Button> */}
            <Button size="sm" variant="ghost">
              <ForwardIcon className={` ${getTabfwdLength(activetabid.toString())>0?"h-4 w-4":"hidden"}`} 
              onClick={()=>{
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
              }}/>
            </Button>
          </div>
          <div className="flex flex-grow items-center gap-4">
            <div className="flex-grow">
            <datalist id="path-list">
            {pathsuggestlist.map((message, index) => (
              <option key={index} value={message}/>
            ))}
            </datalist>
              <input
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              
            </div>
            <ArrowRightIcon className={`${isvalid?"":"hidden"}`} onClick={()=>{
               reset(pathitype)
               updatetabs(pathitype)
              //  setpath(message.name)
              //  sst(message.path)
              addToTabHistory(activetabid.toString(),pathitype)
              invoke(
                "list_files",
                {
                windowname:appWindow?.label,
                oid: activetabid.toString(),
                path: pathitype,
                ff: ""
                }
                )
            }}/>
            <div className="flex-grow max-w-[20%]">
              <input
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            </div>
            <SearchIcon onClick={
              ()=>{
                invoke(
                  "search_try", {
                    windowname:appWindow?.label,
                    // path: pathInput.value,
                    string: searchstring
                })
              }
            }/>
            <div className="flex items-center gap-2">
              <span>{parentsize}</span>
              {/* <Button variant="ghost">Tab 2</Button>
              <Button variant="ghost">Tab 3</Button> */}
            </div>
          </div>
        </div>
        <div className='flex items-center space-x-6 mb-6 '>
          {pathsplitlist
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map((eachif,index)  => (
            <button key={index} onClick={
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
          }>{eachif.interfolpath}</button>
          ))}
        </div>
        <div className="">

        <div className='grid grid-flow-col overflow-x-auto'>
        <Badge onClick={()=>setsftype("all")} className="mr-4 mb-4 whitespace-nowrap min-w-min" variant="outline" key="all">all</Badge>
          {
          Object.entries(filesetcollectionlist)
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map(([key, value],index)  => (
            <Badge onClick={()=>setsftype(key)} className="mr-4 mb-4 whitespace-nowrap min-w-min" variant="outline" key={index}>{key}({value})</Badge>
          ))}
        </div>
        </div>
        <span className="flex flex-row space-x-4">

        <h1 className="font-semibold text-lg md:text-2xl">{fileslist.length>0||watchbuttonvisibility?sampletext:"Drives"} ({fileslist.length>0?filecount:driveslist.length})</h1>
        <Button className={`border border-b-2  p-2 border-gray-900 ${fileslist.length<500?"hidden":""}`} onClick={()=>{
              setll((old)=>{return !old});
            }}>Show all</Button>
        </span>
        <p>{searchstring.trim().length>0?"":path}</p>
        <span className={(fileslist.length>0) && !isgrid ? 'block' : 'hidden'}>

          <DataTable columns={columns} data={fileslist} searchstring={searchstring} filetype={sftype}/>
        </span>
        <div className={`${!isgrid?"grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-scroll":"space-y-4 overflow-scroll"} mt-6`}>
          {/* <Other/> */}
        {driveslist.filter(function (el) {
                      return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
                    }).map((message, index) => (
                      <div className={`${!isgrid?"":"flex  "}`}>
          <ContextMenu key={index}>
          <ContextMenuTrigger>
          
            <Card key={index} onClick={
                ()=>
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
                })
              }
            }>
            <CardContent className="flex items-center space-x-4">
              <HardDriveIcon className="h-6 w-6" />
              <span className="font-medium text-lg ">{message.name ? message.name + "(" + message.mount_point + ")" : message.mount_point}</span>
            </CardContent>
          </Card>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <p className='pl-4'>{message.mount_point}</p>
            <ContextMenuItem>Open in new tab</ContextMenuItem>
            <ContextMenuItem>Open in new window</ContextMenuItem>
            <ContextMenuItem>Add bookmark</ContextMenuItem>
            <ContextMenuItem>Copy to clipboard</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
                         </div>
        // <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
        ))}
        </div>
        <DropdownMenu>
        <DropdownMenuTrigger className="p-4" asChild>
          <Button 
            variant='outline' 
            className='ml-auto'>
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
                  }}
                >
                  Date
                </DropdownMenuItem>
              
        </DropdownMenuContent>
      </DropdownMenu>
        <div className={`grid sm:grid-cols-2 lg:grid-cols-4 mt-6 overflow-scroll`}>
        {isgrid && fileslist.filter(function (el) {
                     return (searchstring.trim().length>0?
                       el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.path.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()):((sftype.trim().length>0?
                       (el.ftype===sftype || sftype ==="all"):(true))))
                    })
                    .slice(0,listlimit?(fileslist.length>500?500:fileslist.length):fileslist.length)
                    .map((message, index) => (
                     
          <ContextMenu key={index}>
          <ContextMenuTrigger>
            <HoverCard>
              <HoverCardTrigger>
             
                <Card className="m-3" key={index} onDoubleClick={
                  ()=>
                  { 
                    // console.log("gridlayout clicked");
                    reset(message.path)
                    updatetabs(message.path)
                    addToTabHistory(activetabid.toString(),message.path)
                    // setpath()
                    // setpsplitl(splitpath(message.path))
                    // sst(message.name)
                    // useEffect(() => {
                      invoke('list_files', { 
                        windowname:appWindow?.label,
                        oid: activetabid.toString(),
                        path: message.path,
                        ff: "" 
                    });
                    // },[])
                    }
                  }>
                  <CardContent className="flex items-center space-x-4">
                  {message.is_dir?<FolderIcon className="h-6 w-6" />:<FileIcon className="h-6 w-6" />}
                    <span className="font-medium text-lg">{message.name}{message.foldercon>0 ? "(" + message.foldercon + ")" : ""}</span>
                    {!message.is_dir
                    // &&(message.name.includes(".pdf")||IMAGE_TYPES.some(type => message.name.includes(type))||HTML_TYPE.some(type => message.name.includes(type))||AUDIO_TYPES.some(type => message.name.includes(type)))
                    ?(
                <Sheet modal={false}>
                <SheetTrigger><EyeIcon className="h-4 w-4"/></SheetTrigger>
                  <SheetContent 
                    // style={{ width: `${width}px` }}
                    // onMouseDown={handleMouseDown}
                    // onMouseMove={handleMouseMove}
                    // onMouseUp={handleMouseUp}
                    // onMouseLeave={handleMouseUp}
                    className={`${setcolorpertheme}`} side={"right"} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                      {/* <ResizablePanelGroup direction="horizontal" className="pointer-events-none">
                      <ResizablePanel/>
                      <ResizableHandle />
                      <ResizablePanel className={"bg-white dark:bg-gray-800"}> */}
                        <SheetHeader>
                        <SheetTitle>{message.name}</SheetTitle>
                      </SheetHeader>
              
                      <ReadFileComp path={message.path} name={message.name}/>
                      {/* </ResizablePanel>
                    </ResizablePanelGroup> */}
                      
                
                      {/* <SheetDescription></SheetDescription> */}
                    
                  </SheetContent>
                </Sheet>):""}
                  </CardContent>
                </Card>
                
              </HoverCardTrigger>
              <HoverCardContent className={`${setcolorpertheme} flex flex-col`} >
             
                
               {message.path}
               <br/>
               {`${message.foldercon>0?`Contains ${message.foldercon} ${message.is_dir?"files":"lines"}`:""}`}
               
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
              // openTab(message.path)
              invoke(
                "newtab",
                {
                  windowname:appWindow?.label,
                  oid: activetabid.toString(),
                  path: message.path,
                  ff: ""
                }
              );
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
              try {
                navigator.clipboard.writeText(message.path);
                console.log('Content copied to clipboard');
              } catch (err) {
                console.error('Failed to copy: ', err);
              }
            }}>Copy path to clipboard</ContextMenuItem>
            <ContextMenuItem onSelect={(e)=>{
              setfos(message.path)
            }}>Copy</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        // <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
        ))}
         
        {/* <span>

          {mdc}
        </span> */}
        </div>
        {/* <h2 className="font-semibold text-lg md:text-xl mt-6">Recent Files</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>report.txt</TableCell>
              <TableCell>15 KB</TableCell>
              <TableCell>Dec 1, 2023</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost">
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button size="icon" variant="ghost">
                  <TrashIcon className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>image.png</TableCell>
              <TableCell>500 KB</TableCell>
              <TableCell>Nov 30, 2023</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost">
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button size="icon" variant="ghost">
                  <TrashIcon className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table> */}
      </main>
    </div>
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
        //     path: "/home/roger/Downloads",
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
