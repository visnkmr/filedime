// 'use client'
// import { ThemeProvider } from "../src/components/ThemeContext"
import React from "react"
import { Providers } from "../src/components/ThemeContext"
import Footer from "../src/components/footer"
// import Thedarkhtml from "../src/components/thedarkhtml"
import Topthread from "../src/components/topthread"
// import { useLocalStorage } from "../src/components/useLocalStorage"
import '../styles/globals.css'
import DarkButton from "./but"
import {Metadata} from 'next'

export const metadata:Metadata = {
  title: 'Wireless file Manager',
  description: 'Open source frontend that uses apis of wireless file manager available on google play, amazon appstore for fire tv, android tv, phones, tablets, wsa, and all android devices.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  // const [showon, setshow] = useLocalStorage("dark",true);
  return (
    <html suppressHydrationWarning className="h-full" lang="en">
      <body className="h-full flex flex-col dark:bg-gray-900">
        <Providers>

        {/* <Thedarkhtml> */}
        {/* <Topthread/> */}
        <DarkButton/>
        {children}
        {/* </Thedarkhtml> */}
        </Providers>

        {/* <Footer/> */}
      </body>

    </html>
  )
}
