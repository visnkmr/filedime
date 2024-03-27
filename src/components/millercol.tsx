import { listen } from "@tauri-apps/api/event";
import { pathsplit } from "../shared/tstypes";

import FRc from "./findsizecomp"
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { FileItem } from "../shared/types";
import EachFromGrid from "./grideach";

interface argprops{
    eachif:pathsplit
    populatesearchlist:(path: String) => void;
    goto:(path: FileItem) => void;
    newtab:(path: string,salt?:string) => void;
    addmark:(path: string) => void;
    searchstring:String,
    sftype:String,
    showthumbnail?
}
export default function MillerCol({eachif,populatesearchlist,goto,newtab,addmark,searchstring,sftype,showthumbnail}:argprops){
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
},[eachif.pathtofol]);
    return <>
    <div className="flex flex-col text-center mt-3 mb-3">

    <p>{eachif.interfolpath}</p>
    <div className="overflow-auto max-w-96">
      
        {fileslist.filter(function (el) {
        return (searchstring.trim().length>0?
          el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()):((sftype.trim().length>0?
          (el.ftype===sftype || sftype ==="all"):(true))))
       })
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map((message,index)  => {
            // if(eachitem.size>0){
                
              return <div key={index} className="m-3 flex flex-row overflow-hidden">
                <EachFromGrid message={message} goto={goto}  populatesearchlist={populatesearchlist} newtab={newtab} addmark={addmark} showthumbnail={showthumbnail}/>
                </div>
            // }
            // return;
        })}
        </div>
    </div>
    </>
}