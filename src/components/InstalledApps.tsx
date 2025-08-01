"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
// In a real Tauri app, you would use this invoke function.
// For this example, we'll simulate it.
import { invoke } from "@tauri-apps/api/tauri";

// --- App Interface ---
interface App {
  name: string;
  command: string;
  icon: string; // Base64 encoded icon or a URL
  fromwhere:string;
}

export default function InstalledAppsPage({rows}) {
      const [howmanyrows, setrows] = useState(rows)
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
      <div className={`p-4 flex flex-row `}>
          <div className="flex place-content-center place-items-center">
          <div className="flex ">
            <input
              type="text"
              placeholder="Search for an app..."
              className="dark:bg-gray-800 dark:text-white placeholder-gray-400 border border-gray-700 rounded-full py-2 pl-8 pr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 "
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
            </div>
        </div>

        {filteredApps.length > 0 ? (
           <div className="flex flex-row gap-x-6 gap-y-8">
            {filteredApps.slice(0,howmanyrows===-1?filteredApps.length:5).map((app) => (
              <div
                key={app.name}
                className="flex flex-col items-center justify-center text-center group cursor-pointer p-4"
                onClick={() => handleAppClick(app.command)}
                title={`Launch ${app.name}`}
              >
                <span className="text-sm text-gray-300 group-hover:text-white break-words line-clamp-1 w-full ps-1">
                  {app.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
           <div className="text-center text-gray-500 ps-4">
            <p className="text-lg">No applications found.</p>
            <p>Try refining your search.</p>
          </div>
        )}
      </div>
  );
}
