"use client"

import { useEffect, useState } from "react"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { SaveIcon } from "lucide-react"

interface FileGPTUrlInputProps {
  filegpturl: string
  setFilegpturl: (key: string) => void
}

export default function FileGPTUrl({ filegpturl, setFilegpturl }: FileGPTUrlInputProps) {
  const [inputValue, setInputValue] = useState(filegpturl)

  useEffect(() => {
    setInputValue(filegpturl)
  }, [filegpturl])

  const handleSave = () => {
    setFilegpturl(inputValue)
    localStorage.setItem("filegpt_url", inputValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="filegpt-url">FileGPT URL</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="filegpt-url"
            type={"text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="FileGPT Endpoint (e.g., http://localhost:8694)"
            className="pr-10"
          />
        </div>
        <Button onClick={handleSave} disabled={!inputValue || inputValue === filegpturl} size="icon">
          <SaveIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
