"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, useEffect, useCallback } from "react"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { HoverCard,HoverCardContent,HoverCardTrigger } from "../components/ui/hover-card"
import type { Chat, Message, BranchPoint, FileItem } from "../lib/types"
import { SendIcon, Loader2, MenuIcon, Bot, FileIcon, ArrowDownAZ, MoveDown, Scroll, FileCheck, FileMinus, FileClock, BookX, File, FileStack, FilePlus } from "lucide-react"
import { ScrollArea } from "../components/ui/scroll-area"
import {setcolorpertheme} from "../../greet"
import MessageItem from "../components/message-item"
import { Progress } from "../components/ui/progress"
import LMStudioURL from "./lmstudio-url"
import axios from "axios"
import { invoke } from "@tauri-apps/api/tauri";
import { Label } from "./ui/label"
import { FileUploader } from "./fileupoader"
// --- Type Definitions ---

interface SendMessageStreamParams {
  notollama: number;
  url: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  lmstudio_url:string;
  context:string
}

interface ChatInterfaceProps {
  setlmurl:any;
  setlmmodel:any;
  ollamastate: number;
  chat: Chat;
  updateChat: (chat: Chat) => void;
  apiKey: string;
  selectedModel: string; // Keep selectedModel for overall component state
  selectedModelInfo: any;
  onBranchConversation: (branchPoint: BranchPoint) => void;
  lmstudio_url: string;
  lmstudio_model_name: string;
  filegpt_url: string;
  message?: FileItem;
  directsendmessage?: boolean;
  messagetosend?: string;
  sidebarVisible:any;
  setSidebarVisible:any;
  setIsModelDialogOpen:any;
  getModelColor:any;
  getModelDisplayName:any;
  setollamastate:any;
}

async function fileloader(setIsLoading,chat: Chat,updateChat: (chat: Chat) => void,ollamastate: number,selectedModel: string,lmstudio_model_name: string,filegptendpoint:string,filePaths:string[]):Promise<boolean>{
  // try{

  //   const response = await axios.post(`${filegptendpoint}/embed`, { files: filePaths.map((r)=>r.replace("C:\\","\\mnt\\c\\")) });
  //   if(response.status==200) return true
  // }
  // catch(e){
  //   console.log(e)
  // }
  setIsLoading(true)
  console.log(filePaths)
  invoke("embedfile",{path:filePaths,embeddingmodelname:"nomic-embed-text"}).then((e)=>{
            console.log(e)
            // Prepare user and assistant messages
              const assistantMessageId = (Date.now() + 1).toString();
              const assistantMessage: Message = {
                id: assistantMessageId,
                role: "assistant",
                content:  `File: ${filePaths} added to context`,
                timestamp: new Date().toISOString(),
                model:  ollamastate==0 ? selectedModel : lmstudio_model_name,
              };


              const initialMessages = chat.messages;
              let currentChatState = {
                  ...chat,
                  messages: [...initialMessages, assistantMessage],
                  title: initialMessages.length === 0 ? `FileGPT: ${filePaths} ` : chat.title,
                  lastModelUsed:  ollamastate==0 ? selectedModel : lmstudio_model_name,
              };
              updateChat(currentChatState);
        })
        .catch((e)=>{
          const assistantMessageId = (Date.now() + 1).toString();
              const assistantMessage: Message = {
                id: assistantMessageId,
                role: "assistant",
                content:  `Faled to add File: ${filePaths}`,
                timestamp: new Date().toISOString(),
                model:  ollamastate==0 ? selectedModel : lmstudio_model_name,
              };


              const initialMessages = chat.messages;
              let currentChatState = {
                  ...chat,
                  messages: [...initialMessages, assistantMessage],
                  title: initialMessages.length === 0 ? `FileGPT: ${filePaths} ` : chat.title,
                  lastModelUsed:  ollamastate==0 ? selectedModel : lmstudio_model_name,
              };
              updateChat(currentChatState);
              setIsLoading(false)
        })

        .finally(()=>{
          setIsLoading(false)
        })
        setIsLoading(false)
  return false      
}

// --- Exported Send Message Stream Function ---

/**
 * Sends messages to a chat completion API and yields content chunks as an async generator.
 *
 * @param params - The parameters for the API call.
 * @returns An async generator yielding content chunks.
 * @throws An error if the API call fails or the response body is null.
 */
