"use client"

import { useEffect, useState } from "react"
import ChatInterface from "../components/chat-interface"
import ChatHistory from "../components/chat-history"
import ApiKeyInput from "../components/api-key-input"
import LMStudioURL from "../components/lmstudio-url"
import LMStudioModelName from "../components/localmodelname"
import FileGPTUrl from "../components/filegpt-url"
import type { Chat, BranchPoint, ModelRow } from "../lib/types"
import { Button } from "../components/ui/button"
import { PlusIcon, MenuIcon, XIcon, Download, Bot } from "lucide-react"
import ModelSelectionDialog from "../components/model-selection-dialog"
import ExportDialog from "../components/export-dialog"
import { Toaster } from "../components/ui/toaster"
import { cn } from "../lib/utils"
import DarkButton from './dark-button'
import axios from "axios"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import bigDecimal from "js-big-decimal"
interface FileItem {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    rawfs: number;
    lmdate: number;
    timestamp: number;
    foldercon: number;
    ftype: string;
    parent: string;
  }
interface gptargs{
    message?:FileItem,
    fgptendpoint?:string,
    setasollama:boolean
    // localorremote:boolean
}

let fgtest=async (filegptendpoint):Promise<boolean> => {
      try {
        await axios.get(`${filegptendpoint}/`);
        return true
      } catch (error) {
        return false
      }
    };
let oir=async (fgptendpoint):Promise<boolean> => {
      try {
        await axios.head(`http://${fgptendpoint}:11434/`); //endpoint to check for ollama
        return true
      } catch (error) {
        return false
      }
    };
