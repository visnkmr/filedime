"use client"
import React from "react";
import GPTchatinterface from "../../components/gptchatinterface";
import {Metadata} from 'next'
import { ZoomableContent } from "../../components/ZoomableContent";

export default function RootLayout(){
    let url=typeof window !== 'undefined' ? window.location.hostname : '/'
    console.log(url)
    return <ZoomableContent>
        <GPTchatinterface fgptendpoint={url} setasollama={true}/>
        </ZoomableContent>
}