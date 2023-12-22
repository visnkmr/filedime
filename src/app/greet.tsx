'use client'

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri'
import React from 'react';
import { window as uio } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';

import Link from "next/link"
import { CardContent, Card } from "../components/ui/card"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "../components/ui/table"
import { Button } from "../components/ui/button"

export default function Greet() {
    const filesobjinit:object[]=[]
  const [driveslist, setdriveslist] = useState(filesobjinit);
  const [fileslist, setfileslist] = useState(filesobjinit);
  const [count, addone] = useState(0);

  useEffect(() => {
    listen('list-drives', (event) => {
        console.log(event);
        setdriveslist(JSON.parse(event.payload));
    })
    .then(result => {
            // console.log(uio.getCurrent().label)
            console.log(result)
        })
    .catch(console.error);
    listen('list-files', (event) => {
        console.log(event);
        setfileslist((plog) => [...plog, JSON.parse(event.payload)]);
    })
    .then(result => {
            // console.log(uio.getCurrent().label)
            console.log(result)
            
        })
    .catch(console.error);
    // lfiles();
    invoke('list_files', { 
        windowname:"main",
        oid: "0",
        path: "drives://",
        ff: "" 
    })
    // .then(result => {
    //     // console.log(uio.getCurrent().label)
    //     console.log(result)
        
    // })
    // .catch(console.error)
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
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                href="#"
              >
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50"
                href="#"
              >
                <FolderIcon className="h-4 w-4" />
                My Files
              </Link>
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
        <h1 className="font-semibold text-lg md:text-2xl">My Files</h1>
        <div className="grid grid-cols-4 gap-4 mt-6">
        {driveslist.map((message, index) => (
            <Card onClick={
                ()=>
                { 
                  console.log(message);
                  invoke('list_files', { 
                    windowname:"main",
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
        // <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
        ))}
        {fileslist.map((message, index) => (
            <Card onClick={
                ()=>
                { 
                  console.log(message);
                  invoke('list_files', { 
                    windowname:"main",
                    oid: "0",
                    path: message.path,
                    ff: "" 
                })}
            }>
            <CardContent className="flex items-center space-x-4">
              <FolderIcon className="h-6 w-6" />
              <span className="font-medium text-lg">{message.name}</span>
            </CardContent>
          </Card>
        // <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
        ))}
        </div>
        <h2 className="font-semibold text-lg md:text-xl mt-6">Recent Files</h2>
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
        </Table>
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
    

  // Necessary because we will have to use Greet as a component later.
  return (
  <div>
    <h1>Greet</h1>
      <button type="button" onClick={() => {
        // invoke<string>('list_files', { 
        //     // windowname:"main",
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
    <ul>
    {driveslist.map((message, index) => (
        <li key={index}><span className='text-gray-500 pr-3'>{index+1}</span>{JSON.stringify(message)}</li>
    ))}
    </ul>
    {/* {driveslist} */}
    </p>
  </div>
  );
}