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
import { set } from "lodash";

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

// export function zoomsetup(){
//     const [zoomLevel, setZoomLevel] = useState(1);
//     useEffect(()=>{
//         const handleWheel = (event: WheelEvent) => {
//             if (event.ctrlKey) {
//                 event.preventDefault();
//                 setZoomLevel(prevZoom => {
//                     const newZoom = prevZoom - event.deltaY * 0.001;
//                     return Math.max(0.5, Math.min(newZoom, 2)); // Clamp zoom level
//                 });
//             }
//         };

//         const handleKeyDown = (event: KeyboardEvent) => {
//             if (event.ctrlKey && (event.key === '=' || event.key === '+')) {
//                 event.preventDefault();
//                 setZoomLevel(prevZoom => Math.min(prevZoom + 0.1, 2));
//             } else if (event.ctrlKey && event.key === '-') {
//                 event.preventDefault();
//                 setZoomLevel(prevZoom => Math.max(0.5, prevZoom - 0.1));
//             }
//         };

//         window.addEventListener('wheel', handleWheel, { passive: false });
//         window.addEventListener('keydown', handleKeyDown);

//         return () => {
//             window.removeEventListener('wheel', handleWheel);
//             window.removeEventListener('keydown', handleKeyDown);
//         };
//     }, []);
//     useEffect(()=>{
//         invoke("zoom_window", {scaleFactor:zoomLevel});


//     },[zoomLevel])
// }
export default function FiledimeSettings(){
    const [filedimegptendpoint,setfge]=useState("http://localhost:8694")
    const [embeddingmodel,setem]=useState("nomic-embed-text")
    // zoomsetup();
    useEffect(()=>{
        invoke("filegptendpoint",{
        endpoint:"",
        whichvar:"ollamaurl",
        defaultval:"http://localhost:11434"
      }).then((e: any)=>{
        // console.log(e)
        setfge(e)
      })
      invoke("filegptendpoint",{
        endpoint:"",
        whichvar:"embedding_model",
        defaultval:"nomic-embed-text"
      }).then((e: any)=>{
        // console.log(e)
        setem(e)
      })
    },[])

    // const { theme, setTheme } = useTheme()
    const [datafromstngs,setdfs]=useState<React.JSX.Element>()
    useEffect(()=>{
        invoke("configfolpath",{}).then((e: any)=>{
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
                    <p className="font-semibold">Currently only local models based file embedding is supported. If you need file embedding support via openrouter,etc; Please raise an issue in the github repo.</p>
                    <div className="flex flex-row items-center gap-2 "><p className="font-semibold">Local LLM server IP</p>
                        <Input value={filedimegptendpoint}
                    type="text"
                    placeholder="Local server IP"
                    onChange={(event) =>
                    {
                        let pp=(event.target.value);
                        
                        setfge(pp)
                    }
                    }/>
                    
                    <Button className="font-semibold" variant={"outline"} onClick={()=>{
                        invoke("filegptendpoint",{
                            endpoint:filedimegptendpoint,
                            whichvar:"ollamaurl",
                            defaultval:"http://localhost:11434"
                          }).catch((e)=>console.log("Failed to update FiledimeGPT server IP."))
                    }}><div className="flex flex-row items-center gap-2"><Save className="h-4 w-4"/><p>(Save)</p></div></Button>
                        </div> 
                        <div className="flex flex-row items-center gap-2 "><p className="font-semibold">Embedding model to use</p>
                        <Input value={embeddingmodel}
                    type="text"
                    placeholder="Embedding Model"
                    onChange={(event) =>
                    {
                        let pp=(event.target.value);
                        
                        setem(pp)
                    }
                    }/>
                    
                    <Button className="font-semibold" variant={"outline"} onClick={()=>{
                        invoke("filegptendpoint",{
                            endpoint:filedimegptendpoint,
                            whichvar:"embedding_model",
                            defaultval:"nomic-embed-text"
                          }).catch((e)=>console.log("Failed to update config."))
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
        invoke("getlocalip",{}).then((e: any)=>{
            console.log(e)
            setlocalip(
                <>
                    <p className="font-semibold">Ollama should be running @ http://{e}:11434.</p>
                    {/* <p className="font-semibold"><Link target="_blank" href="https://github.com/visnkmr/filegpt-filedime">FiledimeGPT python server</Link> if installed should be running @ http://{e}:8694.</p> */}
                    <p className="font-semibold">Filechat UI is accessible @ http://{e}:8477 for any device on your connected network.</p>
                </>
        );
        })
    },[])
    return (
        <>
            <div className="h-full place-items-center place-content-center flex flex-col p-4 gap-2">
                <div
                    // style={{
                    //     transform: `scale(${zoomLevel})`,
                    //     transformOrigin: 'top left',
                    // }}
                    className="p-4"
                >
                    <div className="flex flex-col gap-y-5">
                        <div className="flex flex-row font-semibold gap-2 place-items-center">
                            <FolderIcon className="h-6 w-6" />
                            <span className="font-bold">Filedime v{currentversion}</span>
                            <Button
                                className={`${releaseavailable ? 'hidden' : ''}`}
                                variant={'outline'}
                                onClick={() => {
                                    invoke('checker', {}).then((r: any) => {
                                        console.log(r);
                                        let currentversionasync = async () => {
                                            const cv = await (await import('@tauri-apps/api/app')).getVersion();
                                            if (r !== cv) {
                                                setra(true);
                                                toast({
                                                    variant: 'destructive',
                                                    title: 'Update available',
                                                    description: `v${r} is available fordownload`,
                                                    action: (
                                                        <Button variant={'outline'}>
                                                            <Link target="_blank" href="https://github.com/visnkmr/filedime/releases/latest">
                                                                Update
                                                            </Link>
                                                        </Button>
                                                    ),
                                                });
                                            } else {
                                                setubt('no updates available');
                                            }
                                        };
                                        currentversionasync();
                                    });
                                }}
                            >
                                {updatebuttontext}
                            </Button>
                        </div>
                        {datafromstngs}
                        {lcoalip}
                        <div className="font-bold">
                            Make the app better, just submit Pull Request after making changes.
                            <br /> Source code available{' '}
                            <Link target="_blank" className="text-blue-600" href={'https://github.com/visnkmr/filedime'}>
                                here
                            </Link>
                        </div>
                        <div>
                            <Button className={`${releaseavailable ? '' : 'hidden'}`} variant={'outline'}>
                                <Link target="_blank" href="https://github.com/visnkmr/filedime/releases/latest">
                                    Update
                                </Link>
                            </Button>
                        </div>
                        <div>
                            <Button variant={'outline'} >
                            <Link href="/installed-apps">
                            Show Installed Apps
                            </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    );
}
