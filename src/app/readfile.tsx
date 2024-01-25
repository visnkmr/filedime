import React, { useEffect, useRef, useState } from "react";
import { fs } from '@tauri-apps/api'
import { listen } from '@tauri-apps/api/event';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card"
// import hljs from 'highlight.js';

import { invoke,convertFileSrc } from '@tauri-apps/api/tauri'
const MARKDOWN_TYPES = ['md', 'markdown', 'mdown', 'mkd', 'mkdown', 'mdwn', 'mdtxt', 'mdtext', 'text'];
const IMAGE_TYPES = ['jpg', 'png', 'gif', 'bmp', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'webp', 'tiff', 'tif', 'ico', 'svg', 'webp'];
const VIDEO_TYPES = ['mp4', 'webm', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'ocg', 'm4p', 'm4v', 'avi', 'wmv', 'mov', 'qt', 'flv', 'swf'];
const PLAIN_TEXT = ['txt'];
const HTML_TYPE = ['html', 'htm', 'xhtml', 'html_vm', 'asp'];
const AUDIO_TYPES = ['mp3', 'ogg', 'ogm', 'wav', '.m4a', 'webm'];
import { CardContent, Card, CardDescription } from "../components/ui/card"
import { EyeIcon } from "lucide-react";
export default function ReadFileComp({path,name}){
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
    const fetchData = async () => {
      const response = await fs.readTextFile(path);
      console.log(response)
      
      setData(response);
    }
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
              if(!MARKDOWN_TYPES.some(type => path.includes(type))){

                invoke('highlightfile', { 
                  path: path
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
                  path: path
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
       
        useEffect(() => {
          
           const fetchData = async () => {
             const response = await fs.readTextFile(path);
             console.log(response)
             
             setData(response);
           }
           if(!MARKDOWN_TYPES.some(type => path.includes(type))){

            invoke('highlightfile', { 
                  path: path
              })
                .then(result => {
                  // console.log("whats in file:"+result)
                  setData(result)
              })
                .catch(console.error)
           }
           else{
            invoke('loadmarkdown', { 
                      path: path
                  })
                    .then(result => {
                      // console.log("whats in file:"+result)
                      openmarkdown(result)
                  })
                    .catch(console.error)
           }
        }, [path]);
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
      
       
    return (
        <>
        <div className="flex place-content-center whitespace-nowrap overflow-scroll">

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
            Monitor for changes
              
            </CardDescription>
          </Card>
          </HoverCardTrigger>
              <HoverCardContent >
               Hot reload (Monitor changes and reload as necessary)
              </HoverCardContent>
            </HoverCard>
        </div>
            <div className="h-full overflow-scroll">

        {IMAGE_TYPES.some(type => name.includes(type))?(
           <div 
           ref={containerRef} 
           onWheel={handleScroll} 
           onMouseDown={handleMouseDown} 
           onMouseMove={handleMouseMove} 
           onMouseUp={handleMouseUp} 
           onMouseLeave={handleMouseUp} 
           className="relative overflow-hidden"
         >
        <img 
        ref={imgRef}
        alt="Zoomable"
        style={{ transform: `scale(${scale})  translate(${position.x}px, ${position.y}px)`, transition: 'transform 0.2s' }}
        className="w-full" 
        src={`${convertFileSrc(path)}`}/></div>
        
        ):""}
          {name.includes(".pdf")?(<embed className={"w-full h-full"} src={`${convertFileSrc(path)}#toolbar=0&navpanes=1`} type="application/pdf"/>):""}
          {VIDEO_TYPES.some(type => name.includes(type))?(<video controls={true} controlsList="nodownload" src={`${convertFileSrc(path)}`}></video>):""}
          {HTML_TYPE.some(type => name.includes(type))?(<iframe src={path} title={path}></iframe>):""}
          {AUDIO_TYPES.some(type => name.includes(type))?(<audio controls={true} controlsList="nodownload" src={`${convertFileSrc(path)}`}></audio>):""}
          {MARKDOWN_TYPES.some(type => name.includes(type))?(<div className="grid grid-cols-1" dangerouslySetInnerHTML={{__html: mdc}}></div>):""}
            {/* {PLAIN_TEXT.some(type => name.includes(type))?( */}
            <pre data-type="code">
            <code dangerouslySetInnerHTML={{__html: (data)}}/>
             </pre>
            {/* ):""} */}
            </div>
        
        
        </>
    )
}