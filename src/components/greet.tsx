'use client'

import FRc from "./findsizecomp"
import { useEffect, useMemo, useRef, useState } from 'react';
import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'
import {VideoComponent} from "./videoplaycomp"
import {ForwardIcon, ArrowLeft, SearchIcon, ArrowRightIcon, PlusIcon, XIcon, LayoutGrid, LayoutList, RefreshCcwIcon, HardDriveIcon, RulerIcon, FolderTreeIcon, FolderClockIcon, LogInIcon, EyeIcon, FileIcon, TerminalIcon, CodeIcon, BookIcon, TreesIcon, ScanSearchIcon, GalleryThumbnailsIcon, MoonIcon, SunIcon, EyeOffIcon, DownloadIcon, FileTextIcon, ArrowUp, ArrowRight, FolderPlus, FilePlus, Folder, Home, Loader2, Plug, Columns} from "lucide-react"
import { Badge } from "./ui/badge"
import {Checkbox} from "./ui/checkbox"
// import { arch, platform, type, version } from '@tauri-apps/api/os';

import '../styles/globals.css'
import ReadFileComp, { IMAGE_TYPES, MARKDOWN_TYPES, PLAIN_TEXT, VIDEO_TYPES } from "./readfile"
import Dupelist from "./ad"
import NewLeaf from "./new"
// import {appWindow as activewindow} from "@tauri-apps/api/window"
import React from 'react';
import { useKeyboardShortcut } from "./keyboardshortcuts";
import { useMouseShortcut } from "./mouseshortcuts";
import { listen } from '@tauri-apps/api/event';
import FiledimeSettings from "./filedimesettings"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizeable"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "./ui/context-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card"
import {
  tabinfo,
  mark,
  parentprops,
  existingfileinfo,
  operationfileinfo,
  pathsplit
} from "../shared/tstypes"
// import Link from "next/link"
import { Button } from "./ui/button"
import { FileItem,DriveItem } from "../shared/types"
import { DataTable, focuscolor, hovercolor } from '../src/components/data-table';
export function converttstodt(ts){

  const dateTime = DateTime.fromMillis(ts * 1000); // Convert timestamp to DateTime object
  const utcDateTime = dateTime.toUTC(); // Convert DateTime object to UTC time
  const utcTime = utcDateTime.toFormat('dd MMM yy'); 
  return utcTime
 }


import {  ColumnDef } from '@tanstack/react-table';
import {  ArrowUpDown } from 'lucide-react';

import { DateTime } from 'luxon';
// import LetterClamp from '../../src/components/letterclamp';
import '../styles/committablestyle.css'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Input } from "./ui/input";
import { useTheme } from "next-themes";

export let scrollorauto="auto";
export let setcolorpertheme="bg-white dark:bg-gray-800"
import { useToast } from "./ui/use-toast"
import { Toaster } from "./ui/toaster"
import { Progress } from "./ui/progress"
import { ToastAction } from "./ui/toast";
import Link from "next/link";
import MillerCol from "./millercol";

