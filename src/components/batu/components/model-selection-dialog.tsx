"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { BotIcon, CloudIcon, EyeIcon, FileIcon, Loader2 } from "lucide-react"
import { cn } from "../lib/utils"
import { ScrollArea } from "../components/ui/scroll-area"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import Marquee from "react-fast-marquee";
import type { Chat, BranchPoint, ModelRow, OpenRouterModel } from "../lib/types"

interface ModelSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  models: any[]
  selectedModel: string
  onSelectModel: (modelId: string) => void
  apiKey: string
}

export default function ModelSelectionDialog({
  isOpen,
  onClose,
  models,
  selectedModel,
  onSelectModel,
  apiKey,
}: ModelSelectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [filteredModels, setFilteredModels] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // useEffect(() => {
  //   if (!apiKey || models.length > 0) return

  //   const fetchModels = async () => {
  //     setIsLoading(true)
  //     try {
  //       const response = await fetch("https://openrouter.ai/api/v1/models", {
  //         headers: {
  //           Authorization: `Bearer ${apiKey}`,
  //         },
  //       })

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch models")
  //       }

  //       const data = await response.json()
  //       // Models are fetched in the parent component
  //     } catch (err) {
  //       console.error("Error fetching models:", err)
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }

  //   fetchModels()
  // }, [apiKey, models.length])

  // Filter models based on search query
  useEffect(() => {
    if (!models) {
      setFilteredModels([])
      return
    }

    if (!searchQuery) {
      setFilteredModels(models)
      return
    }

    const filtered = models.filter((model) => {
      const modelName = model.id.toLowerCase()
      const provider = model.id.split("/")[0].toLowerCase()
      const modelId = model.id.split("/").pop().toLowerCase()
      return (
        modelName.includes(searchQuery.toLowerCase()) ||
        provider.includes(searchQuery.toLowerCase()) ||
        modelId.includes(searchQuery.toLowerCase())
      )
    })

    setFilteredModels(filtered)
  }, [models, searchQuery])

  const HoverMarqueeItem = ({ text }: { text: string }) => {
    const [isHovered, setIsHovered] = useState(false);
  
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="text-center w-full"
      >
        <Marquee
        className="h3 font-medium text-sm truncate w-full"
          play={isHovered}  // Only play when hovered
          speed={50}         // Adjust speed here
          gradient={false}   // No gradient fade effect
        >
          <span>{text}</span>
        </Marquee>
      </div>
    );
  };

  // Get a random color for the model icon
  const getModelColor = (modelId: string): string => {
    const colors = [
      "bg-purple-500",
      "bg-pink-500",
      "bg-rose-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
    ]

    // Simple hash function to get consistent color
    let hash = 0
    for (let i = 0; i < modelId.length; i++) {
      hash = modelId.charCodeAt(i) + ((hash << 5) - hash)
    }

    const index = Math.abs(hash) % colors.length
    return colors[index]
  }
  const [modelcount, setmodelcount] = useState(10)

  // Format pricing to be more readable
  // const formatPrice = (price: string) => {
  //   if (!price) return "N/A"
  //   const numPrice = Number.parseFloat(price)
  //   if (numPrice === 0) return "Free"
  //   return `$${numPrice.toFixed(7)}`
  // }
  // const [isHovered, setIsHovered] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-y-auto sm:max-w-[800px] max-h-[80vh] flex flex-col bg-gray-900">
        <DialogHeader>
          <DialogTitle>Select a Model</DialogTitle>
        </DialogHeader>

        <div className="sticky top-0 left-0 z-40">
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          // <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredModels.slice(0, modelcount).map((model:OpenRouterModel) => (
                <div
                  key={model.id}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all",
                    selectedModel === model.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5",
                  )}
                  onClick={() => onSelectModel(model.id)}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                      getModelColor(model.id),
                    )}
                  >
                    <BotIcon className="h-6 w-6 text-white" />
                  </div>

                  <div className="text-center w-full">
                   <HoverMarqueeItem text={model.id.split("/").pop()!} />
                    <p className="text-xs text-gray-500 truncate w-full" title={model.id.split("/")[0]}>
                      {model.id.split("/")[0]}
                    </p>
                  </div>
                  <div className="flex gap-2">

                  {(model.supported_parameters.includes("include_reasoning") || model.supported_parameters.includes("reasoning"))?<CloudIcon/>:""}
                  {model.architecture.input_modalities.includes("image")?<EyeIcon/>:""}
                  {(model.architecture.input_modalities.includes("file") )?<FileIcon/>:""}
                  </div>
                  <div className="mt-2 flex flex-col items-center gap-1 w-full">
                    <Badge variant="outline" className="text-xs">
                      {model.context_length.toLocaleString()} tokens
                    </Badge>

                    {/* <div className="flex justify-between w-full text-xs mt-1">
                      <span>Input:</span>
                      <span>{formatPrice(model.pricing?.prompt)}</span>
                    </div>

                    <div className="flex justify-between w-full text-xs">
                      <span>Output:</span>
                      <span>{formatPrice(model.pricing?.completion)}</span>
                    </div> */}
                  </div>
                </div>
              ))}
              {modelcount+10 < filteredModels.length && (<div
                  key={"othermodels"}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all",
                    "border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5",
                  )}
                  onClick={() => setmodelcount( modelcount+10)}
                >
                 

                  <div className="flex items-center h-full ">
                    <p className="h3 font-medium text-sm truncate w-full" >
                      More models
                    </p>
                  </div>

                  
                </div>)}
            </div>
          // </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
