import { listen } from "@tauri-apps/api/event";
import { pathsplit } from "../shared/tstypes";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { FileItem } from "../shared/types";
interface argprops{
    eachif:pathsplit
}
export default function MillerCol({eachif}:argprops){
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
},[]);
    return <div>
        {fileslist
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map((eachitem,index)  => {
            // if(eachitem.size>0){
                
              return <div>
                {JSON.stringify(eachitem)}
                </div>
            // }
            // return;
        })}
        </div>
}