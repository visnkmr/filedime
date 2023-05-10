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
   }