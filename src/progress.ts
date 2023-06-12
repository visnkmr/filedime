import * as globals from './file-explorer';


export function progress(){
    (window as any).__TAURI__.event.listen("progress", (data: { payload: number }) => {
        // globalThis.loaded=data.payload;
      var percomp = (globalThis.loaded / globalThis.total! * 100);
      var setp = document.getElementById("myprogress") as HTMLProgressElement;
        setp.value = percomp;
      if (percomp == 100)
        setp.className = "hide"
      else
        setp.className = "show"
    });
    // type statusmesg={
    //   message:string,
    //   status:string
    //   }
    // (window as any).__TAURI__.event.listen("infiniteloader", (data: { payload: string }) => {
    //     // globalThis.loaded=data.payload;
    //     let statusofpar:statusmesg=JSON.parse(JSON.stringify(data.payload)) as statusmesg;
       
    //     switch(statusofpar.status){
    //         case "start":globals.loader.hidden = false;
    //         break;
    //         case "stop":globals.loader.hidden=true;
    //         break;
    //       }
    // });
   }