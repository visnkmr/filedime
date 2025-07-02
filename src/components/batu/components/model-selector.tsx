"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Label } from "../components/ui/label"
import { Loader2 } from "lucide-react"
// import type { Model } from "../lib/types"

interface ModelSelectorProps {
  apiKey: string
  selectedModel: string
  setSelectedModel: (model: string) => void
}

export default function ModelSelector({ apiKey, selectedModel, setSelectedModel }: ModelSelectorProps) {
  const [models, setModels] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiKey) return

    const fetchModels = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch models")
        }

        const data = await response.json()

        // Filter for free models (where pricing is 0)
        const freeModels = data.data.filter((model: any) => {
          return Number.parseFloat(model.pricing?.prompt) <= 0 && Number.parseFloat(model.pricing?.completion) <= 0
        })

        setModels(
          freeModels.map((model: any) => ({
            id: model.id,
            name: model.name || model.id.split("/").pop(),
            provider: model.id.split("/")[0],
          })),
        )

        // Set the first model as selected if none is selected
        if (freeModels.length > 0 && !selectedModel) {
          setSelectedModel(freeModels[0].id)
        }
      } catch (err) {
        console.error("Error fetching models:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch models")
      } finally {
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [apiKey, selectedModel, setSelectedModel])

  return (
    <div className="space-y-2">
      <Label htmlFor="model-selector">Model</Label>
      <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading || !apiKey}>
        <SelectTrigger id="model-selector" className="w-full">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading models...</span>
            </div>
          ) : (
            <SelectValue placeholder="Select a model" />
          )}
        </SelectTrigger>
        <SelectContent>
          {models.length > 0 ? (
            models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              {error || (apiKey ? "No free models available" : "Enter API key to load models")}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
