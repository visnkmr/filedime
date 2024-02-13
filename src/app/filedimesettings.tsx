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
interface stateinfo{
    excludehidden:boolean,
    includefolder:boolean,
    childcount:boolean,
    folsize:boolean,
    cfpath:string,
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
export default function FiledimeSettings({theme}){
    // const { theme, setTheme } = useTheme()
    const [configfol,setcf]=useState("")
    const [datafromstngs,setdfs]=useState<React.JSX.Element>()
    const [data,setdata]=useState<stateinfo>()
    useEffect(()=>{
        invoke("configfolpath",{}).then((e)=>{
            console.log(e)
            let stateinf=JSON.parse(e) as stateinfo;
            invoke("foldersize", { path: stateinf.cfpath }).then((i)=>{
                setcf(`${stateinf.cfpath}(${i})`)    
            })
            setdfs(<>
                <EachSetting name="Exclude hidden files" callback={()=>{reloadsize("excludehidden")}} currentstatus={stateinf.excludehidden}/>
                    <EachSetting name="Session restore" callback={()=>{}} currentstatus={stateinf.excludehidden}/>
                    <EachSetting name="Include folder names in search" callback={()=>{reloadsize("includefolder")}} currentstatus={stateinf.includefolder}/>
                    <EachSetting name="Compute folder sizes" callback={()=>{reloadsize()}} currentstatus={!stateinf.folsize}/>
                    <EachSetting name="Estimate folder child count" callback={()=>{reloadsize("folcount")}} currentstatus={stateinf.childcount}/>
                    <p>Config files are stored @ {configfol}</p>
                </>)
        })
        
    },[])
    return (
    <>
    <div>
        {datafromstngs}
    </div>
    </>
    );
}
