"use client"
import React from "react";
import FiledimeSettings from "../../components/filedimesettings"
import { ZoomableContent } from "../../components/ZoomableContent";
export default function Settings(){
    return(
        <ZoomableContent>

            <FiledimeSettings/>
        </ZoomableContent>
    );
}