"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
// In a real Tauri app, you would use this invoke function.
// For this example, we'll simulate it.
import { invoke } from "@tauri-apps/api/tauri";
import { Search } from "lucide-react";
import {cn} from "../../lib/utils"
import { ZoomableContent } from "../../components/ZoomableContent";
// --- Mock invoke function for demonstration purposes ---
// In your actual Tauri app, you would remove this and use the official API.
// const invoke = (command: string, args: any): Promise<string> => {
//   console.log(`Simulating invoke: ${command}`, args);
//   if (command === "get_installed_apps_command") {
//     // Simulate a list of installed applications
//     const mockApps = [
//       { name: "Cosmic Messenger", command: "cosmic-messenger", icon: "" },
//       { name: "Stellar Paint", command: "stellar-paint", icon: "" },
//       { name: "Galaxy Text Editor", command: "galaxy-text", icon: "" },
//       { name: "Orbit Browser", command: "orbit-browser", icon: "" },
//       { name: "Nebula Notes", command: "nebula-notes", icon: "" },
//       { name: "Supernova System Monitor", command: "supernova-monitor", icon: "" },
//       { name: "Comet Calendar", command: "comet-calendar", icon: "" },
//       { name: "Astro File Manager", command: "astro-files", icon: "" },
//       { name: "Planet Player", command: "planet-player", icon: "" },
//       { name: "Rocket Terminal", command: "rocket-term", icon: "" },
//       { name: "Meteor Mail", command: "meteor-mail", icon: "" },
//       { name: "Void Launcher", command: "void-launcher", icon: "" },
//     ];
//     return Promise.resolve(JSON.stringify(mockApps));
//   }
//   if(command === "launch_app_command") {
//     alert(`Simulating launch of: ${args.command}`);
//   }
//   return Promise.resolve("");
// };

// --- Helper for generating random colors for bot icons ---
const colors = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500",
  "bg-yellow-500", "bg-indigo-500", "bg-pink-500", "bg-sky-500"
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

// --- SVG Bot Icon Component ---
const BotIcon = ({ colorClass }: { colorClass: string }) => (
  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClass} shadow-md`}>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  </div>
);


// --- App Interface ---
interface App {
  name: string;
  command: string;
  icon: string; // Base64 encoded icon or a URL
  color: string; // Assigned color for the fallback icon
}

export default function InstalledAppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Effect to handle scroll detection
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      // Set state based on whether the user has scrolled down
      if (mainEl.scrollTop > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []); // This effect runs only once after the component mounts

  useEffect(() => {
    // Fetch the list of installed applications from the backend.
    invoke("get_installed_apps_command", {})
      .then((result: any) => {
        const parsedApps = JSON.parse(result);
        const appsWithColors = parsedApps.map((app: any) => ({
          ...app,
          color: getRandomColor()
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
    <ZoomableContent>

    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans duration-1000 ease-in-out place-items-center items-center">
      {/* Header and Search Bar with dynamic classes */}
     

      {/* Apps Grid */}
      <main ref={mainRef} className="flex-grow overflow-y-auto p-6 md:p-8 lg:p-12 duration-1000 ease-in-out">
          <div className={cn(`
          flex-shrink-0 flex justify-center p-4 transition-all duration-1000 ease-in-out z-20`,`
          ${isScrolled
              ? 'h-24 sticky top-0' //backdrop-blur-sm bg-gray-900/10 shadow-lg  
              : 'h-[25vh] md:h-[30vh] items-center'
          }
        `)}>
          <div className="w-full max-w-lg absolute transition-all duration-1000 ease-in-out">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-1000 ease-in-out" size={20} />
            <input
              type="text"
              placeholder="Search for an app..."
              className="w-full transition-all duration-1000 ease-in-out dark:bg-gray-800 dark:text-white placeholder-gray-400 border border-gray-700 rounded-full py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 "
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
            />
          </div>
        </div>
        {filteredApps.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-x-6 gap-y-8">
            {filteredApps.map((app) => (
              <div
                key={app.name}
                className="flex flex-col items-center justify-center text-center group cursor-pointer"
                onClick={() => handleAppClick(app.command)}
                title={`Launch ${app.name}`}
              >
                <div className="w-24 h-24 p-2 flex items-center justify-center transition-transform duration-200 ease-in-out group-hover:scale-110">
                   {
                  //  app.icon ? (
                  //   <img
                  //     src={app.icon}
                  //     alt={`${app.name} icon`}
                  //     className="w-16 h-16 object-contain"
                  //     onError={(e) => {
                  //       (e.target as HTMLImageElement).style.display = 'none';
                  //     }}
                  //   />
                  // ) :
                   (
                    <BotIcon colorClass={app.color} />
                  )}
                </div>
                <span className="mt-2 text-sm text-gray-300 group-hover:text-white break-words w-full px-1">
                  {app.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
           <div className="text-center text-gray-500 mt-16">
            <p className="text-lg">No applications found.</p>
            <p>Try refining your search.</p>
          </div>
        )}
      </main>
    </div>
    </ZoomableContent>
  );
}
