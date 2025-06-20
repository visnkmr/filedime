"use client"

import { emit, listen } from "@tauri-apps/api/event";
import ChatUI from "../../components/batu/components/chatui"
import { useEffect, useState } from "react";
// import '../styles/globals.css'
export default function chatui(){
    const [fileinfo,setfileinfo]=useState({
    name: "string",
    path: "set path here",
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
emit('intercomm', { myData: 'Hello from chatui' });
    
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
    <ChatUI setasollama={false} message={fileinfo} />
       </>)
}