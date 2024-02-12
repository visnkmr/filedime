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

//display system info using os api
export default function FiledimeSettings({theme}){
    // const { theme, setTheme } = useTheme()
    const [configfol,setcf]=useState("")
    useEffect(()=>{
        invoke("configfolpath",{}).then((e)=>{
            setcf(e);
            invoke("foldersize", { path: e }).then((i)=>{
                setcf((old)=>`${old}(${i})`)    
            })
        })
        
    },[])
    return (
    <>
    <div>
        <EachSetting name="Exclude hidden files" callback={()=>{}} />
        <EachSetting name="Session restore" callback={()=>{}}/>
        <EachSetting name="Compute folder sizes on open" callback={()=>{}}/>
        <EachSetting name="Estimate folder child count" callback={()=>{}}/>
        <p>Config files are stored @ {configfol}</p>
    </div>
    </>
    );
}