export async function* sendMessageStream({
  notollama,
  url,
  apiKey,
  model,
  messages,
  lmstudio_url,
  context
}: SendMessageStreamParams): AsyncGenerator<string, void, unknown> {
  const storedApiKey = localStorage.getItem("openrouter_api_key")
  let prompt = context.trim()===""?`Given the following chathistory, answer the question accurately and concisely. \n\nChat History:\n${messages.slice(0,messages.length-1).map(m => m.content).join('\n')}\n\nQuestion: ${messages[messages.length-1].content}`:`Given the following chathistory, context, answer the question accurately and concisely. If the answer is not in the context, state that you cannot answer from the provided information.\n\nChat History:\n${messages.slice(0,messages.length-1).map(m => m.content).join('\n')}\n\nContext: ${context}\n\nQuestion: ${messages[messages.length-1].content}`;
  console.log(prompt)
  let headers_openrouter = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedApiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.href : "",
        "X-Title": "Batu",
      };
    let headers_ollama={ 'Content-Type': 'application/json' };
  // if (notollama===0 || notollama===2) {
    const response = await fetch(`${url}/v1/chat/completions`, {
      method: "POST",
      headers: (notollama===0 || notollama===2)?headers_openrouter:headers_ollama,
      body: JSON.stringify({
        model: model,
        messages: [{role:'user',content:prompt}],
        stream: true,
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage = errorData || "Failed to get response";
      try {
        const jsonError = JSON.parse(errorData);
        errorMessage = jsonError.error?.message || errorMessage;
      } catch {
        // Ignore if parsing fails, use the raw text
      }
      throw new Error(errorMessage);
    }
  
    if (!response.body) {
      throw new Error("Response body is null");
    }
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value);
      const lines = chunk
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => line.replace(/^data: /, "").trim());
  
      for (const line of lines) {
        if (line === "[DONE]") continue;
  
        try {
          const parsedLine = JSON.parse(line);
          const content = parsedLine.choices[0]?.delta?.content || "";
          if (content) {
            yield content; // Yield each content chunk
          }
        } catch (e) {
          console.warn("Failed to parse stream line:", line, e);
        }
      }
    }
  // }
  // else{
  //     const requestBody = {
  //         "model": model,
  //         "messages": messages,
  //         "stream": true // Ensure streaming is enabled
  //     };

  //     const response = await fetch(`${lmstudio_url}/v1/chat/completions`, {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify(requestBody)
  //     })
  //     if (!response.ok) {
  //       const errorData = await response.text();
  //       let errorMessage = errorData || "Failed to get response";
  //       try {
  //         const jsonError = JSON.parse(errorData);
  //         errorMessage = jsonError.error?.message || errorMessage;
  //       } catch {
  //         // Ignore if parsing fails, use the raw text
  //       }
  //       throw new Error(errorMessage);
  //     }
    
  //     if (!response.body) {
  //       throw new Error("Response body is null");
  //     }
    
  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder("utf-8");
    
  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;
    
  //       const chunk = decoder.decode(value);
  //       const lines = chunk
  //         .split("\n")
  //         .filter((line) => line.trim() !== "")
  //         .map((line) => line.replace(/^data: /, "").trim());
    
  //       for (const line of lines) {
  //         if (line === "[DONE]") continue;
    
  //         try {
  //           const parsedLine = JSON.parse(line);
  //           const content = parsedLine.choices[0]?.delta?.content || "";
  //           if (content) {
  //             yield content; // Yield each content chunk
  //           }
  //         } catch (e) {
  //           console.warn("Failed to parse stream line:", line, e);
  //         }
  //       }
  //     }

  // }
  
}


// --- Exported Chat Interface Component ---

