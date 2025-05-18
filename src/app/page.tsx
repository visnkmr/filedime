"use client"

// ...
import React from 'react'
import Greet from '../components/greet'
import GPTchatinterface from '../components/gptchatinterface'

export default function Home() {
  let url=typeof window !== 'undefined' ? window.location.hostname : '/'
      console.log(url)
      return <GPTchatinterface fgptendpoint={url} setasollama={true}/>
  // return (
  //   <main className="overflow-hidden h-full">
  //     <Greet />
  //   </main>
  // )
}