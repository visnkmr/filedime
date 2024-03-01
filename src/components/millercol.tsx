import { listen } from "@tauri-apps/api/event";
import { pathsplit } from "../shared/tstypes";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { FileItem } from "../shared/types";
interface argprops{
    eachif:pathsplit
}
export default function MillerCol({eachif}:argprops){
    const filesobjinit:FileItem[]=[]
    const [fileslist, setfileslist] = useState(filesobjinit);
    invoke("files_list_for_miller_col",{
        path:eachif.pathtofol
    }).then((e)=>{
        console.log(e)
        // setfileslist(e)
    })
    return <div>
        <button onClick={
        ()=>
        { 
          
      }
    }>
      {/* <TreesIcon className="h-4 w-4 "/> */}
      {eachif.interfolpath}</button>;
        </div>
}