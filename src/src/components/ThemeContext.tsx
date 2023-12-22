   'use client'
   import React, { createContext, useState, useEffect } from 'react';
   import {QueryClient, QueryClientProvider, useQuery} from '@tanstack/react-query'
   import axios from 'axios'
// import { getfromls, useLocalStorage } from './useLocalStorage';

//    export const ThemeContext = createContext({
//      dark: getfromls("dark",false),
//      toggle: () => {},
//    });
   interface tpprops extends React.HTMLAttributes<HTMLDivElement> {
 
  }
//    export const ThemeProvider = ({ children }:tpprops) => {
//      const [dark, setDark] = useLocalStorage("dark",true);
//     console.log("getting.."+ dark)
//      const toggle = () => {
//        setDark(!dark);
//      };

//      return (
//        <ThemeContext.Provider value={{ dark, toggle }}>
//          {children}
//        </ThemeContext.Provider>
//      );
//    };
// 'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }:tpprops) {
  const [queryClient] = React.useState(() => new QueryClient())
  // let qc=;
  

    // const [mounted, setMounted] = useState(false)
    // const { theme, setTheme } = useTheme()
  
    // useEffect only runs on the client, so now we can safely show the UI
    // useEffect(() => {
    //   setMounted(true)
    // }, [])  
  
    // if (!mounted) {
    //   return null
    // }
  return <ThemeProvider attribute='class'>
    <QueryClientProvider client={queryClient}>
    {children}
    </QueryClientProvider>
    </ThemeProvider>
}