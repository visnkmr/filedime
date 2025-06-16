"use client"

// ...
import React from 'react'
import Greet from '../components/greet'
import GPTchatinterface from '../components/gptchatinterface'

export default function Home() {
  // let url=typeof window !== 'undefined' ? window.location.hostname : '/'
  //     console.log(url)
  //     return <GPTchatinterface fgptendpoint={url} setasollama={true}/>

  return (
    <main className="overflow-hidden h-full">
      <Greet />
    </main>
          )
}

// "use client"
// import React from "react";
// import FiledimeSettings from "../components/filedimesettings";
// import ExtensionManager from "../components/ExtensionManager";
// export default function Settings(){
//     return(
//         <div className="p-4">
//             <h1 className="text-2xl font-bold mb-6">Settings</h1>
//             <div className="mb-8">
//                 <FiledimeSettings />
//             </div>
//             <div>
//                 <ExtensionManager />
//             </div>
//         </div>
//     );
// }
