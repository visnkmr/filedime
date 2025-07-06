"use client"

import { emit, listen } from "@tauri-apps/api/event";
import ChatUI from "../../components/batu/components/chatui"
import { useEffect, useState } from "react";
import { useToast } from "../../components/ui/use-toast"
import { Toaster } from "../../components/ui/toaster"
// import { zoomsetup } from "../../components/filedimesettings";
import { ZoomableContent } from "../../components/ZoomableContent";
import React from "react";
// import { appWindow } from "@tauri-apps/api/window";
// import '../styles/globals.css'
// async function getCurrentWindowLabel() {
//   try {
//     const label = (await appWindow.title()).replace("FileGPT: ","");
//     console.log("Current window label:", label);
//     return label;
//   } catch (error) {
//     console.error("Error getting window label:", error);
//     return null;
//   }
// }
export default function chatui(){
  // zoomsetup();
      const { toast } = useToast()
  
  // const [path,setpath]=useState("")
  useEffect(()=>{
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
  //   (async()=> {
  //     let fpath=(await getCurrentWindowLabel()) as string
  //     console.log(fpath)
  //     setfileinfo({
  //       name: "string",
  //       path: fpath,
  //       is_dir: false,
  //       size: 999,
  //       rawfs: 999,
  //       lmdate: 999,
  //       timestamp: 999,
  //       foldercon: 999,
  //       ftype: "string",
  //       parent: "string",
  //     })
  //   })()
  },[])
  // getCurrentWindowLabel();
    const [fileinfo,setfileinfo]=useState({
    name: "string",
    path: "",
    is_dir: false,
    size: 999,
    rawfs: 999,
    lmdate: 999,
    timestamp: 999,
    foldercon: 999,
    ftype: "string",
    parent: "string",
  })
    useEffect(()=>{
        const unlisten=listen('chatui', event => {
  console.log('Received:', event.payload);
  setfileinfo(event.payload.myData)
});
// emit('intercomm', { myData: 'Hello from chatui' });
    
        return () => {
            unlisten.then(f => f());
            // unemit.then(f => f());
        }
      //   return () => {
      //     unlisten?.()
      // }
      },[])

// useEffect(()=>{
//      
// },[])
    return (<>
    <ZoomableContent setclass={false}>
      <ChatUI fgptendpoint="localhost" setasollama={false} message={fileinfo} whichgpt={1} /><Toaster />
      </ZoomableContent>
    </>)
}