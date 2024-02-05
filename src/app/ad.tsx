import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,AlertDialogHeader, AlertDialogFooter, AlertDialogTrigger } from "../components/ui/alertdialog";
import { operationfileinfo, setcolorpertheme } from "./greet";
import { Checkbox } from "../components/ui/checkbox";
import { invoke } from "@tauri-apps/api/tauri";
export default function Dupelist({dst,srclist,dupes,showad,setshowad}){
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
                invoke('fileop', { 
                    srclist:srclist,
                    dst:dst,
                    dlastore:JSON.stringify(dlastore)
                }).then((a)=>{
                
                
                })
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
}