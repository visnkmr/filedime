'use client'
import React from "react";
import ScrollText from "./ScrollText";
import Lightbulb from "./Lightbulb";
import Marquee from "react-fast-marquee";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { LazyLoadImage } from "react-lazy-load-image-component";

export default function Topthread(){
    // const { data } = useQuery({ queryKey: ['posts'], queryFn: async()=>{
    //     const response = await axios.get('https://cdn.jsdelivr.net/gh/visnkmr/visnkmr.github.io@main/gtrl.json')
    //     console.log(response.data)
    //       return await response.data
    //   } })
    return(
        <>
        {/* <ScrollText text="This is a scrolling text.This is a scrolling text." speed={20} /> */}
        
        {/* <section className="flex bg-slate-800"> */}

        <section className="flex bg-slate-800 dark:bg-blue-500">
            <noscript>
            <div className="sm:flex hidden font-medium px-4 mx-auto py-4 sm:px-6 text-center text-md text-white">
            <Lightbulb/><a className="ps-4 text-white dark:text-white" href={"https://github.com/visnkmr/iomer"}>
                <span className="font-bold ">Filedime (iomer):</span> A simple, High Performance File explorer made using rust for PC. Supports multi-window, tabs, fzf like search, swift folder size compute, hot reload for markdown, html.
                </a>
            </div>
            </noscript>
        <Marquee pauseOnHover>
            <div className="sm:flex hidden font-medium px-4 mx-auto py-4 sm:px-6 text-center text-md text-white">
            <Lightbulb/><a className="ps-4 text-white dark:text-white" href={"https://github.com/visnkmr/iomer"}>
                <span className="font-bold ">Iomer:</span> A simple, High Performance File explorer made using rust for PC. Supports multi-window, tabs, fzf like search, swift folder size compute, hot reload for markdown, html.
                </a>
            </div>
        </Marquee>
        </section>

        </>

    );
}