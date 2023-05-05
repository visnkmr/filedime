import * as globals from './file-explorer';

export function handlerightclick(e:MouseEvent){
    if((e.target as HTMLElement).className=="td1"){
      
        // Prevent the default menu from showing up
        e.preventDefault();
        globalThis.frompath=(e.target as HTMLElement).dataset.path as string;
        globals.menu.replaceChildren();
        let o1=document.createElement("li")
        o1.id="o1"
        o1.textContent="Open in new tab"
        globals.menu.appendChild(o1);
       let o2=document.createElement("li")
        o2.id="o2"
        o2.textContent="Copy"
        globals.menu.appendChild(o2);
       let o3=document.createElement("li")
        o3.id="o3"
        o3.textContent="paste"
        globals.menu.appendChild(o3);
       let o4=document.createElement("li")
        o4.id="o4"
        o4.textContent="add bookmark"
        globals.menu.appendChild(o4);
        // Show the custom menu
        globals.menu.style.display = "block";
  
    
        // Position the menu according to the mouse coordinates
        globals.menu.style.left = e.pageX + "px";
        globals.menu.style.top = e.pageY + "px";
      }
      else if((e.target as HTMLElement).className=="mark-button"){
        
        // Prevent the default menu from showing up
        e.preventDefault();
        globalThis.frompath=(e.target as HTMLElement).dataset.path as string;
        globals.menu.replaceChildren();
        let o1=document.createElement("li")
        o1.id="o5"
        o1.textContent="remove bookmark"
        globals.menu.appendChild(o1);
  
        globals.menu.style.display = "block";
  
    
        // Position the menu according to the mouse coordinates
        globals.menu.style.left = e.pageX + "px";
        globals.menu.style.top = e.pageY + "px";
      }
}