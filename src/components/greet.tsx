'use client'

import { useEffect, useRef, useState } from "react"
import { FileItem } from "../shared/types"
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { Folder, FileIcon, EyeIcon, ScanSearchIcon } from "lucide-react";
import path from "path";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ReadFileComp, { IMAGE_TYPES, VIDEO_TYPES } from "./readfile";
import { Button } from "./ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
import { Sheet,SheetTrigger, SheetContent } from "./ui/sheet";
import { VideoComponent } from "./videoplaycomp";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "./ui/context-menu"

export let scrollorauto="auto";
export let setcolorpertheme="bg-white dark:bg-gray-800"

export default function Greet() {
  let socket;
  useEffect(() => {
    if (typeof window !== undefined) {
      // execute your logic here
    }
    
    socket = new WebSocket('ws://localhost:8488');
  
      socket.onopen = () => {
        console.log('Connected to WebSocket server');
      };
  
      socket.onmessage = (event:MessageEvent) => {
        console.log(event.data)
        let recieved=JSON.parse(event.data);
        if(recieved[0]==="sendbacktofileslist"){
          console.log(recieved)
        }
        document.getElementById('output').textContent = event.data;
      };
  }, []);

    function sendMessage() {
      const message = document.getElementById('message').value;
      listfiles("drives://")
    // socket.send(message);
      
    }
    const lastcalledtime=useRef()
    function listfiles(path){
      let lct=new Date().getTime().toString();
      
      lastcalledtime.current=lct
      invoke('list_files', { 
        starttime:lct,
        windowname:appWindow?.label,
        oid: "".toString(),
        path: path,
        ff: "" 
    })


    }
    function invoke(functionname,args){
      if(socket){

        let argus=Object.values(args);
        let jsonobj={
           "functionname": functionname, 
           "arguments":JSON.stringify(argus)
        }
        socket.send(JSON.stringify(jsonobj));
      }
    }
  const filesobjinit:FileItem[]=[]
  const [fileslist,setfl] =useState(filesobjinit)
  // useEffect(()=>{
  //   // let unlisten: (() => void) | undefined = undefined
  //   const unlisten1=listen('list-files', (event) => {
  //     // console.log(printtxt+"------->"+lastcalledtime.current+"------->"+event)
  //     let returned=JSON.parse(event.payload);
  //     // console.log(returned.caller)
  //     // setlct((returned.caller))
  //     // console.log(lastcalledtime+"-------"+returned.caller)
  //         if(returned.caller===lastcalledtime.current){
  //           let tocompute=JSON.parse(returned.files)
  //           // console.log(printtxt+"------->"+returned.caller+"---------------->"+JSON.stringify(tocompute))
  //           setwbv(false)
  //           setfc((old) => {
  //             // console.log(old+"------------"+lastcalledtime.current )
  //             const newFileCount = old + 1;
  //              {
  //               setfileslist((plog) => {
  //                 // console.log(plog)
  //                 return [...plog, tocompute]
  //               });
                
  //             }
  //             return newFileCount;
  //            });
  //         }
  //         else{
  //           console.log("obsolete results recieved.")
  //         }
  //       // console.log("loading files---->"+event.payload);
  //   })
  //   return () => {
  //       unlisten.then(f => f());
  //       unlisten1.then(f => f());
  //   }
  // //   return () => {
  // //     unlisten?.()
  // // }
  // },[])
 let showthumbnail=false;
  return(<>
  <div>
  <input type="text" id="message" placeholder="Type a message..."/>
  <button onClick={()=>sendMessage()}>Send</button>

  <div id="output"></div>
  {
  // isgrid &&
  fileslist
                    // .slice(currentpage*perpage,((currentpage)+1)*perpage)
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
                                if(message.is_dir){
                                  // addToTabHistory(activetabid.toString(),message.path)
                                  // reset(message.path)
                                  setfl([])
                                  // updatetabs(message.path)
                                }
                                  listfiles(activetabid,message.path);
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
                          {/* {converttstodt(message.timestamp)} */}
                          {/* <FRc location={message.path} size={message.size} rawsize={message.rawfs}/> */}
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
                          // newtab(message.path)
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
                                navigator.clipboard.writeText(path);
                                console.log('Content copied to clipboard');
                              } catch (err) {
                                console.error('Failed to copy: ', err);
                              }
                            }
                          },[])}}
                        >Copy path to clipboard</ContextMenuItem>
                        <ContextMenuItem onSelect={(e)=>{
                          // setfos((old)=>[...old,message.path])
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

                    // populatesearchlist(message.path)
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
  </>)
}
