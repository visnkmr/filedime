"use client"

import type { Message } from "../lib/types"
import { UserIcon, BotIcon, CopyIcon, GitBranchIcon, RefreshCw } from "lucide-react"
import { cn } from "../lib/utils"
import { format } from "date-fns"
// import ReactMarkdown from "react-markdown"
import {Markdown} from "./markdown"
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useEffect, useState } from "react"
import { Button } from "../components/ui/button"

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  onCopy: () => void
  onBranch: () => void
  setdsm: any
  setmts: any
}

export default function MessageItem({ message, isStreaming = false, onCopy, onBranch,setdsm,setmts }: MessageItemProps) {
  const isUser = message.role === "user"
  const [showCursor, setShowCursor] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Blinking cursor effect for streaming messages
  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isStreaming])

  // Custom renderer for code blocks
  // const components = {
  //   code({ node, inline, className, children, ...props }: any) {
  //     const match = /language-(\w+)/.exec(className || "")
  //     return !inline && match ? (
  //       <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
  //         {String(children).replace(/\n$/, "")}
  //       </SyntaxHighlighter>
  //     ) : (
  //       <code className={className} {...props}>
  //         {children}
  //       </code>
  //     )
  //   },
  // }
  const Resend=()=>{
    setdsm(true)
    setmts(message.content)
  }

  return (
    <div className={cn("",isUser?"justify-end":"")} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
    <div className={cn(isUser?"place-items-end":"")}>
    <div
      className={cn(
        "gap-3 p-4 rounded-lg relative overflow-hidden",
        isUser ? "bg-blue-50 dark:bg-blue-900/20" : "bg-gray-50 dark:bg-gray-800/50",
      )}
    >
      {/* <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-white" />
          </div>
        ) : (
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              message.model ? `bg-${getModelColor(message.model)}` : "bg-purple-500",
            )}
          >
            <BotIcon className="h-5 w-5 text-white" />
          </div>
        )}
      </div> */}

      <div className="space-y-2">
        <div className="items-center gap-2">
          <span className="font-medium">
            {/* {isUser ? "You" : "AI Assistant"} */}
            {message.model && !isUser && (
              <span className="text-xs ml-2 opacity-70">({getModelDisplayName(message.model)})</span>
            )}
          </span>
          {/* <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(message.timestamp), "MMM d, h:mm a")}
          </span> */}
        </div>

        <div className={cn( isUser?"max-w-[70vw]":"w-full","prose dark:prose-invert prose-sm break-words")}>
          <Markdown>{message.content}</Markdown>
          {isStreaming && showCursor && <span className="animate-pulse">▌</span>}
        </div>
      </div>

      
    </div>
    {!isStreaming && (
        <div className={cn("gap-1 ",isUser,isHovered?"visible":"invisible")}>
          <Button variant="ghost" className={(isUser && isHovered ?"visible":"hidden")} size="icon" onClick={Resend} title="Branch from here">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCopy} title="Copy message">
            <CopyIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onBranch} title="Branch from here">
            <GitBranchIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      </div>  
    </div>
  )
}

// Helper function to get a consistent color based on model name
function getModelColor(modelId: string): string {
  const colors = [
    "purple-500",
    "pink-500",
    "rose-500",
    "red-500",
    "orange-500",
    "amber-500",
    "yellow-500",
    "lime-500",
    "green-500",
    "emerald-500",
    "teal-500",
    "cyan-500",
    "sky-500",
    "blue-500",
    "indigo-500",
    "violet-500",
  ]

  // Simple hash function to get consistent color
  let hash = 0
  for (let i = 0; i < modelId.length; i++) {
    hash = modelId.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Helper function to get a display name from model ID
function getModelDisplayName(modelId: string): string {
  // Extract the model name from the provider/model format
  const parts = modelId.split("/")
  return parts.length > 1 ? parts[1] : modelId
}
