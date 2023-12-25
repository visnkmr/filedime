'use client'

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri'
import {ForwardIcon, ArrowLeft, SearchIcon, ArrowRightIcon} from "lucide-react"
import React from 'react';
// import { window as uio } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import {columns} from "../src/components/columns"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../components/ui/context-menu"

import Link from "next/link"
import { CardContent, Card, CardDescription } from "../components/ui/card"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { FileItem,DriveItem } from "../shared/types"
import { DataTable } from '../src/components/data-table';

export default function Greet() {
    const filesobjinit:FileItem[]=[]
    const objinit:string[]=[]
    const driveobjinit:DriveItem[]=[]
    const pathsplitobjinit:pathsplit[]=[]
  const [pathsplitlist, setpsplitl] = useState(pathsplitobjinit);
  const [driveslist, setdriveslist] = useState(driveobjinit);
  const [filecount, setfc] = useState(0);
  const [path, setpath] = useState("drives://");
  const [searchstring,setss] = useState("");
  const [parentsize,setps] = useState("");
  const [sampletext,sst]=useState("drives://")
  const [filesetcollectionlist,setfscl]=useState(objinit)
  const [custombuttonlist,setcbl]=useState(objinit)
  // const [pathinput,spi]=useState("")
  const [pathsuggestlist,setpsl]=useState(objinit)
  const [fileslist, setfileslist] = useState(filesobjinit);
  const [appWindow, setAppWindow] = useState()

  // Import appWindow and save it inside the state for later usage
  async function setupAppWindow() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow
    setAppWindow(appWindow)
  }

  useEffect(() => {
    setupAppWindow()
  }, []) 
  useEffect(() => {
    console.log(Math.random());
  }, []);
  useEffect(() => {
    listen("button-names", (data: { payload: string }) => {
      setcbl(JSON.parse(data.payload) as string[]);
      console.log("winnames: "+data.payload.toString())
    });
    listen("folder-size", (data: { payload: string }) => {
      console.log("foldersize")
    
      setps(data.payload.toString())
      // console.log(data.payload.toString())
    });
    listen("fsc", (data: { payload: string }) => {
      console.log("-------------__>"+((data.payload)))
      console.log("fscl----->"+JSON.parse(data.payload));
      setfscl(JSON.parse(data.payload));
    });
    listen("load-sresults", (data: { payload: string }) => {
      let fl: FileItem[] = JSON.parse(data.payload) as FileItem[];
      sst("Search Results")
      console.log("Found----->"+fl.length)
      setfileslist(fl)
      setfc(fl.length)
      // // if(globalThis.lastpopfilelist.length>10)
      // // return
      // if (fileList.length>100){
      //   fileList=fileList.slice(0,100)
      // }
      // fileList.forEach(function(ef){
      //   eachfile(ef)
      // });
    });
    // const unlisten=
    listen('list-drives', (event) => {
      // sst("")
      // spi("Drives://")
        console.log("loading drives---->"+event.payload);
        setdriveslist(JSON.parse(event.payload));
    })
    .then(result => {
            // console.log(uio.getCurrent().label)
            console.log(result)
        })
    .catch(console.error);
    // const unlisten1=
    listen('list-files', (event) => {
      setfc((old) => {
        const newFileCount = old + 1;
        // if (newFileCount < 11)
         {
          setfileslist((plog) => [...plog, JSON.parse(event.payload)]);
        }
        return newFileCount;
       });
        console.log("loading files---->"+event.payload);
    })
    .then(result => {
            // console.log(uio.getCurrent().label)
            console.log(result)
            
        })
    .catch(console.error);
    // lfiles();
    invoke('list_files', { 
        windowname:appWindow?.label,
        oid: "0",
        path: "drives://",
        ff: "" 
    })
    // .then(result => {
    //     // console.log(uio.getCurrent().label)
    //     console.log(result)
        
    // })
    // .catch(console.error)
    // return () => {
    //   unlisten.then(f => f());
    //   unlisten1.then(f => f());
    // }
  },[])
