import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,AlertDialogHeader, AlertDialogFooter, AlertDialogTrigger } from "./ui/alertdialog";
import { setcolorpertheme } from "./greet";

import { Checkbox } from "./ui/checkbox";
import { invoke } from "@tauri-apps/api/tauri";
import { operationfileinfo } from "../shared/tstypes";
export default function Dupelist({dst,srclist,dupes,showad,setshowad,setfos}){
    console.log("srclist-----"+srclist)
    console.log("dst-----"+dst)
    let [dlastore,setdlastore]=useState([] as operationfileinfo[])
    useEffect(() => {
        setdlastore(dupes);
       }, [dupes]);
    return (

      <AlertDialog open={showad} onOpenChange={setshowad}>
      
        <AlertDialogContent className={`${setcolorpertheme}`}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            {dlastore.map((a)=>{
              return <>
              <table>
                <tr>
                    <th className="p-4">Path</th>
                    <th className="p-4">file size</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Replace or not</th>
                </tr>
                <tr>
                    <td className="p-4">
                        <p>
                            {a.sourcepath}
                        </p>
                        <br/>
                        <p>
                            {a.destpath}
                        </p>
                    </td>
                    <td className="p-4">
                    <p>
                            {a.srcfilesize}
                        </p>
                        <br/>
                        <p>
                            {a.existingfilesize}
                        </p>
                    </td>
                    <td className="p-4">
                    <p>
                            {a.srcfiledate}
                        </p>
                        <br/>
                        <p>
                            {a.existingdate}
                        </p>
                    </td>
                    <td className="p-4">
                    <Checkbox
                        checked={a.replace}
                        onCheckedChange={(value:boolean) => {
                            // Find the index of the current item in dlastore
                            const index = dlastore.findIndex((item) => item.path === a.path);
                            if (index !== -1) {
                            // Create a copy of dlastore
                            const updatedDlastore = [...dlastore];
                            // Update the 'replace' property of the found item
                            updatedDlastore[index] = { ...updatedDlastore[index], replace: value };
                            console.log(updatedDlastore)
                            // Update the state with the new array
                            setdlastore(updatedDlastore);
                            }
                        }}
                        className="translate-y-[2px]"
                        />
                    </td>
                </tr>
              </table>
              <br/>
              </>
            })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={()=>{
                let newArray=[];
                for (const [index,item] of dlastore.entries()){
                    console.log(item)
                    newArray.push({
                            sourcepath: item.sourcepath,
                            destpath: item.destpath,
                            replace: item.replace
                           });
                }
                // let newArray = [...dlastore,
                //     dlastore.map(item => ({
                //     sourcePath: item.sourcepath,
                //     destPath: item.destpath,
                //     replace: item.replace
                //    }))];
                   console.log(srclist)
                   console.log(typeof srclist)
                invoke('fileop', { 
                    srclist:srclist,
                    dst:dst,
                    dlastore:JSON.stringify(newArray)
                }).then((a)=>{
                    setfos([])
                
                })
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
}