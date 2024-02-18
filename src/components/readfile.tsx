import React, { useEffect, useRef, useState } from "react";
// import { fs } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event';
import FRc from "./findsizecomp"
import Panzoom from "@panzoom/panzoom"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card"
import { FileItem,DriveItem } from "../shared/types"

import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'
export const MARKDOWN_TYPES = ['md', 'markdown', 'mdown', 'mkd', 'mkdown', 'mdwn', 'mdtxt', 'mdtext', 'text'];
export const IMAGE_TYPES = ['jpg', 'png', 'gif', 'bmp', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'webp', 'tiff', 'tif', 'ico', 'svg', 'webp'];
export const VIDEO_TYPES = ['mp4', 'webm', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'ocg', 'm4p', 'm4v', 'avi', 'wmv', 'mov', 'qt', 'flv', 'swf'];
export const PLAIN_TEXT = ['txt'];
export const HTML_TYPE = ['html', 'htm', 'xhtml', 'html_vm', 'asp'];
export const AUDIO_TYPES = ['mp3', 'ogg', 'ogm', 'wav', '.m4a', 'webm'];
import { EyeIcon } from "lucide-react";
import { converttstodt, scrollorauto, setcolorpertheme } from "./greet";
import { SheetHeader, SheetTitle } from "./ui/sheet";
import { VideoComponent } from "./videoplaycomp";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
interface rfcprops {
  message:FileItem
}
export default function ReadFileComp({message}:rfcprops){
  const { theme, setTheme } = useTheme()
    async function setupAppWindow() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow
    console.log("windowname top---------->"+appWindow.label)

    setAppWindow(appWindow)
  }
  const [data, setData] = useState("");
  const [mdc,setmdc] = useState("");
  const [startstopfilewatch,setstartstopfilewatch]=useState(false)
  const [appWindow, setAppWindow] = useState()
  useEffect(() => {
    setupAppWindow()
    // console.log("windowname---------->"+winInfo.winname)
    // openTab("drives://")
  }, []) 
  function openmarkdown(htmlfrommd: string) {
    console.log("before editing md is ---->"+htmlfrommd)
    const news=htmlfrommd.replace(/<a\s/g, "<a target='_blank' ");
    console.log("after editing md is ---->"+news)
    setmdc(news);
  }
  useEffect(()=>{
      listen("send-log", (data: { payload: string }) => {
        // console.log("grandloc")
        let status=data.payload;
        switch(status){
            case "stopped":
                console.log("file watching stopped")
                break;
            case "changed":
              if(!MARKDOWN_TYPES.some(type => message.path.includes(type))){

                invoke('highlightfile', { 
                  path: message.path,
                  theme:theme
              })
                .then(result => {
                  // console.log("whats in file:"+result)
                  setData(result)
              })
                .catch(console.error)
              }
              else
              {

                invoke('loadmarkdown', { 
                  path: message.path
              })
                .then(result => {
                  // console.log("whats in file:"+result)
                  openmarkdown(result)
              })
                .catch(console.error)
              }
                break;
        }
        // lastfolder = data.payload.toString();
        // console.log(data.payload.toString())
      });
  },[])
  const [failed,setfailed]=useState(false)
        useEffect(() => {
          
           if(!MARKDOWN_TYPES.some(type => message.path.includes(type))){

            invoke('highlightfile', { 
                  path: message.path,
                  theme:theme
              })
                .then(result => {
                  setfailed(false)
                  // console.log("whats in file:"+result)
                  setData(result)
              })
                .catch((e)=>{
                  setfailed(true)
                  console.error("from rust: "+e);

                })
           }
           else{
            invoke('loadmarkdown', { 
                      path: message.path
                  })
                    .then(result => {
                      // console.log("whats in file:"+result)
                      openmarkdown(result)
                  })
                    .catch(console.error)
           }
        }, [message.path]);
 useEffect(()=>{

   const elem = document.getElementById('panzoom-element')
   if(elem){

     const panzoom = Panzoom(elem, {
      cursor: "default",
      maxScale: 7,
      minScale: 1,
      canvas:true,
      // panOnlyWhenZoomed: true,
      step: 0.1,
      contain:"outside"
     })
    
     elem.parentElement.addEventListener('wheel', 
     function (event: any) {
      if (!event.ctrlKey) return
      const pan = panzoom.getPan()
      panzoom.zoomWithWheel
      (event);
      panzoom.pan(pan.x, pan.y);
    }
    )
   }
 })   