export default function ChatInterface({
  ollamastate,
  chat,
  updateChat,
  apiKey,
  lmstudio_url,
  setlmmodel,
  setlmurl,
  lmstudio_model_name,
  filegpt_url,
  message,
  selectedModel,
  selectedModelInfo,
  onBranchConversation,
  directsendmessage = false,
  messagetosend = "",
  
  sidebarVisible,
  setSidebarVisible,
  setIsModelDialogOpen,
  getModelDisplayName,
  getModelColor,
  setollamastate
}: ChatInterfaceProps) {
  // const [filePaths, setFilePaths] = useState([message?message.path:""]);

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dsm,setdsm]=useState(directsendmessage)
  const [mts,setmts]=useState(messagetosend)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string[]>([message?.path?message.path:""])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [contextUsage, setContextUsage] = useState(0)
  const [answerfromfile, setanswerfromfile] = useState(true)

  // Calculate context usage effect
  useEffect(() => {
    const totalChars = chat.messages.reduce((acc, msg) => acc + msg.content.length, 0) + input.length
    const estimatedTokens = Math.ceil(totalChars / 4)
    const maxContext = selectedModelInfo?.context_length || 4096
    const usagePercentage = Math.min(100, Math.ceil((estimatedTokens / maxContext) * 100))
    setContextUsage(usagePercentage)
  }, [chat.messages, input, selectedModelInfo])

  useEffect(()=>{invoke("fileslist",{}).then((filePaths)=>{
            console.log(filePaths)
            // Prepare user and assistant messages
              const assistantMessageId = (Date.now() + 1).toString();
              const assistantMessage: Message = {
                id: assistantMessageId,
                role: "assistant",
                content:  `File: ${filePaths} added to context`,
                timestamp: new Date().toISOString(),
                model:  ollamastate==0 ? selectedModel : lmstudio_model_name,
              };


              const initialMessages = chat.messages;
              let currentChatState = {
                  ...chat,
                  messages: [...initialMessages, assistantMessage],
                  title: initialMessages.length === 0 ? `FileGPT: ${filePaths} ` : chat.title,
                  lastModelUsed:  ollamastate==0 ? selectedModel : lmstudio_model_name,
              };
              updateChat(currentChatState);
        })
  },[])
  useEffect(() => {
    if (message?.path) {
      setSelectedFilePath([...message.path])
      // setFilePaths([message.path])
      // fileloader(setIsLoading,chat,updateChat,ollamastate,selectedModel,lmstudio_model_name,filegpt_url,selectedFilePath)
    }
  }, [message])

            // const [context,setcontext]=useState("")

  // State for dialog to request URL and model name
  const [showDialog, setShowDialog] = useState(false);
  // const [tempUrl, setTempUrl] = useState(lmstudio_url);
  // const [tempModelName, setTempModelName] = useState(lmstudio_model_name);

  // Main function to handle sending a message
  const handleSendMessage = async (messageContent: string = input) => {
    if (!messageContent.trim() || isLoading) return;

    setError(null);
    
    // Check if using LM Studio or Ollama and if URL and model are provided
    if (ollamastate === 1 || ollamastate === 2) {
      if (!lmstudio_url || !lmstudio_model_name) {
        setShowDialog(true);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    if (messageContent === input) {
        setInput(""); // Clear input only if sending from text area
    }

    // Prepare user and assistant messages
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
      model:  ollamastate==0 ? selectedModel : lmstudio_model_name,
    };
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      model:  ollamastate==0 ? selectedModel : lmstudio_model_name,
    };

    setStreamingMessageId(assistantMessageId);

    const initialMessages = chat.messages;
    // Update chat with user message & placeholder
    let currentChatState = {
        ...chat,
        messages: [...initialMessages, userMessage, assistantMessage],
        title: initialMessages.length === 0 ? messageContent.slice(0, 30) : chat.title,
        lastModelUsed:  ollamastate==0 ? selectedModel : lmstudio_model_name,
    };
    updateChat(currentChatState);

    

        // Call the generator and process the stream
        if(ollamastate!==3){
          try {
            // Determine API URL and model
            let apiUrl = "";
            if (ollamastate === 0) {
              apiUrl = "https://openrouter.ai/api";
            } else if (ollamastate === 1 || ollamastate === 2) {
              apiUrl = lmstudio_url;
            } else if (ollamastate === 3) {
              apiUrl = filegpt_url;
            }
            const modelToSend = ollamastate==0 ? selectedModel : lmstudio_model_name;
            const messagesToSend = [...initialMessages, userMessage].map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
             const stored_lm_model_name = localStorage.getItem("lmstudio_model_name")
            let accumulatedContent = "";
            
            const context=answerfromfile?(await invoke("queryfile",{question:JSON.stringify(messagesToSend[messagesToSend.length-1].content),
             model:stored_lm_model_name?stored_lm_model_name:"qwen2.5:3b",
             embeddingmodelname:"nomic-embed-text",
             usecompletefile:fullfileascontext,
             pathstr: searchcurrent?(await(await import('@tauri-apps/api/window')).appWindow.title()).replace("FileGPT: ",""):"ALL"
            }).catch(e=>console.log(e)) as string):""; 
            console.log(`----------context: ${context}`)

              for await (const contentChunk of sendMessageStream({
                  url: apiUrl,
                  notollama: ollamastate,
                  apiKey: apiKey,
                  model: modelToSend,
                  messages: sendwithhistory?messagesToSend:[messagesToSend[messagesToSend.length-1]],
                  lmstudio_url:lmstudio_url,
                  context:answerfromfile?context:""
              })) {
                  accumulatedContent += contentChunk;
      
                  // Update the last message (assistant's) with new content
                  const updatedMessages = [...currentChatState.messages];
                  updatedMessages[updatedMessages.length - 1] = {
                      ...updatedMessages[updatedMessages.length - 1],
                      content: accumulatedContent,
                  };
      
                  currentChatState = {
                      ...currentChatState,
                      messages: updatedMessages,
                  };
                  updateChat(currentChatState); // Update UI
              }
            } catch (err) {
              console.error("Error sending message:", err);
              setError(err instanceof Error ? err.message : "An error occurred");
              // On error, remove the assistant placeholder message
              updateChat({
                  ...chat,
                  messages: [...initialMessages, userMessage],
              });
            } finally {
                setIsLoading(false);
                setStreamingMessageId(null);
            }
        }
        else{
           const messagesToSend = [...initialMessages, userMessage].map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
        const stored_lm_model_name = localStorage.getItem("lmstudio_model_name")
          invoke("queryfile",{question:JSON.stringify(messagesToSend[messagesToSend.length-1].content),
             model:stored_lm_model_name?stored_lm_model_name:"qwen2.5:3b",
             embeddingmodelname:"nomic-embed-text",
             usecompletefile:fullfileascontext,
             pathstr: searchcurrent?(await(await import('@tauri-apps/api/window')).appWindow.title()).replace("FileGPT: ",""):"ALL"
            }).then((e)=>{
            // console.log(e)
             // Update the last message (assistant's) with new content
              const updatedMessages = [...currentChatState.messages];
              updatedMessages[updatedMessages.length - 1] = {
                  ...updatedMessages[updatedMessages.length - 1],
                  content: e as string,
              };
  
              currentChatState = {
                  ...currentChatState,
                  messages: updatedMessages,
              };
              updateChat(currentChatState); // Update UI
              setIsLoading(false);
              setStreamingMessageId(null);
        //     setlocalip(
        //         <>
        //             <p className="font-semibold">Ollama should be running @ http://{e}:11434.</p>
        //             <p className="font-semibold"><Link target="_blank" href="https://github.com/visnkmr/filegpt-filedime">FiledimeGPT python server</Link> if installed should be running @ http://{e}:8694.</p>
        //             <p className="font-semibold">FiledimeGPT LAN local instance is accessible @ http://{e}:8477 for any device on your connected network.</p>
        //         </>
        // );
        }).catch((e)=>{
          const updatedMessages = [...currentChatState.messages];
              updatedMessages[updatedMessages.length - 1] = {
                  ...updatedMessages[updatedMessages.length - 1],
                  content: e as string,
              };
  
              currentChatState = {
                  ...currentChatState,
                  messages: updatedMessages,
              };
              updateChat(currentChatState); // Update UI
        })
        setIsLoading(false);
        setStreamingMessageId(null);
        }

    
  };

    // Effect for direct message sending
  useEffect(() => {
    if (dsm && mts && !isLoading) {
        handleSendMessage(mts);
        setdsm(false)
        setmts("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsm, mts, isLoading]); // Dependencies added

  // --- Other Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Add toast logic here if needed
  };

  const handleBranchFromMessage = (messageId: string) => {
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex >= 0) {
      const branchPoint: BranchPoint = {
        originalChatId: chat.id,
        messages: chat.messages.slice(0, messageIndex + 1),
        branchedFromMessageId: messageId,
        timestamp: new Date().toISOString(),
      };
      onBranchConversation(branchPoint);
    }
  };

  // Function to handle dialog submission
  const handleDialogSubmit = () => {
    if (lmstudio_model_name && lmstudio_url) {
      // localStorage.setItem("lmstudio_url", tempUrl)
      // localStorage.setItem("lmstudio_model_name", tempModelName)
      // Assuming there is a way to update these values in the parent component or context
      // For now, we'll just log a message since updating parent state requires additional props
      // console.log("Updated LM Studio/Ollama URL and Model:", tempUrl, tempModelName);
      setShowDialog(false);
      // Trigger sending the message again with updated values
      handleSendMessage();
    } else {
      setError("Both URL and model name are required.");
    }
  };
  const [autoscroll,setautoscroll]=useState(false);
  const [fullfileascontext,setfullfileascontext]=useState(false);
  const [sendwithhistory,setsendwithhistory]=useState(false);
  const [searchcurrent,setsearchcurrent]=useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrolltobottom = useCallback(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, [chat,scroll]);
      
    useEffect(() => {
    if (autoscroll) {
      setTimeout(scrolltobottom, 2); // run the function every 2ms
    }
    }, [chat]);
  // --- JSX Rendering ---
  const [sbi,setcobi] = useState(false)
    const [morethanonefile,setmtof]=useState(false)
    useEffect(()=>{
      invoke("fileslist",{}).then((filePaths)=>{setmtof(filePaths!.length>1?true:false)})
    },[])
  return (
    <div className="" onClick={()=>setcobi(false)}>
      {/* Dialog for URL and Model Name */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 focus:outline-none" tabIndex={-1} onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleDialogSubmit();
            }
          }}>
            <h2 className="text-xl font-semibold mb-4">LM Studio/Ollama Configuration</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please provide the URL and model name to proceed.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                type="text"
                value={lmstudio_url}
                onChange={(e) => setlmurl(e.target.value)}
                placeholder="Enter URL"
                className="w-full"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Model Name</label>
              <Input
                type="text"
                value={lmstudio_model_name}
                onChange={(e) => setlmmodel(e.target.value)}
                placeholder="Enter Model Name"
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleDialogSubmit}>Submit</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      {/* <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold truncate">{chat.title || "New Chat"}</h2>
      </div> */}

      {/* Message Area */}
      {/* <ScrollArea className="h-full justify-center"> w-9 */}
      {/* <div className="flex overflow-hidden"> Make chat history grow and handle overflow */}
      <div className="absolute w-full bottom-0 top-0 pt-20 mb-[144px] overflow-y-scroll pl-8 pr-8" ref={containerRef}>
        <div className="mx-auto flex w-full max-w-3xl flex-col mb-10">
          {/* mx-auto flex w-full max-w-3xl flex-col space-y-12 px-4 pb-10 pt-safe-offset-10 */}
          {chat.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-gray-500 dark:text-gray-400">Send a message to start the conversation</p>
            </div>
          ) : (
            chat.messages.map((message) => (
              <MessageItem
                
                key={message.id}
                message={message}
                isStreaming={streamingMessageId === message.id}
                onCopy={() => handleCopyMessage(message.content)}
                onBranch={() => handleBranchFromMessage(message.id)}
                setmts={setmts}
                setdsm={setdsm}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        </div>
        {/* </div> */}
      {/* </ScrollArea> */}

      

      {/* Error Display */}
      {error && (
        <div className="p-2 mx-4 mb-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="absolute w-full bottom-0  pl-8 pr-8 " >
        <div className="mx-auto flex w-full max-w-4xl flex-col pb-10  bg-gray-50 dark:bg-gray-900">
      {/* <div className="max-w-3xl justify-center p-4 absolute bottom-0 w-full bg-gray-50 dark:bg-gray-900"> */}
        {/* Context Usage Bar */}
        {/* <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Context Usage</span>
            <span>{contextUsage}%</span>
          </div>
          <Progress value={contextUsage} className="h-1" />
        </div> */}

        {/* Text Input & Send Button */}
        
        <div className="flex flex-grow items-end gap-2">
          <div className="flex flex-col flex-grow">

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Ctrl+Enter for new line)"
            className="flex-1 min-h-[80px] max-h-[200px] dark:bg-gray-900 border bg-gray-50"
            disabled={isLoading}
          />
          <Progress value={contextUsage} className="h-1" />
          </div>
          
        </div>
        <div className="mt-4 flex flex-row gap-4 w-full">
          <Button
              variant="outline"
              onClick={(e)=>{setcobi(true);e.stopPropagation();setollamastate((ollamastate+1)%4)}}
              // disabled={!currentChat || currentChat.messages.length === 0}
            >
              <Bot size={16} className="mr-2"/>
              {`${sbi?(ollamastate===0?"Using Openrouter":(ollamastate===1?"Using Ollama":("Using LM Studio"))):""}`}
            </Button>
          {ollamastate==0?(<Button variant="outline" onClick={() => setIsModelDialogOpen(true)} className="flex items-center gap-2">
                        {selectedModelInfo ? (
                          <>
                            <div className={`w-4 h-4 rounded-full bg-${getModelColor(selectedModel)}`}></div>
                            <span className="truncate max-w-[150px]">{getModelDisplayName(selectedModel)}</span>
                          </>
                        ) : (
                          "Select Model"
                        )}
                      </Button>):null}
          {ollamastate===3 && (
            <div className="flex items-center gap-2">
              <FileUploader/>
               {/* <Label htmlFor="picture">Picture</Label>
            <Input id="picture" type="file" />
              <Input
                type="text"
                value={selectedFilePath[(selectedFilePath.length-1)]}
                onChange={(e) => setSelectedFilePath([...e.target.value])}
                placeholder="Enter file path or choose file"
                className="flex-grow"
              /> */}
              {/* <Button variant="outline" size="icon" onClick={() => fileloader(setIsLoading,chat,updateChat,ollamastate,selectedModel,lmstudio_model_name,filegpt_url,selectedFilePath)}>
                <FileIcon className="h-4 w-4" />
                <Input  id="picture" type="file" />
              </Button> */}
            </div>
          )}
          <Button variant={"outline"} onClick={() => handleSendMessage()} disabled={isLoading || !input.trim()} className= "text-black dark:text-white ">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
           <Button 
          variant="outline" 
          size="icon" 
          onClick={scrolltobottom} 
          className="rounded-full shadow-md bg-gray-100 dark:bg-gray-800"
          title="Scroll to bottom"
        >
          <MoveDown className="h-4 w-4" />
        </Button> 
        <Button 
          variant="outline" 
          size="icon" 
          onClick={()=>setautoscroll(cv=>!cv)} 
          className="rounded-full shadow-md bg-gray-100 dark:bg-gray-800"
          title="Autoscroll"
        >
          <Scroll className="h-4 w-4" />
        </Button>
        {answerfromfile?(<HoverCard>
          <HoverCardTrigger>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={()=>setfullfileascontext(cv=>!cv)} 
              className="rounded-full shadow-md bg-gray-100 dark:bg-gray-800"
              // title="Include file history"
            >
              {fullfileascontext?(<FileCheck className="h-4 w-4" />):(<FileMinus className="h-4 w-4"/>)}
          </Button>
          </HoverCardTrigger>
          <HoverCardContent className={`flex flex-col ${setcolorpertheme}`}>
            {fullfileascontext?"Full file contents will be passed as context":"Embeddings will be passed as context"}
          </HoverCardContent>
        </HoverCard>):null}
        <HoverCard>
          <HoverCardTrigger>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={()=>setsendwithhistory(cv=>!cv)} 
              className="rounded-full shadow-md bg-gray-100 dark:bg-gray-800"
              // title="Include chat history"
            >
              {sendwithhistory?(<FileClock className="h-4 w-4" />):(<BookX className="h-4 w-4"/>)}
          </Button>
          </HoverCardTrigger>
          <HoverCardContent className={`flex flex-col ${setcolorpertheme}`}>
            {sendwithhistory?"Full chat history will be passed as context":"Ignore chat history"}
          </HoverCardContent>
        </HoverCard>
        {(morethanonefile)?( <HoverCard>
          <HoverCardTrigger>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={()=>setsearchcurrent(cv=>!cv)} 
              className="rounded-full shadow-md bg-gray-100 dark:bg-gray-800"
              // title="Search which files"
            >
              {searchcurrent?(<File className="h-4 w-4" />):(<FileStack className="h-4 w-4"/>)}
          </Button>
          </HoverCardTrigger>
          <HoverCardContent className={`flex flex-col ${setcolorpertheme}`}>
            {searchcurrent?"Search current file":"Search all the files"}
          </HoverCardContent>
        </HoverCard>):null}
       {(true)?( <HoverCard>
          <HoverCardTrigger>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={()=>setanswerfromfile(cv=>!cv)} 
              className="rounded-full shadow-md bg-gray-100 dark:bg-gray-800"
              // title="Search which files"
            >
              {answerfromfile?(<FilePlus className="h-4 w-4" />):(<FileMinus className="h-4 w-4"/>)}
          </Button>
          </HoverCardTrigger>
          <HoverCardContent className={`flex flex-col ${setcolorpertheme}`}>
            {answerfromfile?"answer from file":"Answer without context"}
          </HoverCardContent>
        </HoverCard>):null}
        </div>
        </div>
      </div>
    </div>
  );
}
