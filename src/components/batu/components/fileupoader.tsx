import { useRef, useState } from "react"
import { Button } from "../components/ui/button"
import { Paperclip, File as FileIcon } from "lucide-react"
import { HoverCard,HoverCardContent,HoverCardTrigger } from "./ui/hover-card"
import {setcolorpertheme} from "../../greet"
import { invoke } from "@tauri-apps/api/tauri"  // Import invoke
export function FileUploader() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
        setFiles(Array.from(event.target.files));
        }
    };

    // Trigger file input click
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Handle file upload
    const handleFileUpload = async () => {
        const formData = new FormData();
        files.forEach(file => {
        formData.append("files", file);
        });

        try {
        const response = await fetch("http://localhost:8477/upload", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const filePaths = await response.json();
            console.log("Uploaded files:", filePaths);
        } else {
            console.error("File upload failed.");
        }
        } catch (error) {
        console.error("Error uploading files:", error);
        }
    };

  return (
    <div className="flex items-center">
    <HoverCard>
          <HoverCardTrigger>
             <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileChange}
      />

      <Button variant="outline" onClick={handleButtonClick}>
        <Paperclip className="mr-2 h-4 w-4" />
        Select Files
      </Button>
      <div className="mt-2 space-y-1">
        {files.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileIcon className="w-4 h-4" />
            <span>{files.length} file{files.length > 1 ? "s" : ""} selected</span>
          </div>
        )}
      </div>
          </HoverCardTrigger>
          <HoverCardContent className={`flex flex-col ${setcolorpertheme}`}>
            {"Select files to use for context"}
          </HoverCardContent>
        </HoverCard>
        {files.length > 0 && (
        <Button variant="outline" onClick={handleFileUpload}>
          Upload Files
        </Button>
      )}
      </div>
  )
}
