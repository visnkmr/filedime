'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export default function ThemeColorUpdater() {
  const { theme } = useTheme()

  useEffect(() => {
    const updateThemeColor = () => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        const color = theme === 'dark' ? '#0a0a0a' : '#ffffff'
        metaThemeColor.setAttribute('content', color)
      }
    }

    updateThemeColor()

    const handleScroll = () => {
      updateThemeColor()
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [theme])

  return null
}