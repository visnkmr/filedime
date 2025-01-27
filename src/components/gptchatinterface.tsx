import { BotIcon, CheckIcon, Loader2, UserIcon, XIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FileItem } from "../shared/types";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import FileUploadComponent from "./FIleuploadfromremote";
import { useRouter } from 'next/router';
import {Textarea} from "./ui/textarea"
import { invoke } from "@tauri-apps/api/tauri";
import {fetchEventSource} from '@microsoft/fetch-event-source';
import { Checkbox } from "./ui/checkbox";
import { Markdown } from "./markdown";
import { useDebounce } from "use-debounce";

// import MyComponent from "./route";
interface gptargs{
    message?:FileItem,
    fgptendpoint?:string,
    setasollama:boolean
    // localorremote:boolean
}
interface mitem{
  from:string
  message:string,
  time:string,
  timestamp:number
}
function getchattime(){
  return `${new Date().getHours()}:${new Date().getMinutes() < 10 ? '0' : ''}${new Date().getMinutes()}:${new Date().getSeconds() < 10 ? '0' : ''}${new Date().getSeconds()}`
}
function getchattimestamp(){
  return new Date().getTime()
}
export default function GPTchatinterface({message,fgptendpoint="localhost",setasollama=false}:gptargs){
  // let sao=(value:boolean)=>{setasollama=value};
  const [isollama,sao]=useState(setasollama)
  
  // const [useollama,seto]=useState(setasollama)
  console.log("endpoint-->"+fgptendpoint)
  // const [time, setTime] = useState(new Date());
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setTime(new Date());
  //   }, 1);

  //   // Clean up the interval when the component is unmounted
  //   return () => clearInterval(timer);
  // }, []);

  const [onemessage,setmessage]=useState("")
  // useEffect(()=>{
  //   if(onemessage.includes("[DONESTREAM]")){
  //         console.log("end-------------->"+onemessage)
            
          
  //       // setmessage("")
  //         }
  // },[onemessage])
    const [filePaths, setFilePaths] = useState([message?message.path:null]);
    const [chathistory, setchathistory] = useState([{
      from:"bot",
      message:message?message.path:"Choose files to embed",
      time:getchattime(),
      timestamp:getchattimestamp()
    } as mitem]);
    const [chathistorytemp, setchathistorytemp] = useState([] as mitem[]);
    const [chatbuttonstate,setcbs]=useState(false)
    const [question,setq]=useState("")
    const[filegptendpoint,setfge]=useState(`http://${fgptendpoint}:8694`)
    const[localorremote,setlor]=useState(message?true:false)
    
    // const [querystring, setqs] = useState([message.path]);

    const embed = async () => {
      if(message!.path){
        console.log("embed")
        // if(localorremote){
          try {
           const response = await axios.post(`${filegptendpoint}/embed`, { files: filePaths });
           sao(false)
           setchathistory((old)=>[...old,{
            from:"bot",
            message:`${message?message.path:"The file(s)"} is ready for your questions`,
            time:getchattime(),
            timestamp:getchattimestamp()
          }])
           setcbs(false)
           console.log(response.data);
         } catch (error) {
          setchathistory((old)=>[...old,{
            from:"bot",
            message:`Issue finding Filegpt endpoint, maybe its not be running.`,
            time:getchattime(),
            timestamp:getchattimestamp()
          }])
           console.error('Error:', error);
         }
        // }
      }
    };
    const scrolltobottom = useCallback(() => {
      divRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }, [onemessage]);
      
      useEffect(() => {
      if (autoscroll) {
      setTimeout(scrolltobottom, 2); // run the function every 2ms
      }
      }, [onemessage]);
    const fetchData = async () => {
      // Example URL for the Ollama API generate endpoint

// Example request body for the generate endpoint
if(question.toLocaleLowerCase().startsWith("o2c") ||!filedimegptisrunning){ //outside of current context -o2c

  const requestBody = {
   "model": "lmstudio-community/deepseek-r1-distill-qwen-7b",
   "messages": [
    // {"role": "system", "content": "Always answer in rhymes."},
    {"role": "user", "content":question.replace("o2c", "")}
  ],
   "stream": true // Ensure streaming is enabled
  };
  // let tempstore=useRef([])
  // Fetch the stream from the Ollama API
  fetch(`http://${fgptendpoint}:11434/v1/chat/completions`, {
   method: 'POST',
   headers: {
      'Content-Type': 'application/json'
   },
   body: JSON.stringify(requestBody)
  })

  .then(response => {
    const reader = response.body.getReader();
    // console.log(reader)
   const decoder = new TextDecoder('utf-8');
  
   return reader.read().then(function processChunk({ done, value }) {
     const chunk = decoder.decode(value).slice(5);
      if (done || chunk.includes("[DONE]")) {
        console.log('Stream complete');
        return;
      }
  
      // Decode the chunk and log it
      // console.log(JSON.parse(chunk));
      // if(JSON.parse(chunk)){
      try{

        let resp=JSON.parse(chunk);
          resp=resp.choices[0].delta.content;
          console.log(resp)
                    setmessage((old)=>{
                    let dm=old+resp;
                    return dm});
          // }
      } 
      catch (error) {
        console.error(error)
      }
      // Read the next chunk
      return reader.read().then(processChunk);
   });
  })
  .catch(error => {
    setchathistory((old)=>[...old,{
      from:"bot",
      message:`Issue finding Ollama http://${fgptendpoint}:11434 endpoint, maybe its not be running.`,
      time:getchattime(),
      timestamp:getchattimestamp()
    }])
    console.error('Error reading stream:', error)});
}
else
{
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
    };
        const handleSubmit = async () => {
      if(onemessage.trim()!==""){
        setchathistory((old)=>[...old,
          {
            from:"bot",
          message:onemessage.replace("[DONESTREAM]",""),
          time:getchattime(),
          timestamp:getchattimestamp()
        }
      ])
      
      }
        setchathistory((old)=>[...old,
          {
            from:"you",
          message:`${question}`,
          time:getchattime(),
          timestamp:getchattimestamp()
        }
      ])
      
      //   const sendreq=async ()=>{
      //     try {
      //       setcbs(false)
      //       const response =  await axios.post(`${filegptendpoint}/retrieve`, { query: question });
      //       console.log(response.data['results']);
      //       setchathistory((old)=>[...old,
      //         {
      //           from:"bot",
      //         message:`${response.data['results']}`,
      //         time:getchattime(),
            // timestamp:getchattimestamp()
      //       }
      //     ])

      //     setcbs(true)
      //   } catch (error) {
      //     setcbs(true)
      //     console.error('Error:', error);
      //   }
      // }
      // sendreq();
      
      
        setmessage("")
        setq("")
        fetchData();       
    };
    useEffect(()=>{

      embed();
      // if(!fgptendpoint){
      //   let url=typeof window !== 'undefined' ? window.location.hostname : '/'
      //   setfge(url)
      //   // invoke("filegptendpoint",{
      //   //   endpoint:""
      //   // }).then((e)=>{
      //   //   console.log(e)
      //   //   setfge(e)
      //   //   setlor(()=>{
      //   //     (e as string).includes("localhost")?embed():null;
      //   //     return (e as string).includes("localhost")
      //   //   })
      //   // })
      // }
      // else
      {
        setfge(`http://${fgptendpoint}:8694`)
      }
      fgtest(); //check if filedimegpt is running
      oir(); //check if ollama is running
      // console.log("-----------------"+filegptendpoint+"-----------------")
    },[])
    let [ollamaisrunning,setoir]=useState(false);
    let oir=async () => {
      try {
        await axios.head(`http://${fgptendpoint}:11434/`); //endpoint to check for ollama
        setoir(true)
      } catch (error) {
        setoir(false)
      }
    };
    useEffect(()=>{
      oir();

    },[fgptendpoint])
    let [filedimegptisrunning,setfgir]=useState(false);
    let fgtest=async () => {
      try {
        await axios.get(`${filegptendpoint}/`);
        setfgir(true)
      } catch (error) {
        setfgir(false)
      }
    };
    const divRef = useRef(null);

    const [cmsg,setcmsg]=useState("")
    useEffect(()=>{
      console.log(cmsg)
      if(cmsg!==""){

        setchathistory((old)=>[...old,{
                  from:"bot",
                  message:cmsg,
                  time:getchattime(),
                  timestamp:getchattimestamp()
                }])
      }
    },[cmsg])
    const [autoscroll,setas]=useState(false)
    useEffect(()=>{
      console.log(setasollama)
    },[setasollama])
    return (<>
    {/* <MyComponent/> */}
    {/* {time.toLocaleString()} */}
    <div className="flex flex-row p-2 gap-2 place-content-center">
      <div className="flex flex-row p-2 border-2 place-items-center">{ollamaisrunning?<CheckIcon className="w-4 h-4"/>:<XIcon className="w-4 h-4"/>} Ollama</div>
      <div className="flex flex-row p-2 border-2 place-items-center">{filedimegptisrunning?<CheckIcon className="w-4 h-4"/>:<XIcon className="w-4 h-4"/>} FiledimeGPT</div>
      </div>
    {localorremote?(<h1 className="flex flex-row gap-2"><BotIcon className="h-4 w-4"/>FileGPT : {message?message.path:null}</h1>):(<>
    <FileUploadComponent fge={filegptendpoint} setcmsg={setcmsg} setasollama={sao}/>
    </>)}
    
    <div className="overflow-auto grid gap-4 p-4 h-[70%] mb-5" >
        <div className="flex items-start gap-4 flex-col flex-grow" ref={divRef}>
        {chathistory.map((e)=>{
          // console.log(e)
            return <>
            <div className="flex items-start gap-4">
              <div>

              {e.from==="you"?(<UserIcon className="h-4 w-4"/>):(<BotIcon className="h-4 w-4"/>)}
              </div>
          <div className="flex flex-col gap-1">
            <time className="text-xs text-gray-500 dark:text-gray-400">{e.time} 
            <Button className="ml-4 text-black dark:text-white" variant={"outline"} onClick={()=>{
              const requestBody = {
                "text": `${e.message}`.toString(),
                "comments":"something here"
               };
              fetch(`http://127.0.0.1:8694/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
              })
              .then(response => {
                console.log(response)
                })
              .catch(error => {
                console.error('Error reading stream:', error)});  
            }}>Listen to this response</Button></time>
             {/* <p
              dangerouslySetInnerHTML={{
                __html: e.message.replace(/\n/g, '<br/>')
              }}
            ></p> */}
            <Markdown content={e.message}/>
          </div>
          </div>
            </>
        })}
        { onemessage!==""?  (
            <div className="flex items-start gap-4">
              <div>
              <BotIcon className="h-4 w-4"/>
              </div>
          <div className="flex flex-col gap-1">
            <time className="text-xs text-gray-500 dark:text-gray-400">{getchattime()}</time>
            {/* <p
              dangerouslySetInnerHTML={{
                __html: onemessage.replace(/\n/g, '<br/>').replace("[DONESTREAM]","")
              }}
            ></p> */}
            <Markdown content={onemessage.replace("[DONESTREAM]","")}/>
          </div>
          </div>):null
        }
        </div>
        
      </div>
     <div className="p-4 border-t sticky bottom-0">
        <div className="flex gap-2">
          <Textarea className="flex-1" value={question} placeholder="Ask the file(s)..." onChange={(event)=>{
            setq(event.target.value)
          }} />
          <Loader2 className={`${chatbuttonstate?"h-4 w-4 animate-spin":"hidden"}`}/>

          
          <Button disabled={chatbuttonstate} className={``} onClick={handleSubmit}>Send</Button>
        </div>
        <div className="flex flex-row gap-2 p-2 m-2">

          <Checkbox onClick={()=>setas((cv)=>!cv)}></Checkbox>
          <p className="">Autoscroll</p>
          </div>
      </div>
    </>)
}

