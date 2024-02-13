//exclude hidden
//restore tabs on open
//include folder in search
//show size of folders
//save history of tabs
//load search list
//showchildfoldercount
//config folder location
import React, { useEffect, useState } from "react";
import EachSetting from "./switchsettingseach"
import { invoke } from "@tauri-apps/api/tauri";
import { FolderIcon } from "lucide-react";
interface stateinfo{
    excludehidden:boolean,
    sessionstore:boolean,
    includefolder:boolean,
    childcount:boolean,
    folsize:boolean,
    cfpath:string,
    cfpathsize:string,
}
function reloadsize(togglewhat="size"){
    console.log("loading size js---->1");
      const thensobj={
      windowname:"",
      togglewhat:togglewhat
    };
    invoke(
      "nosize",
      thensobj);
    console.log("loading size js----->2")
  }

//display system info using os api
export default function FiledimeSettings(){
    // const { theme, setTheme } = useTheme()
    const [datafromstngs,setdfs]=useState<React.JSX.Element>()
    useEffect(()=>{
        invoke("configfolpath",{}).then((e)=>{
            console.log(e)
            let stateinf=JSON.parse(e) as stateinfo;
            setdfs(<>
                <EachSetting name="Exclude hidden files" callback={()=>{reloadsize("excludehidden")}} currentstatus={stateinf.excludehidden}/>
                    <EachSetting name="Restore tabs on open" callback={()=>{}} currentstatus={stateinf.sessionstore}/>
                    <EachSetting name="Include folder names in search" callback={()=>{reloadsize("includefolder")}} currentstatus={stateinf.includefolder}/>
                    <EachSetting name="Compute folder sizes" callback={()=>{reloadsize()}} currentstatus={!stateinf.folsize}/>
                    <EachSetting name="Estimate folder child count" callback={()=>{reloadsize("folcount")}} currentstatus={stateinf.childcount}/>
                    <p className="font-semibold">Config files are stored @ {stateinf.cfpath} ({stateinf.cfpathsize})</p>
                </>)
        })
        
    },[])
    return (
    <>
    <div className="w-full h-full flex flex-col items-center overflow-scroll p-4 gap-2">
        <div className="flex flex-row font-semibold items-center gap-2">

    <FolderIcon className="h-6 w-6" />
              <span className="">Filedime</span>
        </div>
        {datafromstngs}
        <div className="font-bold">
            Source Code <a target="_blank" href="https://github.com/visnkmr/filedime" className="text-blue-600"> Filedime</a>
        </div>
        <div className="font-bold">
            Made by <a target="_blank" href="https://visnkmr.github.io" className="text-blue-600"> Vishnu N K</a>
        </div>
    </div>
    </>
    );
}
