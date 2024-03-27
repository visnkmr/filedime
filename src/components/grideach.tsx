import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "./ui/context-menu";
import { Folder, FileIcon, EyeIcon, ScanSearchIcon,BotIcon } from "lucide-react";
import path from "path";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { scrollorauto, setcolorpertheme, converttstodt, supportedfiles } from "./greet";
import { Button } from "./ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
import { Sheet,SheetTrigger, SheetContent } from "./ui/sheet";
import { VideoComponent } from "./videoplaycomp";
import { listen } from "@tauri-apps/api/event";
import { pathsplit } from "../shared/tstypes";
import ReadFileComp, { IMAGE_TYPES, MARKDOWN_TYPES, PLAIN_TEXT, VIDEO_TYPES } from "./readfile"
import FRc from "./findsizecomp"
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { FileItem } from "../shared/types";
import GPTchatinterface from "./gptchatinterface";

interface argprops{
    message:FileItem,
    populatesearchlist:(path: String) => void;
    goto:(path: FileItem) => void;
    newtab:(path: string,salt?:string) => void;
    addmark:(path: string) => void;
    showthumbnail?,
    setfos?,
    

}

export default function EachFromGrid({message,goto,newtab,populatesearchlist,showthumbnail,setfos,addmark}:argprops){
    return(<Button size={"none"} variant={"outline"} className="relative m-0 h-full w-full flex justify-start overflow-hidden focus:bg-gray-200 focus:dark:bg-gray-700">

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
        <br/>
        {<button onClick={()=>{
          let fi:FileItem={
            name: "",
            path: message.parent,
            is_dir: true,
            size: 0,
            rawfs: 0,
            lmdate: 0,
            timestamp: 0,
            foldercon: 0,
            ftype: "",
            parent: "",
          }
          goto(fi)
        }}>Open file location</button>}
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
        addmark(message.path)
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
              ?(<div>
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
          </Sheet>
          {(supportedfiles.includes(message.ftype))?(<Sheet modal={false}>
<SheetTrigger className="h-full px-3 p-4  focus:bg-gray-200 focus:dark:bg-gray-700">
<HoverCard>
<HoverCardTrigger>
<BotIcon className="h-4 w-4 "/>
</HoverCardTrigger>
<HoverCardContent  className={`${setcolorpertheme}`}>
Ask queries about this file
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


<GPTchatinterface message={message}/>
{/* </ResizablePanel>
</ResizablePanelGroup> */}


{/* <SheetDescription></SheetDescription> */}

</SheetContent>
</Sheet>):(null)}
          </div>):(
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
      </Button>)
} 