//  useEffect(()=>{
//   const video = document.querySelector("video");

// video.addEventListener("seeking", async (event) => {
//   const range = `bytes=${Math.floor(video.currentTime *  1024)}-${Math.floor(video.currentTime *  1024) +  1024}`;
//   try {
//     const base64VideoChunk = await invoke('serve_video', {
//             path:message.path,
//             range:range
//           });
//     video.src = base64VideoChunk;
//   } catch (error) {
//     console.error('Error loading video chunk:', error);
//   }
// });
//  })
 
//  async function loadVideoChunk(path,range) {
//   try {
//     const base64VideoChunk = await invoke('serve_video',{
//       path:path,
//       range:range
//     });
//     // Assuming you have a video element with id 'videoPlayer'
//     const videoElement = document.getElementById('videoPlayer');
//     videoElement.src = base64VideoChunk;
//   } catch (error) {
//     console.error('Error loading video chunk:', error);
//   }
// }
//  loadVideoChunk(message.path,'bytes=0-1023');
    
    return (
        <>
        

        <div className={`flex flex-row whitespace-nowrap overflow-${scrollorauto}`}>
        <SheetHeader className="pr-2">
          <SheetTitle>{message.name}</SheetTitle>
        </SheetHeader>
        <div className="flex h-full justify-center">

        <HoverCard >
              <HoverCardTrigger>
          <Button variant={"outline"} onClick={
                ()=>{
                  setstartstopfilewatch((old)=>{let newv= !old;
                    if(newv){

                      // console.log("startserve");
                      invoke(
                        "startserver",
                        {
                          windowname:appWindow?.label,
                          pathstr:message.path
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
            Monitor for changes
              
          </Button>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Hot reload (Monitor changes and reload as necessary)
              </HoverCardContent>
            </HoverCard>
        </div>
        </div>
            <div className={`overflow-${scrollorauto}`}>

        {IMAGE_TYPES.some(type => message.name.includes(type))?(
           <div 
            id="panzoom-element"
         >
        <img
        src={`${convertFileSrc(message.path)}`}/></div>
        
        ):""}
          {message.name.includes(".pdf")?(<embed className={"w-full h-full"} src={`${convertFileSrc(message.path)}#toolbar=0&navpanes=1`} type="application/pdf"/>):""}
          {VIDEO_TYPES.some(type => message.name.includes(type))?(<video id="videoPlayer" width="650" controls muted="muted" autoplay>
      <source src={`${convertFileSrc(message.path,"stream")}`} type="video/mp4" />
    </video>):""}
          {HTML_TYPE.some(type => message.name.includes(type))?(<iframe src={message.path} title={message.path}></iframe>):""}
          {AUDIO_TYPES.some(type => message.name.includes(type))?(<audio controls={true} controlsList="nodownload" src={`${convertFileSrc(message.path)}`}></audio>):""}
          {MARKDOWN_TYPES.some(type => message.name.includes(type))?(<div className="grid grid-cols-1" dangerouslySetInnerHTML={{__html: mdc}}></div>):""}
            {/* {PLAIN_TEXT.some(type => name.includes(type))?( */}
          {!failed?(<pre data-type="code">
          <code dangerouslySetInnerHTML={{__html: (data)}}/>
            </pre>):(<>
            {message.name}
                        <br/>  
                        {message.path}
                        <br/>
                        {`${message.foldercon>0?`Contains ${message.foldercon} ${message.is_dir?"files":"lines"}`:""}`}
                        <br/>
                          {converttstodt(message.timestamp)}
                        <FRc location={message.path} size={message.size} rawsize={message.rawfs}/>
            </>)}
            </div>
        </>
    )
}