import { listen } from "@tauri-apps/api/event";
import { pathsplit } from "../shared/tstypes";

import FRc from "./findsizecomp"
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { FileItem } from "../shared/types";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "./ui/context-menu";
import { Folder, FileIcon, EyeIcon, ScanSearchIcon } from "lucide-react";
import path from "path";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { scrollorauto, setcolorpertheme, converttstodt } from "./greet";
import ReadFileComp from "./readfile";
import { Button } from "./ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
import { Sheet,SheetTrigger, SheetContent } from "./ui/sheet";
import { VideoComponent } from "./videoplaycomp";
interface argprops{
    eachif:pathsplit
    populatesearchlist:(path: String) => void;
    goto:(path: FileItem) => void;
    newtab:(path: string,salt?:string) => void;
    addmark:(path: string) => void;
}
export default function MillerCol({eachif,populatesearchlist,goto,newtab,addmark}:argprops){
    const filesobjinit:FileItem[]=[]
    const [fileslist, setfileslist] = useState(filesobjinit);
    useEffect(()=>{
        invoke("files_list_for_miller_col",{
        path:eachif.pathtofol
    }).then((e)=>{
        let itemslist:FileItem[]=JSON.parse(e) as FileItem[];
        console.log(itemslist)
        setfileslist(itemslist)
        // setfileslist(e)
    })
},[eachif.pathtofol]);
    return <div className="overflow-auto">
        {fileslist
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map((message,index)  => {
            // if(eachitem.size>0){
                
              return <div key={index} className="m-3 flex flex-row overflow-hidden">
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
                          
                     <div className="flex flex-row justify-start gap-3 items-center">

                      <div className="overflow-visible">

                      {message.is_dir?<Folder className="h-6 w-6" />:<FileIcon className="h-6 w-6" />}
                      </div>
                      <div className="w-full flex justify-between overflow-hidden">

                        <span className="font-medium text-lg overflow-auto">{message.name}{message.foldercon>0 ? "(" + message.foldercon + ")" : ""}</span>
                        
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
                  },[])
                }}
                >Copy path to clipboard</ContextMenuItem>
                <ContextMenuItem onSelect={(e)=>{
                //   setfos((old)=>[...old,message.path])
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
            // }
            // return;
        })}
        </div>
}