async function fileloader(filegptendpoint:string,filePaths:string[]):Promise<boolean>{
  try{

    const response = await axios.post(`${filegptendpoint}/embed`, { files: filePaths });
    if(response.status==200) return true
  }
  catch(e){
    console.log(e)
  }
  return false      
}
async function sendtofilegpt(filegptendpoint,question,isollama,setcbs,setmessage,setchathistory){
   const abortController = new AbortController();
  const signal = abortController.signal;
  
  await fetchEventSource(`${filegptendpoint}/query-stream`, {
    signal:signal,
    
    method: "POST",
    body: JSON.stringify({
      query:question,
      where:question.toLocaleLowerCase().startsWith("generally")||isollama?"ollama":""
    }),
    headers: { 'Content-Type': 'application/json', Accept: "text/event-stream" },
    onopen: async (res)=> {
      if (res.ok && res.status === 200) {
        setcbs(true)
        console.log("Connection made ", res);
        // setmessage("")
      } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        setcbs(false)
        console.log("Client-side error ", res);
      }
    },
    onmessage: async (event)=> {
      {
    // if(typeof event.data === "string"){
      try{
        let jp=JSON.parse(event.data);
        setmessage((old)=>{
          // console.log("-----------"+old)
          console.log(event.data);
            let dm=old+jp.token;
          return dm});
      }
      catch(e){
        
      }
        
        }
          // (divRef.current! as HTMLDivElement).scrollIntoView({ behavior: "smooth", block: "end" })
      // }
    },
    onclose:async ()=> {
      setcbs(false)
      console.log("Connection closed by the server");
      
    },
    onerror (err) {
      setchathistory((old)=>[...old,{
        from:"bot",
        message:`Issue finding Filegpt endpoint ${filegptendpoint} endpoint, maybe its not be running.`,
        time:getchattime(),
        timestamp:getchattimestamp()
      }])
      throw "There was some issue with your filedimegpt instance. Is it not running?"
      // abortController.abort()
      // console.log("There was an error from server", err);
    },
  });
}
export default function ChatUI({message,fgptendpoint="localhost",setasollama=false}:gptargs) {
  const [apiKey, setApiKey] = useState<string>("")
  const [lmurl, setlmurl] = useState<string>("")
  const [model_name, set_model_name] = useState<string>("")
  const [filegpturl, setFilegpturl] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedModelInfo, setSelectedModelInfo] = useState<any>("")
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>("")
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [ollamastate, setollamastate] = useState(0)
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [allModels, setAllModels] = useState<any[]>([])
  const [filePaths, setFilePaths] = useState([message?message.path:null]);
  //Collapse sidebar on chat select
  const [collapsed, setCollapsed] = useState(true);
  useEffect(()=>{
    setCollapsed(true)
  },[currentChatId])
  // useEffect(()=>{const storedApiKey = localStorage.getItem("openrouter_api_key")
  //     if (storedApiKey) {
  //       setApiKey(storedApiKey)
  //     }},[collapsed])
  // Load API key and chats from localStorage on initial render
  useEffect(() => {
    const storedlmurl = localStorage.getItem("lmstudio_url")
    if (storedlmurl) {
      setlmurl(storedlmurl)
    }
    
    const stored_lm_model_name = localStorage.getItem("lmstudio_model_name")
    if (storedlmurl && stored_lm_model_name) {
      set_model_name(stored_lm_model_name)
      setSelectedModel(model_name)
    }

    const storedFilegpturl = localStorage.getItem("filegpt_url")
    if (storedFilegpturl) {
      setFilegpturl(storedFilegpturl)
    }
    console.log("checking here for ollamastate val")
    {
      const storedApiKey = localStorage.getItem("openrouter_api_key")
      if (storedApiKey) {
        setApiKey(storedApiKey)
      }
      const selmodel = localStorage.getItem("or_model")
      const selmodelinfo = localStorage.getItem("or_model_info")
      if(selmodel)
      setSelectedModel(selmodel)
      setSelectedModelInfo(selmodelinfo)
    }

    localStorage.setItem("laststate",ollamastate.toString())
  }, []);
  // console.log("ollamastatae val "+ollamastate)
  // console.log(lmurl)
  // console.log(model_name)

  //Chat history loader
  useEffect(() => {
 console.log("checking here for ollamastate val 1")
    const lastState = localStorage.getItem("laststate");
    setollamastate(lastState ? parseInt(lastState, 10) : 0);
    

    

    const storedChats = localStorage.getItem("chat_history")
    if (storedChats) {
      try {
        const parsedChats = JSON.parse(storedChats)
        setChats(parsedChats)

        // Set current chat to the most recent one if it exists
        if (parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id)
        } else {
          createNewChat()
        }
      } catch (error) {
        console.error("Failed to parse stored chats:", error)
        createNewChat()
      }
    } else {
      createNewChat()
    }
  }, [])

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("chat_history", JSON.stringify(chats))
    }
  }, [chats])

  // Fetch models when API key is set
  useEffect(() => {
    if (ollamastate!==0) return

    const fetchModels = async () => {
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
        const models = data.data
    const freemodelss=models.filter((model)=>{if (!model?.id || !model?.pricing?.prompt || !model?.pricing?.completion ){return false}return true}).filter((m)=>{return parseFloat(new bigDecimal(m.pricing.prompt).getValue())<=0?true:false}).sort((a, b) => b.created-(a.created))  ;  
      console.log(freemodelss)
    // // Create main directory
    // if (!fs.existsSync(PATH_TO_PROVIDERS)) {
    //     fs.mkdirSync(PATH_TO_PROVIDERS)
    // }

    // Group models by provider
    // const providerModels = new Map<string, ModelRow[]>()
        
    // for (const model of models) {
    //     if (!model?.id || !model?.pricing?.prompt || !model?.pricing?.completion ) {
    //         console.warn('Skipping invalid model:', model)
    //         continue
    //     }
    //     const [provider, ...modelParts] = model.id.split('/')
    //     // if (!supportedProviderList.includes(provider)) {
    //     //     continue
    //     // }
    //     if (!providerModels.has(provider)) {
    //         providerModels.set(provider, [])
    //     }

    //     // Convert pricing values to numbers before using toFixed(10)
    //     const promptPrice = new bigDecimal(model.pricing.prompt).getValue()
    //     const completionPrice = new bigDecimal(model.pricing.completion).getValue()

    //     const modelRow: ModelRow = {
    //         id:model.id,
    //         context_length:model.context_length,
    //         model: modelParts.join('/'), // Only include the part after the provider
    //         cost: {
    //             prompt_token: parseFloat(promptPrice),
    //             completion_token: parseFloat(completionPrice),
    //         },
    //         supported_parameters:model.supported_parameters
    //     }

    //     providerModels.get(provider)!.push(modelRow)
    // }

    // const allProviders = Array.from(providerModels.values()).flat()

    // Sort by model name for easier diffs
    // const freemodels=allProviders.filter((m)=>{return m.cost.prompt_token<=0?true:false}).sort((a, b) => a.model.localeCompare(b.model))  
    // console.log(freemodels)
    setAllModels(freemodelss)
        // setAllModels(data.data)

        // // Filter for free models (where pricing is 0)
        // const freeModels = data.data.filter((model: any) => {
        //   return Number.parseFloat(model.pricing?.prompt) <= 0 && Number.parseFloat(model.pricing?.completion) <= 0
        // })

        // Set the first model as selected if none is selected
        // if (freeModels.length > 0 && !selectedModel) {
        //   setSelectedModel(freeModels[0].id)
        //   setSelectedModelInfo(freeModels[0])
        // }
      } catch (err) {
        console.error("Error fetching models:", err)
      }
    }

    fetchModels()
  }, [apiKey])

  const createNewChat = () => {
    const newChatId = Date.now().toString()
    const newChat: Chat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastModelUsed: selectedModel,
      branchedFrom: null,
    }

    setChats((prevChats) => [newChat, ...prevChats])
    setCurrentChatId(newChatId)
  }

  const updateChat = (updatedChat: Chat) => {
    setChats((prevChats) => prevChats.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)))
  }
 const renameChat = (id: string, newTitle: string) => {
    setChats(chats.map((chat) => (chat.id === id ? { ...chat, title: newTitle } : chat)))
  }
  const deleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId))

    if (currentChatId === chatId) {
      if (chats.length > 1) {
        // Set current chat to the next available one
        const nextChat = chats.find((chat) => chat.id !== chatId)
        if (nextChat) {
          setCurrentChatId(nextChat.id)
        } else {
          createNewChat()
        }
      } else {
        createNewChat()
      }
    }
  }

  const handleBranchConversation = (branchPoint: BranchPoint) => {
    const newChatId = Date.now().toString()
    const originalChat = chats.find((chat) => chat.id === branchPoint.originalChatId)

    if (!originalChat) return

    // Create a title based on the last user message in the branch
    const lastUserMessage = [...branchPoint.messages].reverse().find((msg) => msg.role === "user")
    const branchTitle = lastUserMessage ? `Branch: ${lastUserMessage.content.slice(0, 20)}...` : "New Branch"

    const newChat: Chat = {
      id: newChatId,
      title: branchTitle,
      messages: branchPoint.messages,
      createdAt: new Date().toISOString(),
      lastModelUsed: selectedModel,
      branchedFrom: {
        chatId: branchPoint.originalChatId,
        messageId: branchPoint.branchedFromMessageId,
        timestamp: branchPoint.timestamp,
      },
    }

    setChats((prevChats) => [newChat, ...prevChats])
    setCurrentChatId(newChatId)
  }

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId)
    localStorage.setItem("or_model",modelId);
    const modelInfo = allModels.find((model: any) => model.id === modelId)
    setSelectedModelInfo(modelInfo || null)
    localStorage.setItem("or_model_info",modelInfo ||null);
    setIsModelDialogOpen(false)
  }


  const toggleMenu = () => {
    setCollapsed(prev => !prev);
  };

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  // const [viewportHeight, setViewportHeight] = useState((typeof window === 'undefined')? "h-full" :window.innerHeight);

  // useEffect(() => {
  //   if (typeof window === 'undefined') return;
  //   const handleResize = () => {
  //     setViewportHeight(window.visualViewport?.height || window.innerHeight);
  //   };

  //   window.visualViewport?.addEventListener('resize', handleResize);
  //   window.addEventListener('resize', handleResize);

  //   // Initial call
  //   handleResize();

  //   return () => {
  //     window.visualViewport?.removeEventListener('resize', handleResize);
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, []);

  const debounce = (func: (...args: any[]) => void, wait: number): (...args: any[]) => void => {
    let timeout: NodeJS.Timeout | undefined;
    return function executedFunction(...args: any[]): void {
      const later = (): void => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  useEffect(() => {
    const setViewportHeight = () => {
      document.documentElement.style.setProperty('--100vh', `${window.innerHeight}px`);
    };
    setViewportHeight();
    const debouncedSetViewportHeight = debounce(setViewportHeight, 100);
    window.addEventListener('resize', debouncedSetViewportHeight);
    return () => {
      window.removeEventListener('resize', debouncedSetViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      // In a real Next.js app, you might use next/router here
      // For example: router.replace(window.location.href.replace('http:', 'https:'));
      if (window.location.protocol !== 'https:') {
        console.warn("Attempting to redirect to HTTPS (simulated for component context)");
        // window.location.protocol = "https:"; // This would cause a full page reload
      }
    }
  }, []);
  
  return (
    <div className="absolute min-h-svh flex flex-col inset-0 w-screen bg-gray-50 dark:bg-gray-900">
      {(
        <div  style={{ height: 'var(--100vh, 100vh)' }} className="relative overflow-hidden">
          <div className="absolute top-4 left-4 z-50 p-2 rounded-md  dark:text-white  dark:bg-gray-900 bg-gray-10 ">
            <div className="flex flex-row gap-4 ">
          <Button className="bg-gray-50 dark:bg-gray-900" variant="ghost" size="icon" onClick={() => toggleMenu()}>
            {<MenuIcon size={20} />}
          </Button>
         <Button onClick={createNewChat} variant={"outline"} className=" w-full flex items-center justify-center gap-2">
              <PlusIcon size={16} />
              New Chat
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
              disabled={!currentChat || currentChat.messages.length === 0}
            >
              <Download size={16} className="" />
              <span className="hidden lg:inline lg:ml-2">Export</span>
            </Button>
             
            </div>
          </div>
          <div className="absolute top-4 right-4 z-50 p-2 rounded-md  text-white dark:bg-gray-900 bg-gray-10 ">
          <DarkButton/>

          </div>
          <div className={cn(`overflow-y-auto absolute top-0 left-0 h-full bg-gray-50 dark:bg-gray-900 text-white transition-transform duration-300 ease-in-out z-40 ${
          collapsed ? '-translate-x-full' : 'translate-x-0'}`,"pt-20 border-r border-gray-200 dark:border-r-gray-950")}>
          {ollamastate==0?(<div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
          </div>):null}
          {ollamastate!==0 ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <LMStudioURL lmurl={lmurl} setlmurl={setlmurl} />
              </div>
              {ollamastate !== 3 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <LMStudioModelName model_name={model_name} set_model_name={set_model_name} />
                </div>
              )}
              {ollamastate === 3 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <FileGPTUrl filegpturl={filegpturl} setFilegpturl={setFilegpturl} />
                </div>
              )}
            </>
          ) : <></>}
          

          <div className="flex-1 overflow-y-auto pb-16 ">
            <ChatHistory
            chats={chats}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            deleteChat={deleteChat}
            renameChat={renameChat}
      />
          </div>

            
            </div>
           
        </div>
      )}
                {/* <SidebarMenu/> */}
       {/* <div className={` ${!collapsed?"absolute bottom-0 left-0 p-4 z-50 w-48":"hidden"}`}> */}
              {/* <Button onClick={createNewChat} className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-900 dark:text-white text-black border border-gray-200 dark:border-gray-700">
                <PlusIcon size={16} />
                New Chat
              </Button>
            </div> */}

      {/* Main content */}
      <div  style={{ height: 'var(--100vh, 100vh)' }} className={cn("absolute bottom-0 z-10 w-full px-2 bg-gray-50 dark:bg-gray-900 overflow-hidden")} onClick={()=>{setCollapsed(true)}} >
        {/* <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarVisible?(<Button variant="ghost" size="icon" onClick={() => setSidebarVisible(!sidebarVisible)}>
            {<MenuIcon size={20} />}
          </Button>):null}
        </div> */}

        {currentChat && (
          <ChatInterface
            setollamastate={setollamastate}
            ollamastate={ollamastate}
            lmstudio_model_name={model_name}
            lmstudio_url={lmurl}
            filegpt_url={filegpturl}
            message={message}
            chat={currentChat}
            updateChat={updateChat}
            apiKey={apiKey}
            selectedModel={selectedModel}
            selectedModelInfo={selectedModelInfo}
            onBranchConversation={handleBranchConversation}
            directsendmessage={false}
            messagetosend=""
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            getModelColor={getModelColor}
            getModelDisplayName={getModelDisplayName}
            setIsModelDialogOpen={setIsModelDialogOpen}
          />
        )}
      </div>

      {/* Model Selection Dialog */}
      <ModelSelectionDialog
        isOpen={isModelDialogOpen}
        onClose={() => setIsModelDialogOpen(false)}
        models={allModels}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        apiKey={apiKey}
      />

      {/* Export Dialog */}
      <ExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} chat={currentChat} />

      <Toaster />
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
