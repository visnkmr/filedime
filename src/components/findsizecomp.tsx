import { invoke } from '@tauri-apps/api/tauri'
import { useState } from "react";

export default function FSc({location,size,rawsize}){
    const [buttonText, setButtonText] = useState(rawsize>0?size:"Compute Size");

 const handleClick = async (csfpath) => {
   try {
     const size = await invoke("foldersize", { path: csfpath });
     setButtonText(size);
   } catch (err) {
     console.error(err);
   }
 };
    return (
        <button onClick={() => handleClick(location)}>{buttonText}</button>
    )
}