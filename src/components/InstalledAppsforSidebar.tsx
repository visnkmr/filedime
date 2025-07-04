"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
// In a real Tauri app, you would use this invoke function.
// For this example, we'll simulate it.
import { invoke } from "@tauri-apps/api/tauri";
import { BotIcon } from "lucide-react";
import { focuscolor, hovercolor } from "../src/components/data-table";

// --- App Interface ---
interface App {
  name: string;
  command: string;
  icon: string; // Base64 encoded icon or a URL
}

export default function InstalledAppsForSidebar() {
      // const [howmanyrows, setrows] = useState(rows)
  const [apps, setApps] = useState<App[]>([]);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    // Fetch the list of installed applications from the backend.
    invoke("get_installed_apps_command", {})
      .then((result: any) => {
        const parsedApps = JSON.parse(result);
        const appsWithColors = parsedApps.map((app: any) => ({
          ...app,
        }));
        setApps(appsWithColors);
      })
      .catch(console.error);
  }, []);

  const filteredApps = useMemo(() => {
    if (!searchTerm) return apps;
    return apps.filter((app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, apps]);

  const handleAppClick = (command: string) => {
    invoke("launch_app_command", { command }).catch(console.error);
  };

  return (
    //   {/* Apps Names List */}
    
    <div className={`flex flex-col justify-start`}>
        <h1 className='pt-8 p-2'>Apps ({filteredApps.length})</h1>
          <div className="flex ">
          <div className="flex ">
            <input
              type="text"
              placeholder="Search for an app..."
              className="bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-full pl-4 p-2"
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
            </div>
        </div>

        {filteredApps.length > 0 ? (
           <div className="flex flex-col pt-2">
            {filteredApps.map((app,index) => (
              // <div
              //   key={app.name}
              //   className="flex flex-row group cursor-pointer ps-2 pt-4"
              //   onClick={() => handleAppClick(app.command)}
              //   title={`Launch ${app.name}`}
              // >
              //   <BotIcon className="w-4 h-4 mr-2"/>
              //   <span className="text-sm text-gray-300 group-hover:text-white break-words line-clamp-1 w-full px-1">
              //     {app.name}
              //   </span>
              // </div>

              <button key={index}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 whitespace-nowrap text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor} line-clamp-1`}
              onClick={()=> handleAppClick(app.command)}
            >
              {/* {mark.is_dir?<FolderIcon className="h-6 w-6 mr-3" />:<FileIcon className="h-6 w-6 mr-3" />} */}
              <div>
    
              <BotIcon className="h-6 w-6"/>
              </div>
                {app.name}
                
            </button>
            ))}
          </div>
        ) : (
           <div className="flex flex-col text-gray-500">
            <p>No applications found. Try refining your search.</p>
          </div>
        )}
      </div>
  );
}
