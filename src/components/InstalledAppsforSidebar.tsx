"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { BotIcon } from "lucide-react";
import { focuscolor, hovercolor } from "../src/components/data-table";

// --- App Interface ---
interface App {
  name: string;
  command: string;
  icon: string; // Base64 encoded icon or a URL
  appfromwhere: string; // Added appfromwhere
}

export default function InstalledAppsForSidebar() {
  const [apps, setApps] = useState<App[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch the list of installed applications from the backend.
    invoke("get_installed_apps_command", {})
      .then((result: any) => {
        const parsedApps = JSON.parse(result);
        const appsWithColors = parsedApps.map((app: any) => ({
          ...app,
          // IMPORTANT: Ensure 'appfromwhere' is present in the data returned by your backend.
          // For demonstration, I'm adding a dummy value if it's not present.
          // In a real scenario, this data should come from your backend.
          appfromwhere: app.appfromwhere || "unknown",
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

  // Calculate unique appfromwhere counts
  const appFromWhereCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredApps.forEach((app) => {
      counts[app.fromwhere] = (counts[app.fromwhere] || 0) + 1;
    });
    return counts;
  }, [filteredApps]);

  const handleAppClick = (command: string) => {
    invoke("launch_app_command", { command }).catch(console.error);
  };

  return (
    <div className={`flex flex-col justify-start`}>
      <h1 className='pt-8 p-2'>
        Apps ({filteredApps.length})
        {Object.keys(appFromWhereCounts).length > 0 && (
          <span className="ml-2 text-sm text-gray-400">
            (
            {Object.entries(appFromWhereCounts)
              .map(([source, count]) => `${source}: ${count}`)
              .join(", ")}
            )
          </span>
        )}
      </h1>
      <div className="flex ">
        <div className="flex ">
          <input
            type="text"
            placeholder="Search for an app..."
            className="dark:bg-gray-800 dark:text-white placeholder-gray-400 border border-gray-700 rounded-full pl-4 p-2"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </div>
      </div>

      {filteredApps.length > 0 ? (
        <div className="flex flex-col pt-2">
          {filteredApps.map((app, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 whitespace-nowrap text-gray-500 transition-all dark:text-gray-400 ${hovercolor} ${focuscolor} line-clamp-1`}
              onClick={() => handleAppClick(app.command)}
            >
              <div>
                <BotIcon className="h-6 w-6" />
              </div>
              {app.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col text-gray-500 p-2">
          <p>No applications found.</p>
          <p>Try refining your search.</p>
        </div>
      )}
    </div>
  );
}