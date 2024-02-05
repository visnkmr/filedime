import React from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,AlertDialogHeader, AlertDialogFooter, AlertDialogTrigger } from "../components/ui/alertdialog";
import { setcolorpertheme } from "./greet";
export default function Dupelist({dupes}){
    return (

      <AlertDialog >
      <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent className={`${setcolorpertheme}`}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            {dupes.map((a)=>{
              return <>
              <p>{a.existingfilesize}</p>
              <p>{a.path}</p>
              <p>{a.srcfilesize}</p>
              <br/>
              </>
            })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
}