//   useEffect(() => {
//     invoke<string>('greet', { 
//         name: "test"
//     })
//       .then(result => {
//         console.log(uio.getCurrent().label)
//         console.log(result)
//         addone(result)
//     })
//       .catch(console.error)
//   }, [count])



  return (
    <div className="grid grid-cols-[300px_1fr] h-screen">
      <aside className="border-r bg-gray-100/40 dark:bg-gray-800/40">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link className="flex items-center gap-2 font-semibold" href="#">
              <FolderIcon className="h-6 w-6" />
              <span className="">Filedime</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Link onClick={()=>
                { 
                    setfileslist([])
                    setdriveslist([])
                    sst("drives://")
                    setpath("drives://")
                    setss("")
                    // console.log(message);
                    
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: "0",
                      path: "drives://",
                      ff: "" 
                  })}
                }
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                href="#"
              >
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50"
                href="#"
              ><FolderIcon className="h-4 w-4" />{sampletext}</Link>
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                href="#"
              >
                <TrashIcon className="h-4 w-4" />
                Trash
              </Link>
            </nav>
          </div>
        </div>
      </aside>
      <main className="flex flex-col p-6">
        <div className='flex flex-row mb-4'>
        {custombuttonlist.map((bn, index) => (
          <Card className='rounded-lg border bg-card text-card-foreground shadow-sm' key={index} onClick={
                ()=>{
                  invoke(
                    "otb",
                    {
                      bname: bn,
                      path: path,
                    }
                    );
                }
            }>
            <CardDescription className="flex items-center space-x-2 p-2">
              <FolderIcon className="h-4 w-4" />
              <span className="font-medium text-sm">{bn}</span>
            </CardDescription>
          </Card>
            ))}
        </div>
      <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <ForwardIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-grow items-center gap-4">
            <div className="flex-grow">
            <datalist id="path-list">
            {pathsuggestlist.map((message, index) => (
              <option key={index} value={message}/>
            ))}
            </datalist>
              <input
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Path"
                type="search"
                list="path-list"
                value={path}
                onChange={(event) =>
                  {
                    setpath(event.target.value);
                    invoke(
                      "get_path_options", 
                      {
                        windowname:appWindow?.label,
                        path: event.target.value,
                      })
                      .then((options:string[]) => {
                        // console.log(options)
                        // Clear the datalist options
                        if (options !== null) {
                          setpsl(options)
                    
                          // Loop through the options returned by Rust
                          // for (const option of options) {
                          //   const optionElement = document.createElement("option");
                          //   // // console.log("here#1")
                          //   optionElement.value = option;
                    
                          //   // Append the option element to the datalist element
                          //   datalist.appendChild(optionElement);
                          // }
                          // for (const option of globalThis.lastpopfilelist) {
                          //   // Create a new option element with the option value
                          //   const optionElement = document.createElement("option");
                          //   // // console.log("here#1")
                          //   optionElement.value = option.path;
                    
                          //   // Append the option element to the datalist element
                          //   datalist.appendChild(optionElement);
                          // }
                        }
                      })
                      .catch((error:string) => {
                        // Handle any errors from Rust
                        console.error(error);
                      });
                  }
                }
              />
              
            </div>
            <ArrowRightIcon onClick={()=>{
               setfileslist([])
               setdriveslist([])
               setfc(0)
              //  setpath(message.name)
              //  sst(message.path)
              invoke(
                "list_files",
                {
                windowname:appWindow?.label,
                oid: "0",
                path: path,
                ff: ""
                }
                )
            }}/>
            <div className="flex-grow max-w-[20%]">
              <input
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Search"
                type="search"
                value={searchstring}
                onChange={(event) =>
                  {
                    let tosearch=event.target.value;
                    setss(tosearch)
                  }
                }
              />
            </div>
            <SearchIcon onClick={
              ()=>{
                invoke(
                  "search_try", {
                    windowname:appWindow?.label,
                    // path: pathInput.value,
                    string: searchstring
                })
              }
            }/>
            <div className="flex items-center gap-2">
              <span>{parentsize}</span>
              <Button variant="ghost">Tab 2</Button>
              <Button variant="ghost">Tab 3</Button>
            </div>
          </div>
        </div>
        <div className='flex items-center space-x-6 mb-6 '>
          {pathsplitlist
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map((eachif,index)  => (
            <Link key={index} href="#" onClick={
              ()=>
              { 
                setfileslist([])
                setdriveslist([])
                setfc(0)
                setss("")
                // spi(message.mount_point)
                setpath(eachif.pathtofol)
                sst(eachif.pathtofol)
                // console.log(message);
                invoke('list_files', { 
                  windowname:appWindow?.label,
                  oid: "0",
                  path: eachif.pathtofol,
                  ff: "" 
              })}
          }>{eachif.interfolpath}</Link>
          ))}
        </div>
        <div className='flex items-center justify-between mb-6'>
          {
          Object.entries(filesetcollectionlist)
          // .filter(function (el) {
          //   return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
          // })
          .map(([key, value],index)  => (
            <p key={index}>{key}({value})</p>
          ))}
        </div>
        <h1 className="font-semibold text-lg md:text-2xl">{fileslist.length>0?sampletext:"Drives"} ({fileslist.length>0?filecount:driveslist.length})</h1>
        <p>{searchstring.trim().length>0?"":path}</p>
        <span className={fileslist.length>0 ? 'block' : 'hidden'}>

          <DataTable columns={columns} data={fileslist}/>
        </span>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* <Other/> */}
        {driveslist.filter(function (el) {
                      return el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.mount_point.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase())
                    }).map((message, index) => (
          <ContextMenu key={index}>
          <ContextMenuTrigger>
          
            <Card key={index} onClick={
                ()=>
                { 
                  setfileslist([])
                  setdriveslist([])
                  setfc(0)
                  setss("")
                  // spi(message.mount_point)
                  setpath(message.mount_point)
                  sst(message.mount_point)
                  // console.log(message);
                  invoke('list_files', { 
                    windowname:appWindow?.label,
                    oid: "0",
                    path: message.mount_point,
                    ff: "" 
                })}
            }>
            <CardContent className="flex items-center space-x-4">
              <FolderIcon className="h-6 w-6" />
              <span className="font-medium text-lg">{message.mount_point}</span>
            </CardContent>
          </Card>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <p className='pl-4'>{message.mount_point}</p>
            <ContextMenuItem>Open in new tab</ContextMenuItem>
            <ContextMenuItem>Open in new window</ContextMenuItem>
            <ContextMenuItem>Add bookmark</ContextMenuItem>
            <ContextMenuItem>Copy to clipboard</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        // <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
        ))}
        {fileslist.filter(function (el) {
                     return searchstring.trim().length>0?
                       el.name.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()) || el.path.toLocaleLowerCase().includes(searchstring.toLocaleLowerCase()):true
                    }).slice(0,10).map((message, index) => (
          <ContextMenu key={index}>
          <ContextMenuTrigger>
            <Card key={index} onClick={
                ()=>
                { 
                  console.log("clicked");
                  setfileslist([])
                  setdriveslist([])
                  setfc(0)
                  setss("")

                  setpath(message.path)
                  setpsplitl(setautocompletepath(message.path))
                  sst(message.name)
                  // useEffect(() => {
                    invoke('list_files', { 
                      windowname:appWindow?.label,
                      oid: "0",
                      path: message.path,
                      ff: "" 
                  });
                  // },[])
              }
            }>
            <CardContent className="flex items-center space-x-4">
              <FolderIcon className="h-6 w-6" />
              <span className="font-medium text-lg">{message.name}</span>
            </CardContent>
          </Card>
          </ContextMenuTrigger>
          <ContextMenuContent className=''>
            <p className='text-sm'>{message.path}</p>
            <ContextMenuItem onSelect={(e)=>{
              invoke("newwindow",
              {
                id: (1).toString(),
                path: message.path,
                ff:""
              });

            }}>Open in new window</ContextMenuItem>
            <ContextMenuItem onSelect={(e)=>{
              invoke(
                "newtab",
                {
                  windowname:appWindow?.label,
                  oid: globalThis.tid.toString(),
                  path: path,
                  ff: ""
                }
              );
            }}>Open in new tab</ContextMenuItem>
            <ContextMenuItem>Add bookmark</ContextMenuItem>
            <ContextMenuItem onSelect={(e)=>{
              try {
                navigator.clipboard.writeText(message.path);
                console.log('Content copied to clipboard');
              } catch (err) {
                console.error('Failed to copy: ', err);
              }
            }}>Copy path to clipboard</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        // <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
        ))}
        </div>
        {/* <h2 className="font-semibold text-lg md:text-xl mt-6">Recent Files</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>report.txt</TableCell>
              <TableCell>15 KB</TableCell>
              <TableCell>Dec 1, 2023</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost">
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button size="icon" variant="ghost">
                  <TrashIcon className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>image.png</TableCell>
              <TableCell>500 KB</TableCell>
              <TableCell>Nov 30, 2023</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost">
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button size="icon" variant="ghost">
                  <TrashIcon className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table> */}
      </main>
    </div>
  )
}

function FolderIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  )
}


function HomeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}


function PencilIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}


function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}


export function Other() {
    
  const [count, addone] = useState(0);

  // Necessary because we will have to use Greet as a component later.
  return (
  <div>
    <h1>Greet</h1>
      <button type="button" onClick={() => {
        // invoke<string>('list_files', { 
        //     // windowname:appWindow?.label,
        //     oid: "0",
        //     path: "drives://",
        //     ff: "" 
        // })
        // let addo=count+1
        addone((oldone)=>oldone+1);
      }
    }>Add One</button>
    <p>
    {count}
    {/* {driveslist} */}
    </p>
  </div>
  );
}
interface pathsplit{
  interfolpath:string,
  pathtofol:string
}
function setautocompletepath(pathInput:string):pathsplit[] {
  let splitat=  /[\\/]/;
  var arr = pathInput.split(splitat); // arr is ["a", "b", "c", "d"]
  var prefixes: string[] = [];
  var prefix = "";
  for (var i = 0; i < arr.length; i++) {
    prefix += arr[i]; // append the current element to the prefix
    prefixes.push(prefix); // add the prefix to the prefixes array
    prefix += "/"; // add a slash for the next iteration
  }
  var fols=[]
  console.log(pathInput.split(splitat))
  fols = pathInput.split(splitat);
  console.log(fols.length);
  let listinpath:pathsplit[]=[];
  for (var i = 0; i < fols.length; i++){ 
  // fols.forEach(
    // function (fol, index) {
      listinpath.push(
        {
          interfolpath:fols[i],
          pathtofol:prefixes[i]
        }
      ) 
      
      // // console.log(index)
    }
    return listinpath;
}
