import { BotIcon, UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FileItem } from "../shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import axios from "axios";
interface gptargs{
    message:FileItem
}
interface mitem{
  from:string
  message:string,
  time:string
}
export default function GPTchatinterface({message}:gptargs){
    const [filePaths, setFilePaths] = useState([message.path]);
    const [chathistory, setchathistory] = useState([{
      from:"bot",
      message:message.path,
      time:new Date().getTime().toString()
    } as mitem]);
    const [chatbuttonstate,setcbs]=useState(false)
    const [question,setq]=useState("")
    // const [querystring, setqs] = useState([message.path]);

    const embed = async () => {
       try {
         const response = await axios.post('http://localhost:8080/embed', { files: filePaths });
         setchathistory((old)=>[...old,{
          from:"bot",
          message:`${message.name} is ready for your questions`,
          time:new Date().getTime().toString()
        }])
         setcbs(true)
         console.log(response.data);
       } catch (error) {
         console.error('Error:', error);
       }
    };
    const handleSubmit = async () => {
       try {
        setchathistory((old)=>[...old,
          {
            from:"you",
          message:`${question}`,
          time:new Date().getTime().toString()
        }
      ])
         const response = await axios.post('http://localhost:8080/retrieve', { query: question });
         console.log(response.data['results']);
         setchathistory((old)=>[...old,
          {
            from:"bot",
          message:`${response.data['results']}`,
          time:new Date().getTime().toString()
        }
      ])
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
        {/* <div className="flex items-start gap-4">
          <div className="flex flex-col gap-1">
            <time className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</time>
            <p>
              Hey, I just wanted to follow up on the email I sent last week about the upcoming conference. Let me know
              if you have any questions!
            </p>
          </div> */}
        {/* </div> */}
        <div className="flex items-start gap-4 flex-col">
        {chathistory.map((e)=>{
            return <>
            <div className="flex items-start gap-4">
              {e.from.toLocaleUpperCase()==="you"?(<UserIcon className="h-4 w-4"/>):(<BotIcon className="h-4 w-4"/>)}
          <div className="flex flex-col gap-1">
            <time className="text-xs text-gray-500 dark:text-gray-400">{e.time}</time>
            <p>
              {e.message}
            </p>
          </div>
          </div>
            </>
        })}
        </div>
        
      </div>
     <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input className="flex-1" value={question} placeholder="Type your message..." onChange={(event)=>{
            setq(event.target.value)
          }} />
          <Button disabled={!chatbuttonstate} className={``} onClick={handleSubmit}>Send</Button>
        </div>
      </div>
    </>)
}