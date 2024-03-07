import { BotIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FileItem } from "../shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import axios from "axios";
interface gptargs{
    message:FileItem
}

export default function GPTchatinterface({message}:gptargs){
    const [filePaths, setFilePaths] = useState([message.path]);
    const [chathistory, setchathistory] = useState([message.path]);
    const [chatbuttonstate,setcbs]=useState(false)
    const [question,setq]=useState("")
    // const [querystring, setqs] = useState([message.path]);

    const embed = async () => {
       try {
         const response = await axios.post('http://localhost:8080/embed', { files: filePaths });
         setchathistory((old)=>[...old,`${message.name} is ready for your questions`])
         setcbs(true)
         console.log(response.data);
       } catch (error) {
         console.error('Error:', error);
       }
    };
    const handleSubmit = async () => {
       try {
         const response = await axios.post('http://localhost:8080/retrieve', { query: question });
         setchathistory((old)=>[...old,`${response.data} is ready for your questions`])
         console.log(response.data);
       } catch (error) {
         console.error('Error:', error);
       }
    };
    useEffect(()=>{
        embed();
    },[])
    return (<>
    <h1 className="flex flex-row gap-2"><BotIcon className="h-4 w-4"/>FileGPT : {message.name}</h1>
    <div className="flex-1 overflow-auto grid gap-4 p-4 h-[80%]">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-1">
            <time className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</time>
            <p>
              Hey, I just wanted to follow up on the email I sent last week about the upcoming conference. Let me know
              if you have any questions!
            </p>
          </div>
        </div>
        {chathistory.map((e)=>{
            return <>
            {JSON.stringify(e)}
            </>
        })}
        
      </div>
     <div className="p-4 border-t">
        <form className="flex gap-2">
          <Input className="flex-1" value={question} placeholder="Type your message..." onChange={(event)=>{
            setq(event.target.value)
          }} />
          <Button onClick={handleSubmit} disabled={!chatbuttonstate} className={``} type="submit">Send</Button>
        </form>
      </div>
    </>)
}