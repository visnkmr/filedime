"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Label } from "../components/ui/label"
import { Download } from "lucide-react"
import type { Chat } from "../lib/types"

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  chat: Chat | undefined
}

type ExportFormat = "pdf" | "txt" | "json"

export default function ExportDialog({ isOpen, onClose, chat }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("txt")

  const handleExport = () => {
    if (!chat) return

    switch (exportFormat) {
      case "txt":
        exportAsTxt(chat)
        break
      case "json":
        exportAsJson(chat)
        break
      case "pdf":
        exportAsPdf(chat)
        break
    }

    onClose()
  }

  const exportAsTxt = (chat: Chat) => {
    let content = `# ${chat.title || "Chat Export"}\n`
    content += `# Date: ${new Date(chat.createdAt).toLocaleString()}\n\n`

    chat.messages.forEach((message) => {
      content += `${message.role.toUpperCase()} [${new Date(message.timestamp).toLocaleString()}]:\n`
      content += `${message.content}\n\n`
    })

    downloadFile(content, `chat-export-${Date.now()}.txt`, "text/plain")
  }

  const exportAsJson = (chat: Chat) => {
    const content = JSON.stringify(chat, null, 2)
    downloadFile(content, `chat-export-${Date.now()}.json`, "application/json")
  }

  const exportAsPdf = (chat: Chat) => {
    // This is a simplified version that creates a basic PDF using browser print
    // For a production app, you'd want to use a library like jsPDF or pdfmake
    const content = document.createElement("div")
    content.innerHTML = `
      <h1>${chat.title || "Chat Export"}</h1>
      <p>Date: ${new Date(chat.createdAt).toLocaleString()}</p>
      <hr />
      ${chat.messages
        .map(
          (message) => `
        <div style="margin-bottom: 20px;">
          <p><strong>${message.role.toUpperCase()}</strong> [${new Date(message.timestamp).toLocaleString()}]:</p>
          <div style="white-space: pre-wrap;">${message.content}</div>
        </div>
      `,
        )
        .join("")}
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${chat.title || "Chat Export"}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
              pre { white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 5px; }
              code { font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            </style>
          </head>
          <body>
            ${content.innerHTML}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Chat</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="txt" id="txt" />
              <Label htmlFor="txt">Plain Text (.txt)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json">JSON (.json)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf">PDF Document (.pdf)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!chat}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
