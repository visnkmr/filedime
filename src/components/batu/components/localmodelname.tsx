"use client"

import { useEffect, useState } from "react"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"
import { EyeIcon, EyeOffIcon, SaveIcon } from "lucide-react"

interface LMmodelnameProps {
  model_name: string
  set_model_name: (key: string) => void
}

export default function LMStudioModelName({ model_name, set_model_name }: LMmodelnameProps) {
  // const [showKey, setShowKey] = useState(false)
  const [inputValue, setInputValue] = useState(model_name)
  useEffect(()=>{
      setInputValue(model_name)
    },[model_name])
  const handleSave = () => {
    set_model_name(inputValue)
    localStorage.setItem("lmstudio_model_name", inputValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="api-key">Ollama / LM Studio Model Name</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="api-key"
            type={"text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="LM Studio Model name"
            className="pr-10"
          />
        </div>
        <Button onClick={handleSave} disabled={!inputValue || inputValue === model_name} size="icon">
          <SaveIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