export default function Greet() {
  
  const { theme, setTheme } = useTheme()
  // if(activewindow.label!=="settings"){
    const { toast } = useToast()
    
    async function setupAppWindow() {
      console.log(Math.random());
      const appWindow = (await import('@tauri-apps/api/window')).appWindow
      console.log("windowname top---------->"+appWindow.label)
  
      setAppWindow(appWindow)
      const pl = await(await import('@tauri-apps/api/os')).platform()
      console.log(pl)
      console.log("windowname top---------->"+appWindow.label)
      setp(pl)
      const cv = await(await import('@tauri-apps/api/app')).getVersion()
      console.log(cv)
      invoke("checker",{}).then((r)=>{
        console.log(r);
        if( r!==cv){
          toast({
            variant:"destructive",
            title: "Update available",
            description: `v${r} is available fordownload`,
            action: <Button variant={"outline"}><Link target="_blank" href="https://github.com/visnkmr/filedime/releases/latest">Update</Link></Button>,
          })

        }
      })
      
      // console.log("windowname top---------->"+appWindow.label)
    }
  
    useEffect(() => {
      setupAppWindow()
    }, []) 
    const filesobjinit:FileItem[]=[]
    const objinit:string[]=[]
    const driveobjinit:DriveItem[]=[]
    const pathsplitobjinit:pathsplit[]=[]
    const [pathsplitlist, setpsplitl] = useState(pathsplitobjinit);
    const [driveslist, setdriveslist] = useState(driveobjinit);
    const [activetabid,setactivetabid]=useState(0)
    const [listlimit,setll]=useState(true)
    const [layout,setl]=useState("detail")
    const [startstopfilewatch,setstartstopfilewatch]=useState(false)
    const [watchbuttonvisibility,setwbv]=useState(false)
    const [filecount, setfc] = useState(0);
    const [noofpages,setnop]=useState(1);
    const [currentpage,setpageno]=useState(0)
    const [perpage,setperpage]=useState(15)
    const lastcalledtime=useRef()
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
    const [fileopdest,setfod] = useState("");
    const [parentsize,setps] = useState("");
    const [sampletext,sst]=useState("")
    const [filesetcollectionlist,setfscl]=useState(objinit)
    const [custombuttonlist,setcbl]=useState(objinit)
    const [pathsuggestlist,setpsl]=useState(objinit)
    const [appWindow, setAppWindow] = useState()
    const [fileslist, setfileslist] = useState(filesobjinit);
    const [sftype,setsftype]=useState("all")
    const [filestoshow,setfts]=useState(filesobjinit)
    //reflect update per page item count in ui
    useMemo(()=>{
      let filestocount=filestoshow.length;
      !!filestocount && perpage && setnop(Math.ceil(filestocount/perpage))
      setpageno((old)=>{
        console.error(old+"---"+noofpages)
       return old>noofpages?(noofpages-1):(old)
      })
    },[perpage,sftype,filestoshow])
    
    useEffect(()=>{
      setfts(fileslist.filter(function (el) {
        return (searchstring.trim().length>0?
          el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.path.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()):((sftype.trim().length>0?
          (el.ftype===sftype || sftype ==="all"):(true))))
       }))
    },[perpage,sftype,fileslist])
    const [isSheetOpen, setiso] = useState(false);
    function reset(p?:string){
      invoke("checkiffile",{
        path:p
      }).catch((e)=>{

        if(p){
          setpath(p);
          setpsplitl(splitpath(p))
        }
        setsftype("all")
          setfileslist([])
          setfc(0)
          setss("")
          console.log("reset done")
      })
    }
    function listfiles(oid,path){
      let lct=new Date().getTime().toString();
      
      lastcalledtime.current=lct
      invoke('list_files', { 
        starttime:lct,
        windowname:appWindow?.label,
        oid: oid.toString(),
        path: path,
        ff: "" 
    }).catch((e)=>console.error(e))
    reset(path) 


    }
     function activateTab(tab: tabinfo){
      console.log("activating"+JSON.stringify(tab))
        
        setactivetabid(tab.id)
        reset(tab.path)
        listfiles(tab.id,tab.path)
     }
    const [p,setp]=useState("")
    // useEffect(() => {
    //   //check if react is in strict mode
    //   console.log(Math.random());
    //   // let wfp=async()=>{setp(await platform())
    //   // console.log(await platform())};
    //   // wfp();
      
    // }, []);
    function initkeyboardshortcuts()
    {useKeyboardShortcut(()=>{
      newtab("drives://");
    }, {
      ctrlKey: true,
      code: "KeyT",
    }); 
    useKeyboardShortcut(()=>{
      invoke("newwindow",
      {
        // id: (winInfo.tabidsalloted++).toString(),
        path: "drives://",
        ff:""
      });
    }, {
      ctrlKey: true,
      code: "KeyN", 
    });
    useKeyboardShortcut(()=>{
      invoke(
        "addmark",
        {
      windowname:appWindow?.label,
          path: path,
          id: new Date().getTime().toString()
        }
      );
    }, {
      ctrlKey: true,
      code: "KeyD", 
    });
    useKeyboardShortcut(()=>{
      setfos((old)=>[...old,path])
    }, {
      ctrlKey: true,
      code: "KeyC", 
    });
    
    useKeyboardShortcut(()=>{
      reloadsize("excludehidden")
    }, {
      ctrlKey: true,
      code: "KeyH", 
    });
    useKeyboardShortcut((e)=>{
      e.preventDefault(); 
      console.log("closetab")
      if(!tablist)return
      if(tablist?.length<1) return;
      closetab(activetabid);
      activateTab(tablist[tablist.length-1])
    }, {
      ctrlKey: true,
      code: "KeyW", 
    });
    useKeyboardShortcut((e)=>{
      e.preventDefault(); 
      reloadlist()
    }, {
      // ctrlKey: true,
      code: "F5", 
    });
    useKeyboardShortcut(()=>{
      invoke("navbrowsetimeline",{
        tabid:activetabid.toString(),
        dir:true
      }).then((ei)=>{
        console.log(ei)
        // addTofwdHistory(activetabid.toString(),path)
        // addTofwdHistory(activetabid.toString())
        let pathtogoto=ei
        if(pathtogoto){
          
          reset(pathtogoto)
          updatetabs(pathtogoto)
          // setpath()
          // setpsplitl(splitpath(pathtogoto))
          // sst("")
          // useEffect(() => {
            listfiles(activetabid,pathtogoto);
        }
      }).catch((e)=>console.error(e))
    }, {
      altKey: true,
      code: "ArrowLeft", 
    });
    useKeyboardShortcut(()=>{
      invoke("navbrowsetimeline",{
        tabid:activetabid.toString(),
        dir:false
      }).then((ei)=>{
        console.log(ei)
        let pathtogoto=ei
        if(pathtogoto ){
  
          reset(pathtogoto)
          updatetabs(pathtogoto)
          // setpath()
          // setpsplitl(splitpath(pathtogoto))
          // sst("")
          // useEffect(() => {
            listfiles(activetabid,pathtogoto);
        }
      }).catch((e)=>console.error(e))
    }, {
      altKey: true,
      code: "ArrowRight", 
    });
    useKeyboardShortcut(()=>{
      invoke("getparentpath",{
        path
      }).then((ei)=>{
        console.log(ei)
        // addTofwdHistory(activetabid.toString(),path)
        // addTofwdHistory(activetabid.toString())
        let pathtogoto=ei
        if(pathtogoto){
          reset(pathtogoto)
          updatetabs(pathtogoto)
          // setpath()
          // setpsplitl(splitpath(pathtogoto))
          // sst("")
          // useEffect(() => {
            listfiles(activetabid,pathtogoto);
        }
      }).catch((e)=>console.error(e))
    }, {
      altKey: true,
      code: "ArrowUp", 
    });
    useMouseShortcut(()=>{
      // reloadlist()
    },{
      
    })}
    initkeyboardshortcuts()
  
    
    let [hideback,sethb]=useState(true)
    let [hidefwd,sethf]=useState(true)
    useEffect(()=>{
  
      invoke("disablenav",{
        tabid:activetabid.toString(),
        dir:true
      }).then(()=>sethb(false)
      ).catch(()=>sethb(true))
      invoke("disablenav",{
        tabid:activetabid.toString(),
        dir:false
      }).then(()=>sethf(false)
      ).catch(()=>sethf(true))
    },[path])
      const addToTabHistory = (tabId, item=path) => {
        invoke("checkiffile",{
          path:p
        }).catch((e)=>{
          invoke("addtotabhistory",{
            tabid:tabId,
            path:item
          })
        })  
        
     };
   
   const [currentchoice,changechoiceto]=useState("")
  useEffect(()=>{
    // console.log("update listen-----"+lastcalledtime)
    reset() 
    // let printtxt=Math.random(); //to check if listen is being called only once
    const unlisten=listen("folder-size", (event) => {
      let returned=JSON.parse(event.payload);
      if(returned.caller===lastcalledtime.current){
        console.log("foldersize")
        setps(returned.size)
      }
    
      // console.log(data.payload.toString())
    });
    // let unlisten: (() => void) | undefined = undefined
    const unlisten1=listen('list-files', (event) => {
      // console.log(printtxt+"------->"+lastcalledtime.current+"------->"+event)
      let returned=JSON.parse(event.payload);
      // console.log(returned.caller)
      // setlct((returned.caller))
      // console.log(lastcalledtime+"-------"+returned.caller)
          if(returned.caller===lastcalledtime.current){
            let tocompute=JSON.parse(returned.files)
            // console.log(printtxt+"------->"+returned.caller+"---------------->"+JSON.stringify(tocompute))
            setwbv(false)
            setfc((old) => {
              // console.log(old+"------------"+lastcalledtime.current )
              const newFileCount = old + 1;
               {
                setfileslist((plog) => {
                  // console.log(plog)
                  return [...plog, tocompute]
                });
                
              }
              return newFileCount;
             });
          }
          else{
            console.log("obsolete results recieved.")
          }
        // console.log("loading files---->"+event.payload);
    })
    return () => {
        unlisten.then(f => f());
        unlisten1.then(f => f());
    }
  //   return () => {
  //     unlisten?.()
  // }
  },[])
  let progresstotal=useRef()
  const [currentprogress,setcp]=useState(0)
  const [visibleprogress,setvp]=useState(false)
  useEffect(()=>{
   
    const ul1=listen("progress",(data: { payload: number }) => {
      let cp=data.payload as number
      console.log("progress----"+cp)
      console.log("progress----"+JSON.stringify(data))
      setcp((cp))
    })
    listen("processing",(p)=>{
      if((p.payload as string).includes("completed")){
      setvp(false)
      }else
      setvp(true)
    })
    return () => {
      ul1.then(f => f());
  }
  },[]);

    useEffect(() => {
      listen("folder-count",(data: { payload: string }) => {
        progresstotal.current=(data.payload)
      }) 
      listen("start-timer",() => {
        setlv(true)
      })
      listen("stop-timer",() => {
        setlv(false)
      })
      // listen('load', () => {
      //   console.log(`New page loaded --->${window.location.href}`);
        
      // });
      
      listen('dialogshow', (pl) => {
        let recieved=JSON.parse(pl.payload);
        let content=(recieved.content)
        let title=(recieved.title)
        toast({
          variant:"destructive",
          title: title,
          description: content,
        })
      });
      listen("fopprogress", (data: { payload: string }) => {
        let progressinfo = JSON.parse(data.payload);
        console.log(JSON.stringify(progressinfo))
      });
      listen("parent-loc", (data: { payload: string }) => {
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
      
      listen("button-names", (data: { payload: string }) => {
        setcbl(JSON.parse(data.payload) as string[]);
        console.log("winnames: "+data.payload.toString())
      });
      
      listen("fsc", (data: { payload: string }) => {
        // console.log("fscl----->"+JSON.parse(data.payload));
        setfscl(JSON.parse(data.payload));
      });
      listen("load-sresults", (data: { payload: string }) => {
        let fl: FileItem[] = JSON.parse(data.payload) as FileItem[];
        sst("Search Results")
        // console.log("Found----->"+fl.length)
        setfileslist(fl)
        setfc(fl.length)
      });
      listen('list-drives', (event) => {
          // console.log("loading drives---->"+event.payload);
          setdriveslist(JSON.parse(event.payload));
      });
      
      listen("load-marks", (data: { payload:string }) => {
        // console.log("listmarks ")
        setbms(JSON.parse(data.payload) as mark[])
      });
      
    },[])
    useEffect(()=>{
      if(!appWindow)
        return
        if(!startstopfilewatch){
          invoke('senddriveslist', { 
            windowname:appWindow?.label,
        })
        reloadsize("loadmarks")
        invoke("listtabs",{})
        .then((e)=>{
          console.log("onopen---->"+e)
          let tabslist=JSON.parse(e) as string[];
          for (const [index,ei] of tabslist.entries()){
            reset(ei)
            setpath(ei)
            newtab(ei,index.toString());
          }
        })          
        }
    },[appWindow])
    const [showthumbnail,setst]=useState(false)
  
  const columns: ColumnDef<FileItem>[] = [
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
          <div className={`max-w-sm overflow-hidden justify-between flex items-center`}>
           
           <div className="overflow-hidden">
  
            <ContextMenu>
            <ContextMenuTrigger>
              <HoverCard>
                <HoverCardTrigger>
                <button className="w-full h-full flex justify-start whitespace-nowrap " onDoubleClick={
                  ()=>
                  { 
                    let clickpath=path;
                    // console.log("gridlayout clicked");
                      if(is_dir){
                        addToTabHistory(activetabid.toString(),clickpath)
                        reset(clickpath)
                        updatetabs(clickpath)
                      
                        // setpath()
                        // setpsplitl(splitpath(path))
                        // sst(name)
                      }
                    // useEffect(() => {
                      listfiles(activetabid,clickpath);
                    // },[])
                    }
                  }>
                  {/* <CardContent > */}
                  <div className="flex items-center w-full">
                    
                  <div>
  
                    {is_dir?<Folder className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />}
                  </div>
                    {/* <span className="font-medium text-lg"> */}
                    {/* <div className="w-full"> */}
                    <div className=""> 
  
                      {name}{foldercon>0 ? "(" + foldercon + ")" : ""}
                    </div>
                    {/* </div> */}
                      {/* </span> */}
                  {/* </CardContent> */}
                  
                  </div>
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
              <ContextMenuLabel className='text-sm'>{path}</ContextMenuLabel>
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
                    path: path,
                    id: new Date().getTime().toString()
                  }
                );
              }}>Add bookmark</ContextMenuItem>
              <div className="hidden bg-red"></div>
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
           </div>
          <div className="">
  
          <div className=" ">
  
  {!is_dir
              // &&
              // [...MARKDOWN_TYPES,...PLAIN_TEXT,...IMAGE_TYPES,...].some(type => message.path.includes(type))
              // &&(message.name.includes(".pdf")||IMAGE_TYPES.some(type => message.name.includes(type))||HTML_TYPE.some(type => message.name.includes(type))||AUDIO_TYPES.some(type => message.name.includes(type)))
              ?(
          <Sheet modal={false}>
          <SheetTrigger className="h-full px-3 p-4  focus:bg-gray-200 focus:dark:bg-gray-700">
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
                 
        
                <ReadFileComp message={row.original}/>
                {/* </ResizablePanel>
              </ResizablePanelGroup> */}
                
          
                {/* <SheetDescription></SheetDescription> */}
              
            </SheetContent>
          </Sheet>):(
          <div className="">
            <HoverCard>
  
            <HoverCardTrigger>
            <button className="h-full p-4 px-3 focus:bg-gray-200 focus:dark:bg-gray-700" size={"none"} variant={"ghost"}  onClick={()=>{
  populatesearchlist(path)
  }}><ScanSearchIcon className="h-4 w-4"/></button>
  </HoverCardTrigger>
  <HoverCardContent  className={`${setcolorpertheme}`}>
  Load folder contents to search
  </HoverCardContent>
  </HoverCard>
          </div>
          )}
  </div>
                  </div>
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
  ];
  
    
   function addmark(path:String){
    invoke(
      "addmark",
      {
    windowname:appWindow?.label,
        path: path,
        id:new Date().getTime().toString()
      }
    );
   }
   function reloadlist(){
        reset(path)
            // setpath()
            // setpsplitl(splitpath(message.path))
        // invoke the list_files command from the backend with the path as argument
        listfiles(activetabid,path)
  }
  function populatesearchlist(spath){
    invoke(
      "searchload", {
        path:spath
    }).catch((e)=>console.error(e))
  }
  function populateimmediatechildcount(){
    reloadsize("folcount")
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
    invoke("checkiffile",{
      path:p
    }).catch((e)=>{
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
    })
    
  }
  function closetab(closeid){
    invoke("closetab",{
      windowname:appWindow?.label,
      id: closeid.toString(),
    }
    )
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
    function newtab(gotopath?:string,salt=""){
      reset()
      // console.error(gotopath)
      let newtabid=`${new Date().getTime()}${salt}`;
  
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
  
                          addToTabHistory(newtabid.toString(),gotopath)
                          setactivetabid(newtabid)
                          listfiles(newtabid,gotopath);
                        });
    }
    function reloadsize(togglewhat="size"){
      reset(path)
      if(appWindow){
        const thensobj={
        windowname: appWindow?.label,
        togglewhat:togglewhat
      };
      // console.log(appWindow?.label+"------>"+JSON.stringify(thensobj))
      invoke(
        "nosize",
        thensobj);
      }
      listfiles(activetabid,path)
    }
  const [isvalid,setvalid]=useState(true);
    const[dupes,setdupes]=useState([] as operationfileinfo[])
    const[showalertdialog,setsal]=useState(false)
    const[shownewleafdialog,setsnld]=useState(false)
    const[isldir,setild]=useState(false)
    const[dest,setdest]=useState("")
    const [size, setSize] = useState({
      a: 20,
      b: 90,
    });
    const [loadervisible,setlv]=useState(false)
    function goto(message:FileItem){
      if(message.is_dir){
        addToTabHistory(activetabid.toString(),message.path)
        reset(message.path)
        updatetabs(message.path)
      }
        listfiles(activetabid,message.path);
    }
    return (
      <ResizablePanelGroup direction="horizontal" className="overflow-hidden">
        <ResizablePanel defaultSize={size.a}>
        {/* {lastcalledtime.current} */}
        <div className="flex h-full flex-col gap-2">
          <div className="flex p-3  border-b">
            
            <div className="flex flex-row p-2 items-center">
            <div className="pr-3">

            <Loader2 className={`${loadervisible?"h-4 w-4 animate-spin":"hidden"}`}/>
            </div>
            <button className="flex items-center gap-2 font-semibold">
              <Folder className="h-6 w-6" />
              <span className="">Filedime</span>
            </button>
            
            {/* <LogInIcon className="w-4 h-4" onClick={()=>{
              console.log(JSON.stringify(tablist))
            }}/> */}
            <Button className="ml-2" variant={"outline"} onClick={()=>{
              invoke("newspecwindow",{
                winlabel:"settings",
                name:"Settings"
              })
            }}>Settings</Button>
            </div>
            
            {/* <div className="grid items-start px-4 text-sm font-medium"> */}
              
          </div>
          <div className="w-[80%]">

        <Progress className={`${visibleprogress?"m-5":"hidden"} `} value={currentprogress}/>
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
            
          
          <div className="overflow-y-auto">
            
          
              {/* </div> */}
         
              <Dupelist dst={dest} srclist={JSON.stringify(fileopsrc)} dupes={dupes} showad={showalertdialog} setshowad={setsal} setfos={setfos} reloadlist={reloadlist}/>
          {fileopsrc.length>0?( 
          <div className='flex items-center gap-2 font-semibold border-b h-[60px] px-2'>
                 <HoverCard>
              <HoverCardTrigger>
              <Button variant={"outline"} onClick={
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
                    console.log("done");
                    setfos([])
                    setfod("")
                    }
                    else{
                      setdest(path)
                      setdupes(newArray)
                      setsal(true);
                      return 
                    }
                  }).catch((e)=>{
                    console.log("error")
                    console.log("done");
                    setfos([])
                    setfod("")
                  })
                    
                  }
              }>
              {/* <CardDescription className="flex items-center space-x-2 p-2"> */}
              Paste ({fileopsrc.length})
                
              {/* </CardDescription> */}
            </Button>
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
            <nav className="justify-start px-4 text-sm font-medium">
              <button onClick={()=>
                { 
                  addToTabHistory(activetabid.toString(),"drives://")
                    reset("drives://")
                    updatetabs("drives://")
                    listfiles(activetabid,"drives://");
                }
                }
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all  dark:text-gray-400  ${hovercolor} ${focuscolor}`}
                
              >
               <div>

                <Home className="h-4 w-4" />
               </div>
                Home
              </button>
              <button onClick={()=>
                { 
                  addToTabHistory(activetabid.toString(),"downloads://")
                    reset("downloads://")
                    updatetabs("downloads://")
                    listfiles(activetabid,"downloads://");
                }
                }
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all  dark:text-gray-400  ${hovercolor} ${focuscolor}`}
                
              >
                <div>

                <DownloadIcon className="h-4 w-4" />
                </div>
                Downloads
              </button>
              <button onClick={()=>
                { 
                  addToTabHistory(activetabid.toString(),"documents://")
                    reset("documents://")
                    updatetabs("documents://")
                    listfiles(activetabid,"documents://");
                }
                }
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all  dark:text-gray-400  ${hovercolor} ${focuscolor}`}
                
              >
                <div>

                <FileTextIcon className="h-4 w-4" />
                </div>
                Documents
              </button>
              <button
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor}`}
                onClick={()=>
                  { 
                      
                      newtab("drives://");
                  }
                  }
              >
                <div>

                <PlusIcon className="h-4 w-4" />
                </div>
                New Tab
              </button>
            </nav>
          </div>
          <div className="justify-start px-4 text-sm font-medium">

              {bookmarks && bookmarks.length>0 ?(<>
          <span className='h-8'/>
              <h1 className='p-2'>Bookmarks</h1>
              {
                
               bookmarks.map((mark, index) => (
                <ContextMenu>
                  <ContextMenuTrigger>
                <button key={index}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor}`}
                  onClick={()=>
                    { 
                      if(mark.is_dir){
                        reset(mark.path)
                        updatetabs(mark.path)
                      }
                     listfiles(activetabid,mark.path)
                    }
                    }
                >
                   {/* {mark.is_dir?<FolderIcon className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />} */}
                   <div>

                   <BookIcon className="h-6 w-6 mr-3" />
                   </div>
                  {mark.name}
                  
                </button>
                    
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onSelect={()=>{
                      invoke(
                        "removemark",
                        {
                      windowname:appWindow?.label,
                          path: mark.path,
                          id:mark.id,
                        }
                      );
                    }}>Remove bookmark</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                ))

              }
              </>):(null)}
              
              {tablist?(<>
              <h1 className='pt-8 p-2'>Tabs ({tablist.length}) 
              <Button className="ms-2 ps-2 pr-2" size="none" variant={"outline"} onClick={()=>{
                for (const tab of tablist){
                  invoke("closealltabs",{
                    })
                }
                console.log("closed all")
                settbl([])
                reset("drives://")
                setpath("drives://")
                newtab("drives://");
              }}>Close All</Button></h1>
              <div className="overflow-hidden">

              {
                
               tablist.map((tab, index) => (
                // <div key={index} className="overflow-hidden">

                <button 
                className={`w-full flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor} ${activetabid === tab.id ? setcolorpertheme : ''}`}
                  onClick={()=>
                    {                         
                        activateTab(tab)
                    }
                    }
                >
                  {/* <div className="flex flex-row  items-center justify-between"> */}

                  <div>
                    <Folder className="h-4 w-4" />
                    </div>
                    {/* <div className="ps-2  overflow-hidden"> */}
                  <div className="ps-2 w-full text-start">

                  {tab.tabname}
                  </div>
                    {/* </div> */}
                  {/* {activetabid === tab.id ? sampletext: */}
                  {/* } */}
                  <HoverCard>
                    <HoverCardTrigger>
                      <Button size={"default"} onClick={(e)=>{
                        console.log(tab.path)
                        populatesearchlist(tab.path)
                        e.stopPropagation()
                      }}>

                      <ScanSearchIcon className="h-4 w-4"/>
                      </Button>
                   </HoverCardTrigger>
                    <HoverCardContent  className={`${setcolorpertheme}`}>
                    Load folder contents to search
                    </HoverCardContent>
                  </HoverCard>
                    <div >

                  <Button  onClick={(e)=>{
                    e.stopPropagation();
                    
                    closetab(tab.id);
                    activateTab(tablist[tablist.length-1])
                  }} className={`rounded-full ${tablist.length>1 ? '' : 'hidden'}`}>
                    <XIcon  className={`h-4 w-4`} />
                    </Button>
                    </div>
                  {/* </div> */}
                </button>
                // </div>
                ))

              }
              </div>
              </>):(null)}
              
              { driveslist && driveslist.length>0 ?(<>
       <h1 className='pt-8 p-2'>Drives ({driveslist.length})</h1>
       {
         
        driveslist.sort((a, b) => {
          const nameA = a.vendormodel.toUpperCase(); // Convert to uppercase to ignore case sensitivity
          const nameB = b.vendormodel.toUpperCase(); // Convert to uppercase to ignore case sensitivity
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return  1;
          }
          // names must be equal
          return  0;
        }).map((message, index) => (
          
         <ContextMenu>
           <ContextMenuTrigger>
           <HoverCard >
            <HoverCardTrigger>
         <button key={index}
           className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 whitespace-nowrap text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor} line-clamp-1`}
           onClick={()=>
             { 
              if(p==="linux" && message.mount_point.trim().length<1)
              {
                invoke("mountdrive",{
                  windowname:appWindow?.label,
                  uuid:message.uuid,
                  mountpoint:message.uuid
                })
                .then((e)=>{
                  reset(e)
                  updatetabs(e)
                  // setpath()
                  // setpsplitl(splitpath(pathtogoto))
                  // sst("")
                  // useEffect(() => {
                    listfiles(activetabid,e);
                })
                .catch((e)=>{
                  toast({
                    variant:"destructive",
                    title: "Failed",
                    description: `Drive cannot be mounted`,
                    // action: <Button variant={"outline"}><Link target="_blank" href="https://github.com/visnkmr/filedime/releases/latest">Update</Link></Button>,
                  })
                })
              }else{
                let gowhere=""
                if(p==="darwin"){
                  gowhere=message.name
                }
                else{
                  gowhere=message.mount_point
                }
                reset(gowhere)
                updatetabs(gowhere)
                addToTabHistory(activetabid.toString(),gowhere)
                listfiles(activetabid,gowhere);
              }
                 
             }
             }
         >
            {/* {mark.is_dir?<FolderIcon className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />} */}
            <div>
 
            {message.is_removable?(<Plug className="h-6 w-6"/>):(<HardDriveIcon className="h-6 w-6"/>)}
            </div>
             {message.name ? message.name + " (" + message.mount_point.replace("\\","").replace("/","") + ")" : message.mount_point.replace("\\","").replace("/","")}
             
         </button>
         </HoverCardTrigger>
        <HoverCardContent className={`${setcolorpertheme} flex flex-col text-center`} >
        {message.mount_point}
        <br/>  
        {message.disk_type}
        <br/>  
        {message.file_system}
        <br/>
        Free: {message.free}
        <br/>
        Total size: {message.total}
        <br/>  
        {message.vendormodel}
        </HoverCardContent>
      </HoverCard>
           </ContextMenuTrigger>
           <ContextMenuContent>
           <ContextMenuItem onSelect={(e)=>{
                   invoke("newwindow",
                   {
                     path: message.mount_point,
                     ff:""
                   });
 
                 }}>Open in new window</ContextMenuItem>
           <ContextMenuItem onSelect={(e)=>{
                   newtab(message.mount_point)
                 }}>Open in new tab</ContextMenuItem> 
                 {(p && p==="linux" && message.mount_point.trim().length<1)?((<></>)):((<ContextMenuItem onSelect={(e)=>{
                  // if(path===message.mount_point){
                  //   closetab(activetabid)
                  // }
                       invoke("unmountdrive",{
                        windowname:appWindow?.label,
                        uuid:message.uuid,
                        mountpoint:message.mount_point
                      })
                      .then((e)=>{
                        // console.log(e+"-----"+message.uuid)
                        if(path===e){
                          closetab(activetabid)
                          invoke("listtabs",{})
                          .then((e)=>{
                            console.log("onopen---->"+e)
                            let tabslist=JSON.parse(e) as string[];
                            for (const [index,ei] of tabslist.entries()){
                              reset(ei)
                              setpath(ei)
                              newtab(ei,index.toString());
                            }
                          }) 
                        }
                      })
                      .catch((e)=>{
                        toast({
                          variant:"destructive",
                          title: "Failed",
                          description: `Drive cannot be unmounted`,
                          // action: <Button variant={"outline"}><Link target="_blank" href="https://github.com/visnkmr/filedime/releases/latest">Update</Link></Button>,
                        })
                      })
                     }}>Unmount device</ContextMenuItem>
                     ))}
            
         </ContextMenuContent>
         </ContextMenu>
         ))
 
       }
       </>):(null)
 }
          </div>
          </div>
          {/* <div className=" w-full flex"> */}
        </div>
        </ResizablePanel>
        <ResizableHandle className="bg-gray-100" />
        <ResizablePanel defaultSize={size.b} className="flex flex-col pt-3 ps-3">
        <div className="mb-4">
        <Toaster />
