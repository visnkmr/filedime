var interval:NodeJS.Timer;
// Declare the type of the timer element
type TimerElement = HTMLElement & {
    textContent: string;
  };
  let timer = document.getElementById("timer") as TimerElement;
  timer.className = "hide"
// Declare the type of the interval variableZ
function updatetimer() {
    // Get the timer element
  
  
    // Set the start time
    let startTime = new Date();
  
    // Update the timer every second
    interval = setInterval(function () {
      // Get the current time
      let currentTime = new Date();
  
      // Calculate the elapsed time
      let elapsedTime = currentTime.getTime() - startTime.getTime();
  
      // Convert the elapsed time to minutes and seconds
      let minutes: number = Math.floor(elapsedTime / 1000 / 60);
      let seconds: number = Math.floor((elapsedTime / 1000) % 60);
  
      // Pad the minutes and seconds with leading zeros if needed
      let paddedMinutes: string = minutes < 10 ? "0" + minutes : minutes.toString();
      let paddedSeconds: string = seconds < 10 ? "0" + seconds : seconds.toString();
  
      // Display the elapsed time
      timer.textContent = paddedMinutes + ":" + paddedSeconds;
    }, 1000);
  }

 export function stoptimer(){

     (window as any).__TAURI__.event.listen("stop-timer", (data: { payload: string }) => {
        timer.className = "hide"
        clearInterval(interval);
      });
 } 

 export function starttimer(){
    (window as any).__TAURI__.event.listen("start-timer", (data: { payload: string }) => {
        timer.className = "show"
        updatetimer();
      });
 }