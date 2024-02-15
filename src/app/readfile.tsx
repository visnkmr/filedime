import React, { useEffect, useRef, useState } from "react";
// import { fs } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event';
import FRc from "../components/findsizecomp"
import Panzoom from "@panzoom/panzoom"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card"
// import hljs from 'highlight.js';
import { FileItem,DriveItem } from "../shared/types"

import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'
export const MARKDOWN_TYPES = ['md', 'markdown', 'mdown', 'mkd', 'mkdown', 'mdwn', 'mdtxt', 'mdtext', 'text'];
export const IMAGE_TYPES = ['jpg', 'png', 'gif', 'bmp', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'webp', 'tiff', 'tif', 'ico', 'svg', 'webp'];
export const VIDEO_TYPES = ['mp4', 'webm', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'ocg', 'm4p', 'm4v', 'avi', 'wmv', 'mov', 'qt', 'flv', 'swf'];
export const PLAIN_TEXT = ['txt'];
export const HTML_TYPE = ['html', 'htm', 'xhtml', 'html_vm', 'asp'];
export const AUDIO_TYPES = ['mp3', 'ogg', 'ogm', 'wav', '.m4a', 'webm'];
import { CardContent, Card, CardDescription } from "../components/ui/card"
import { EyeIcon } from "lucide-react";
import { converttstodt, scrollorauto, setcolorpertheme } from "./greet";
import { SheetHeader, SheetTitle } from "../components/ui/sheet";
import { VideoComponent } from "./videoplaycomp";
import { useTheme } from "next-themes";
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
    // const fetchData = async () => {
    //   const response = await fs.readTextFile(message.path);
    //   console.log(response)
      
    //   setData(response);
    // }
    // listen("load-markdown", (data: { payload: string }) => {
    //     openmarkdown(data.payload)
    //   });
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
          
          //  const fetchData = async () => {
          //    const response = await fs.readTextFile(message.path);
          //    console.log(response)
             
          //    setData(response);
          //  }
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
        // useEffect(() => {
        //   hljs.initHighlighting();
        //  }, []);
        const imgRef = useRef(null);
 const containerRef = useRef(null);
 const [scale, setScale] = useState(1);
 const [position, setPosition] = useState({ x: 0, y: 0 });
 const [isDragging, setIsDragging] = useState(false);
 const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

 const handleScroll = (event) => {
    event.preventDefault();
    const delta = event.deltaY || event.detail || event.wheelDelta;
    setScale((prevScale) => prevScale + delta * -0.001);
    // Clamp the scale value to prevent scaling too far in or out
    setScale((prevScale) => Math.min(Math.max(1, prevScale), 5));
 };

 const handleMouseDown = (event) => {
    setIsDragging(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
 };

 const handleMouseMove = (event) => {
  if (!isDragging) return;
    const dx = event.clientX - lastMousePos.x;
    const dy = event.clientY - lastMousePos.y;

    // Calculate the maximum allowed values for the x and y positions
    const maxX = (containerRef.current.offsetWidth - imgRef.current.offsetWidth / scale) / 2;
    const maxY = (containerRef.current.offsetHeight - imgRef.current.offsetHeight / scale) / 2;

    // Clamp the new position within the limits
    const newX = Math.min(Math.max(-maxX, position.x + dx), maxX);
    const newY = Math.min(Math.max(-maxY, position.y + dy), maxY);

    setPosition({ x: newX, y: newY });
    setLastMousePos({ x: event.clientX, y: event.clientY });
 };

 const handleMouseUp = () => {
    setIsDragging(false);
 };
 useEffect(()=>{

   const elem = document.getElementById('panzoom-element')
   const panzoom = Panzoom(elem, {
    cursor: "default",
    maxScale: 7,
    minScale: 1,
    canvas:true,
    // panOnlyWhenZoomed: true,
    step: 0.1,
    contain:"outside"
   })
  //  panzoom.pan(10, 10)
  //  panzoom.zoom(2, { animate: true })
  
   elem.parentElement.addEventListener('wheel', 
   function (event: any) {
    if (!event.ctrlKey) return
    const pan = panzoom.getPan()
    panzoom.zoomWithWheel
    (event);
    panzoom.pan(pan.x, pan.y);
  }
  )
 })
 
 // Panning and pinch zooming are bound automatically (unless disablePan is true).
 // There are several available methods for zooming
 // that can be bound on button clicks or mousewheel.
//  button.addEventListener('click', panzoom.zoomIn)
//  elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
       
    return (
        <>
        

        <div className={`flex flex-row whitespace-nowrap overflow-${scrollorauto}`}>
        <SheetHeader className="pr-2">
                                    <SheetTitle>{message.name}</SheetTitle>
                                  </SheetHeader>
        <div className="flex h-full justify-center">

        <HoverCard >
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
            <CardDescription className="flex items-center space-x-2 p-2">
            Monitor for changes
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent  className={`${setcolorpertheme}`}>
               Hot reload (Monitor changes and reload as necessary)
              </HoverCardContent>
            </HoverCard>
        </div>
        </div>
            <div className={`h-[90%] overflow-${scrollorauto}`}>

        {IMAGE_TYPES.some(type => message.name.includes(type))?(
           <div 
            id="panzoom-element"
         >
        <img
        src={`${convertFileSrc(message.path)}`}/></div>
        
        ):""}
          {message.name.includes(".pdf")?(<embed className={"w-full h-full"} src={`${convertFileSrc(message.path)}#toolbar=0&navpanes=1`} type="application/pdf"/>):""}
          {VIDEO_TYPES.some(type => message.name.includes(type))?(<VideoComponent path={message.path} hoverplay={false}/>):""}
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

            
            {/* ):""} */}
            </div>
        
        
        
        </>
    )
}