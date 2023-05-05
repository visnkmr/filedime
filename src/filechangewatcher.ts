export function watchfile(){
    (window as any).__TAURI__.event.listen("send-log", (data: { payload: string }) => {
        // console.log("grandloc")
        let status=data.payload;
        switch(status){
            case "stopped":
                console.log("file watching stopped")
                break;
            case "changed":
                (window as any).__TAURI__.invoke(
                    "list_files",
                    {
                      oid: globalThis.tid.toString(),
                      path: globalThis.frompath,
                      ff: ""
                    });
                break;
        }
        // lastfolder = data.payload.toString();
        // console.log(data.payload.toString())
      });
} 
   