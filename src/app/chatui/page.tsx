"use client"

import { emit, listen } from "@tauri-apps/api/event";
import ChatUI from "../../components/batu/components/chatui"
import { useEffect, useState } from "react";
// import '../styles/globals.css'
export default function chatui(){
    const [fileinfo,setfileinfo]=useState()
    useEffect(()=>{
        const unlisten=listen('chatui', event => {
  console.log('Received:', event.payload);
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
    <ChatUI setasollama={false} />
       </>)
}