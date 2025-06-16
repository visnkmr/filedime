"use client"

import { useEffect, useState } from "react"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"
import { EyeIcon, EyeOffIcon, SaveIcon } from "lucide-react"

interface LMUrlInputProps {
  lmurl: string
  setlmurl: (key: string) => void
}

export default function LMStudioURL({ lmurl, setlmurl }: LMUrlInputProps) {
  // const [showKey, setShowKey] = useState(false)
  const [inputValue, setInputValue] = useState(lmurl)
  useEffect(()=>{
    setInputValue(lmurl)
  },[lmurl])

  const handleSave = () => {
    setlmurl(inputValue)
    localStorage.setItem("lmstudio_url", inputValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="api-key">Ollama/LM Studio URL</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="api-key"
            type={"text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="LM Studio IP"
            className="pr-10"
          />
        </div>
        <Button onClick={handleSave} disabled={!inputValue || inputValue === lmurl} size="icon">
          <SaveIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
