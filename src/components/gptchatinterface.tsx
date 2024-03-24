import { BotIcon, CheckIcon, Loader2, UserIcon, XIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FileItem } from "../shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import FileUploadComponent from "./FIleuploadfromremote";
import { useRouter } from 'next/router';
import {Textarea} from "./ui/textarea"
import { invoke } from "@tauri-apps/api/tauri";
import {fetchEventSource} from '@microsoft/fetch-event-source';
// import MyComponent from "./route";
interface gptargs{
    message?:FileItem,
    fgptendpoint?:string
    // localorremote:boolean
}
interface mitem{
  from:string
  message:string,
  time:string,
  timestamp:number
}
function getchattime(){
  return `${new Date().getHours()}:${new Date().getMinutes() < 10 ? '0' : ''}${new Date().getMinutes()}`
}
function getchattimestamp(){
  return new Date().getTime()
}
export default function GPTchatinterface({message,fgptendpoint}:gptargs){
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
    const[filegptendpoint,setfge]=useState("http://localhost:8694")
    const[localorremote,setlor]=useState(message?true:false)
    
    // const [querystring, setqs] = useState([message.path]);

    const embed = async () => {
      // if(localorremote){
        try {
         const response = await axios.post(`${filegptendpoint}/embed`, { files: filePaths });
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
    };
    //scroll to bottom in chatview
    useEffect(()=> divRef.current.scrollIntoView({behavior: "smooth", block:"end"}), [onemessage])
    const fetchData = async () => {
      // Example URL for the Ollama API generate endpoint

// Example request body for the generate endpoint
if(question.toLocaleLowerCase().startsWith("o2c") ||!filedimegptisrunning){ //outside of current context -o2c

  const requestBody = {
   "model": "llama2",
   "prompt": question.replace("o2c", ""),
   "stream": true // Ensure streaming is enabled
  };
  
  // Fetch the stream from the Ollama API
  fetch(`http://${fgptendpoint}:11434/api/generate`, {
   method: 'POST',
   headers: {
      'Content-Type': 'application/json'
   },
   body: JSON.stringify(requestBody)
  })
  .then(response => {
   const reader = response.body.getReader();
   const decoder = new TextDecoder('utf-8');
  
   return reader.read().then(function processChunk({ done, value }) {
      if (done) {
        console.log('Stream complete');
        return;
      }
  
      // Decode the chunk and log it
      const chunk = decoder.decode(value);
      // console.log(JSON.parse(chunk).response);
      if(JSON.parse(chunk).response){
          setmessage((old)=>{
          
          let resp=JSON.parse(chunk).response;
                  // console.log("-----------"+old)
                  // console.log();
                  // let jp=JSON.parse(resp);
                  let dm=old+resp;
                  return dm});
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
else{
  const abortController = new AbortController();
  const signal = abortController.signal;
  
  await fetchEventSource(`${filegptendpoint}/query-stream`, {
    signal:signal,
    
    method: "POST",
    body: JSON.stringify({
      query:question,
      where:question.toLocaleLowerCase().startsWith("generally")?"ollama":""
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
      // embed();
      if(!fgptendpoint){

        invoke("filegptendpoint",{
          endpoint:""
        }).then((e)=>{
          console.log(e)
          setfge(e)
          setlor(()=>{
            (e as string).includes("localhost")?embed():null;
            return (e as string).includes("localhost")
          })
        })
      }
      else{
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
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault(); // Prevent the default behavior of the Enter key
        const start = event.target.selectionStart;
        const end = event.target.selectionEnd;
        setQuestion(prevQuestion => prevQuestion.substring(0, start) + '\n' + prevQuestion.substring(end));
        // Set the cursor position after the inserted newline
        event.target.selectionStart = event.target.selectionEnd = start + 1;
      }
   };
    return (<>
    {/* <MyComponent/> */}
    {/* {time.toLocaleString()} */}
    <div className="flex flex-row p-2 gap-2 place-content-center">
      <div className="flex flex-row p-2 border-2 place-items-center">{ollamaisrunning?<CheckIcon className="w-4 h-4"/>:<XIcon className="w-4 h-4"/>} Ollama</div>
      <div className="flex flex-row p-2 border-2 place-items-center">{filedimegptisrunning?<CheckIcon className="w-4 h-4"/>:<XIcon className="w-4 h-4"/>} FiledimeGPT</div>
      </div>
    {localorremote?(<h1 className="flex flex-row gap-2"><BotIcon className="h-4 w-4"/>FileGPT : {message?message.path:null}</h1>):(<>
    <FileUploadComponent fge={filegptendpoint} setcmsg={setcmsg}/>
    </>)}
    
    <div className="flex-1 overflow-auto grid gap-4 p-4 h-[80%]" >
        <div className="flex items-start gap-4 flex-col" ref={divRef}>
        {chathistory.map((e)=>{
          // console.log(e)
            return <>
            <div className="flex items-start gap-4">
              <div>

              {e.from==="you"?(<UserIcon className="h-4 w-4"/>):(<BotIcon className="h-4 w-4"/>)}
              </div>
          <div className="flex flex-col gap-1">
            <time className="text-xs text-gray-500 dark:text-gray-400">{e.time}</time>
            <p>
              {e.message}
            </p>
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
            <p
              dangerouslySetInnerHTML={{
                __html: onemessage.replace(/\n/g, '<br/>').replace("[DONESTREAM]","")
              }}
            ></p>
          </div>
          </div>):null
        }
        </div>
        
      </div>
     <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea className="flex-1" value={question} placeholder="Ask the file(s)..." onChange={(event)=>{
            setq(event.target.value)
          }} />
          <Loader2 className={`${chatbuttonstate?"h-4 w-4 animate-spin":"hidden"}`}/>
          <Button disabled={chatbuttonstate} className={``} onClick={handleSubmit}>Send</Button>
        </div>
      </div>
    </>)
}