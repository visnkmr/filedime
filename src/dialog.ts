import { window as uio } from '@tauri-apps/api';
// let si=uio.PhysicalSize
let wts=document.getElementById("wts") as HTMLDivElement
wts.textContent="new"
async function getWindowSize() {
    wts.textContent=""
    const size = await uio.appWindow.outerSize();
    wts.textContent+='Outer h'+size.height;
    wts.textContent+='Outer w'+size.width;
  
    const innerSize = await uio.appWindow.innerSize();
    wts.textContent+='Inner h:'+ innerSize.height;
    wts.textContent+='Inner w:'+ innerSize.width;
  }
  
  getWindowSize();

  window.addEventListener('resize', ()=>getWindowSize());

  