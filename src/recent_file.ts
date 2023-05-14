export async function recentfiles(){
    console.log("recent");
    (window as any).__TAURI__.invoke(
    "recent_files", {
      string: ""
  })
}