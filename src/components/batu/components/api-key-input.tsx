"use client"

import { useEffect, useState } from "react"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"
import { EyeIcon, EyeOffIcon, SaveIcon } from "lucide-react"

interface ApiKeyInputProps {
  apiKey: string
  setApiKey: (key: string) => void
}

export default function ApiKeyInput({ apiKey, setApiKey }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false)
  const [inputValue, setInputValue] = useState(apiKey)
  useEffect(()=>{
    const storedApiKey = localStorage.getItem("openrouter_api_key")
      if (storedApiKey) {
        setInputValue(storedApiKey)
      }},[])
  const handleSave = () => {
    setApiKey(inputValue)
    localStorage.setItem("openrouter_api_key", inputValue)
  }

  return (
    <div className="space-y-2">
      <Label className="dark:text-white text-black " htmlFor="api-key">OpenRouter API Key</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="api-key"
            type={showKey ? "text" : "password"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your OpenRouter API key"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
        </div>
        <Button onClick={handleSave} disabled={!inputValue || inputValue === apiKey} size="icon">
          <SaveIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
