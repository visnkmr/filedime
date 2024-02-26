'use client'

import { useEffect, useState } from "react"
import { FileItem } from "../shared/types"


export default function Greet() {
  const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      document.getElementById('output').textContent = event.data;
    };

    function sendMessage() {
      const message = document.getElementById('message').value;
      invoke('list_files', { 
        starttime:"123",
          windowname:"appWindow?.label",
          oid: "oid.toString()",
          path: "/home",
          ff: "" 
    })
    // socket.send(message);
      
    }
    function invoke(functionname,args){
      let argus=Object.values(args);
      let jsonobj={
         "functionname": functionname, 
         "arguments":JSON.stringify(argus)
      }
      socket.send(JSON.stringify(jsonobj));
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
  return(<>
  <div>
  <input type="text" id="message" placeholder="Type a message..."/>
  <button onClick={()=>sendMessage()}>Send</button>
  <div id="output"></div>
    </div>
  </>)
}
