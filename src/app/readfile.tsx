import React, { useEffect, useState } from "react";
import { fs } from '@tauri-apps/api'
export default function ReadFileComp({path}){
        const [data, setData] = useState("null");
       
        useEffect(() => {
           const fetchData = async () => {
             const response = await fs.readTextFile(path);
             setData(response);
           }
       
           fetchData()
        }, [path]);
       
    return (
        <>
        {data}
        </>
    )
}