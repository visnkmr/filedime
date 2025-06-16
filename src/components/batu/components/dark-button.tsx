'use client';
import { useState,useEffect, useContext } from 'react';
import React from "react";
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function DarkButton() {
    const { setTheme, theme } = useTheme();
  useEffect(() => {
    // dark?setTheme('light'):setTheme('dark');
    const darkIcon = document.getElementById("theme-toggle-dark-icon")!;
    const lightIcon = document.getElementById("theme-toggle-light-icon")!;
    if (theme === 'dark') {
      darkIcon.style.display = "block";
      lightIcon.style.display = "none";
    } else {
      darkIcon.style.display = "none";
      lightIcon.style.display = "block";
    }
  }, [theme]);
  return (
    <>
    
    <div className='h-10'>
    <span className='p-2.5 absolute right-0'>

      <button
        id="theme-toggle"
        type="button"
        aria-label='light dark mode toggle'
        className="text-gray-500  rounded-lg text-sm p-2.5"
        onClick={()=>setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        <Sun className='h-4 w-4'id="theme-toggle-dark-icon"/>
        <Moon className='h-4 w-4' id="theme-toggle-light-icon"/>
      </button>
      </span>
    </div>

    </>
  );
}