<div 
  className={`flex flex-row overflow-${scrollorauto} p-1 gap-2`}
  // className={`flex flex-row hover:${checkifwithinbounds()?"":"overflow-scroll"} p-1`}
>
  <div>

          {/* <Button size={"sm"} variant={"ghost"} className=""> */}

        <HoverCard>
              <HoverCardTrigger>
              <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {layout==="grid"?<LayoutGrid className="h-4 w-4"/>:(null)}
          {layout==="detail"?<LayoutList className="h-4 w-4"/>:(null)}
          {layout==="miller"?<Columns className="h-4 w-4"/>:(null)}
            </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-100 dark:bg-gray-800">
        <DropdownMenuLabel>Choose Layout</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={layout} onValueChange={setl}>
          <DropdownMenuRadioItem value="grid"><LayoutGrid className="h-4 w-4 mr-2"/>Grid</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="detail"><LayoutList className="h-4 w-4 mr-2"/>Detail</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="miller"><Columns className="h-4 w-4 mr-2"/>Mac OS Style</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
            <RefreshCcwIcon className="h-4 w-4"/>
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
          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm'onClick={
                ()=>{
                  setdest(path)
                  setild(true);
                  setsnld(true);
                }
            }>
            <FolderPlus className="h-4 w-4"/>
          </Button>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               New Folder
              </HoverCardContent>
            </HoverCard>
  </div>
  <div>


            <HoverCard>
              <HoverCardTrigger>
          <Button className='rounded-lg border bg-card text-card-foreground shadow-sm'onClick={
                ()=>{
                  setdest(path)
                  setild(false);
                  setsnld(true);
                }
            }>
            <FilePlus className="h-4 w-4"/>
              
          </Button>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               New File
              </HoverCardContent>
            </HoverCard>
  </div>
  <NewLeaf dest={dest} isdir={isldir} showad={shownewleafdialog} setshowad={setsnld}/>
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
            <div className={`
              ${hideback?"hidden":""}
            `} >

            <Button variant={"ghost"}onClick={()=>{
                 invoke("navbrowsetimeline",{
                  tabid:activetabid.toString(),
                  dir:true
                }).then((ei)=>{
                  // console.log(ei)
                  let pathtogoto=ei
                  if(pathtogoto){
                    
                    reset(pathtogoto)
                    updatetabs(pathtogoto)
                      listfiles(activetabid,pathtogoto);
                  }
                }).catch((e)=>console.error(e))
              }}><ArrowLeft className="h-4 w-4"
              /></Button>
            </div>
            <div>

            <Button variant={"ghost"}onClick={()=>{
                 invoke("getparentpath",{
                  path
                }).then((ei)=>{
                  console.log(ei)
                  let pathtogoto=ei
                  if(pathtogoto){
                    reset(pathtogoto)
                    updatetabs(pathtogoto)
                      listfiles(activetabid,pathtogoto);
                  }
                }).catch((e)=>console.error(e))
              }}><ArrowUp className="h-4 w-4"
              /></Button>
            </div>
            <div>

            <Button className={`${hidefwd?"hidden":""} `} variant="ghost"  onClick={()=>{
               invoke("navbrowsetimeline",{
                tabid:activetabid.toString(),
                dir:false
              }).then((ei)=>{
                console.log(ei)
                let pathtogoto=ei
                if(pathtogoto ){

                  reset(pathtogoto)
                  updatetabs(pathtogoto)
                    listfiles(activetabid,pathtogoto);
                }
              }).catch((e)=>console.error(e))
              }}>
              <ArrowRight className="h-4 w-4" 
             />
            </Button>
            </div>
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
                        if (options !== null) {
                          setpsl(options)
                        }
                      })
                      .catch((error:string) => {
                        console.error(error);
                      });
                  }
                }
              />
              
            {/* </div> */}
            <div>

            <Button className={`${isvalid?"":"hidden"}`} onClick={()=>{
              reset(pathitype)
              listfiles(activetabid,pathitype)
            }}>
              Go
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
              (event)=>{
                reset()
                let lct=new Date().getTime();

                lastcalledtime.current=lct
                
                    invoke(
                    "search_try", {
                      starttime:lct,
                      windowname:appWindow?.label,
                      string: searchstring
                    }).catch((e)=>console.error(e))
                  
                }
            }>

            <SearchIcon className="h-4 w-4"/>
            </Button>
            </div>
              <div className="flex items-center">

              <span className=" whitespace-nowrap">{parentsize}</span>
              </div>
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
                  addToTabHistory(activetabid.toString(),eachif.pathtofol)
                  reset(eachif.pathtofol)
                  updatetabs(eachif.pathtofol)
                  listfiles(activetabid,eachif.pathtofol);
              }
            }>
              {/* <TreesIcon className="h-4 w-4 "/> */}
              {eachif.interfolpath}</button>
            }
            return;
        })}
        </div>
        </div>
        {
          layout==="detail" || layout==="grid"?(
            <div className="">

        <div className='grid grid-flow-col justify-start overflow-x-auto'> 
        <Button onClick={()=>setsftype("all")} className="m-2 p-[-5px] whitespace-nowrap min-w-min" variant="ghost" key="all"><Badge variant={"outline"}>all</Badge></Button>
          {
          Object.entries(filesetcollectionlist)
          .sort((a, b) => b[1] - a[1])
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map(([key, value],index)  => (
            <Button 
            onClick={()=>setsftype((old)=>old===key?"all":key)} 
            className="m-2 p-[-5px] whitespace-nowrap min-w-min" 
            variant="ghost" 
            key={index}>
              <Badge variant={"outline"}>
                {key}({value})
                </Badge>
              </Button>
          ))}
        </div>
        </div>
          ):(null) 
        }
        
       
        {
          layout==="detail" ?
          (<span className={`overflow-${scrollorauto} ${(fileslist.length>0)}`}>
        
          <DataTable columns={columns} data={filestoshow} searchstring={searchstring} filetype={sftype}/>
        </span>):null}
        {
          layout==="grid"?(
          <div>
            <div className={`flex flex-row}`}>
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
            filestoshow.sort((b, a) => a.rawfs - b.rawfs);
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
            filestoshow.sort((a, b) => {
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
            filestoshow.sort((a, b) => {
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
            filestoshow.sort((b, a) => a.timestamp - b.timestamp);
          }}
        >
          Date
        </DropdownMenuItem>
      
</DropdownMenuContent>
</DropdownMenu>
{/* </div> */}
                <Button variant={"outline"} className="mr-2 "  onClick={()=>setpageno((old)=>old>0 && old<noofpages?old-1:noofpages-1)}>Previous</Button> 
                <Button variant={"outline"} className="mr-2 "  onClick={()=>setpageno((old)=>old<noofpages-1?old+1:0)}>Next</Button>
                <HoverCard>
                <HoverCardTrigger>
                <Button variant={"outline"}  onClick={()=>setst((old)=>!old)}><GalleryThumbnailsIcon className="h-4 w-4"/></Button>
                </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Show Thumbnails
              </HoverCardContent>
            </HoverCard>
                <p className='ms-3 flex items-center'>Page {currentpage+1} / {noofpages} pages ({filestoshow.length})</p>
                
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
        <div className={`grid sm:grid-cols-2 lg:grid-cols-4 mt-6 overflow-${scrollorauto}}`}>

        
        {
        filestoshow
                    .slice(currentpage*perpage,((currentpage)+1)*perpage)
                    .map((message, index) => (
                      <div key={index} className="m-3 flex flex-row">
                      <Button size={"none"} variant={"outline"} className="relative m-0 h-full w-full flex justify-start overflow-hidden focus:bg-gray-200 focus:dark:bg-gray-700">

                      <ContextMenu >
                      <ContextMenuTrigger className="h-full w-full overflow-hidden">
                        <HoverCard >
                          <HoverCardTrigger className="h-full w-full">
                              <span className="flex justify-items-center w-full h-full p-6 overflow-hidden" onDoubleClick={
                              ()=>
                              { 
                                goto(message)
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

                              {message.is_dir?<Folder className="h-6 w-6" />:<FileIcon className="h-6 w-6" />}
                              </div>
                              <div className="w-full flex justify-between overflow-hidden">

                                <span className="font-medium text-lg overflow-hidden">{message.name}{message.foldercon>0 ? "(" + message.foldercon + ")" : ""}</span>
                                
                              </div>
                             </div>
                              </div>
                            </span>
                            
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
                            path: message.path,
                            ff:""
                          });

                        }}>Open in new window</ContextMenuItem>
                        <ContextMenuItem onSelect={(e)=>{
                          newtab(message.path)
                        }}>Open in new tab</ContextMenuItem>
                        <ContextMenuItem onSelect={()=>{
                          invoke(
                            "addmark",
                            {
                          windowname:appWindow?.label,
                              path: message.path,
                              id:new Date().getTime().toString()
                            }
                          );
                        }}>Add bookmark</ContextMenuItem>
                        <ContextMenuItem onSelect={(e)=>{
                          useEffect(() => {
                            if (typeof window !== 'undefined'){
              
                              try {
                                navigator.clipboard.writeText(message.path);
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
                                className={`${setcolorpertheme} h-[90%] overflow-hidden`} side={"right"} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                                  <ReadFileComp message={message}/>
                              </SheetContent>
                            </Sheet>):(
                            <div className="">
                              <HoverCard>

                              <HoverCardTrigger>
                              <Button className="h-full p-4 px-3 focus:bg-gray-200 focus:dark:bg-gray-700" size={"none"} variant={"ghost"}  onClick={()=>{

                    populatesearchlist(message.path)
                  }}><ScanSearchIcon className="h-4 w-4"/></Button>
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
        
        ))}
        </div>
            </div>):null

        }
        
        {
           
          layout==="miller"?(
            <div className={`flex ms-2 overflow-scroll`}>
          {pathsplitlist
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map((eachif,index)  => {
            if(eachif.pathtofol.trim().length>0){

              return <div className={`flex ms-2`}>
              <MillerCol eachif={eachif} populatesearchlist={populatesearchlist} goto={goto} newtab={newtab} addmark={addmark}/>
              </div>
              
            }
            return;
        })}
        
        </div>
          ):null
        }
        
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  // }
  
  // else{

  // return (
  //         <FiledimeSettings/>
  //       )
  // }
  
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
