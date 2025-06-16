"use client"

// Simplified version of the shadcn/ui toast hook
import { useState } from "react"

export type ToastProps = {
  title?: string
  description?: string
  duration?: number
  id?: string
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...props, id }
    setToasts((prevToasts) => [...prevToasts, newToast])

    if (props.duration !== Number.POSITIVE_INFINITY) {
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
      }, props.duration || 5000)
    }

    return id
  }

  return { toast, toasts }
}
