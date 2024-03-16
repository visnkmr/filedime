//exclude hidden
//restore tabs on open
//include folder in search
//show size of folders
//save history of tabs
//load search list
//showchildfoldercount
//config folder location
//display system info using os api
import React, { useEffect, useState } from "react";
import EachSetting from "./switchsettingseach"
import { invoke } from "@tauri-apps/api/tauri";
import { FolderIcon, Save } from "lucide-react";
import { stateinfo } from "../shared/tstypes";
import Link from "next/link";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
import { Input } from "./ui/input";

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


export default function FiledimeSettings(){
    const [filedimegptendpoint,setfge]=useState("http://localhost:8694")
    useEffect(()=>{
        invoke("filegptendpoint",{
        endpoint:""
      }).then((e)=>{
        // console.log(e)
        setfge(e)
      })
    },[])
    // const { theme, setTheme } = useTheme()
    const [datafromstngs,setdfs]=useState<React.JSX.Element>()
    useEffect(()=>{
        invoke("configfolpath",{}).then((e)=>{
            console.log(e)
            let stateinf=JSON.parse(e) as stateinfo;
            setdfs(<>
                <EachSetting name="Exclude hidden files" callback={()=>{reloadsize("excludehidden")}} currentstatus={stateinf.excludehidden}/>
                    <EachSetting name="Restore tabs on open" callback={()=>{reloadsize("sessionsave")}} currentstatus={stateinf.sessionstore}/>
                    <EachSetting name="Include folder names in search" callback={()=>{reloadsize("includefolder")}} currentstatus={stateinf.includefolder}/>
                    <EachSetting name="Compute folder sizes" callback={()=>{reloadsize()}} currentstatus={!stateinf.folsize}/>
                    <EachSetting name="Estimate folder child count" callback={()=>{reloadsize("folcount")}} currentstatus={stateinf.childcount}/>
                    <p className="font-semibold">Config files are stored @ {stateinf.cfpath} ({stateinf.cfpathsize})</p>
                    {/* add control option to stop and start filedimegpt control server */}
                    {/* add textbox to set custom filedimegpt endpoint */}
                    <div className="flex flex-row items-center gap-2 "><p className="font-semibold">FiledimeGPT server IP</p>
                        <Input value={filedimegptendpoint}
                    type="text"
                    placeholder="FiledimeGPT server IP"
                    onChange={(event) =>
                    {
                        let pp=(event.target.value);
                        
                        setfge(pp)
                    }
                    }/>
                    <Button className="font-semibold" variant={"outline"} onClick={()=>{
                        invoke("filegptendpoint",{
                            endpoint:filedimegptendpoint
                          }).catch((e)=>console.log("Failed to update FiledimeGPT server IP."))
                    }}><div className="flex flex-row items-center gap-2"><Save className="h-4 w-4"/><p>(Save)</p></div></Button>
                        </div>
                </>)
        })
        
    },[])
     useEffect(()=>{
        let fname=async ()=>{
            const cv = await(await import('@tauri-apps/api/app')).getVersion()
            setcv(cv)
        }
        fname();
    },[])
    const { toast } = useToast()
    const [releaseavailable,setra]=useState(false)
    const [updatebuttontext,setubt]=useState("Check for update")
    const [currentversion,setcv]=useState("")
    const [lcoalip,setlocalip]=useState<React.JSX.Element>()
    useEffect(()=>{
        invoke("getlocalip",{}).then((e)=>{
            console.log(e)
            setlocalip(
                <>
                    <p className="font-semibold">Ollama should be running @ http://{e}:11434.</p>
                    <p className="font-semibold"><Link target="_blank" href="https://github.com/visnkmr/filegpt-filedime">FiledimeGPT python server</Link> if installed should be running @ http://{e}:8694.</p>
                    <p className="font-semibold">FiledimeGPT LAN local instance is accessible @ http://{e}:8477 for any device on your connected network.</p>
                </>
        );
        })
    },[])
    return (
    <>
    <div className="w-full h-full flex flex-col items-center overflow-scroll p-4 gap-2">
    <Toaster />
        <div className="flex flex-row font-semibold items-center gap-2">

    <FolderIcon className="h-6 w-6" />
              <span className="">Filedime</span>
        </div>
        {datafromstngs}
        {lcoalip}
        <div className="font-bold text-center">
            Make the app better, just submit Pull Request after making changes.<br/> Source code available <Link target="_blank" className="text-blue-600" href={"https://github.com/visnkmr/wfmossfrontend"}>here</Link>
        </div>
        <div>
        <Button className={`${releaseavailable?"":"hidden"}`} variant={"outline"}><Link target="_blank" href="https://github.com/visnkmr/filedime/releases/latest">Update</Link></Button>
        <Button className={`${releaseavailable?"hidden":""}`} variant={"outline"} onClick={()=>{
                invoke("checker",{}).then((r)=>{
                    console.log(r);
                    // useEffect(()=>{
                        let currentversionasync=async ()=>{

                            const cv = await(await import('@tauri-apps/api/app')).getVersion()
                            
                            if( r!==cv){
                                setra(true)
                              toast({
                                // duration:2000,
                                variant:"destructive",
                                title: "Update available",
                                description: `v${r} is available fordownload`,
                                action: <Button variant={"outline"}><Link target="_blank" href="https://github.com/visnkmr/filedime/releases/latest">Update</Link></Button>,
                              })
                    
                            }
                            else{setubt("no updates available")}
                        }
                        currentversionasync();
                    // },[])
                  })
            }}>{updatebuttontext}</Button>

        </div>
        <div className="font-bold text-center">
           Filedime v{currentversion}
        </div>
    </div>
    </>
    );
}
