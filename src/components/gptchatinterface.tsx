import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Button } from "./ui/button";
import { FileItem } from "../shared/types";
import FileChatInterface from "../../file-chat-interface/index"
interface gptargs {
    message?: FileItem,
    fgptendpoint?: string,
    setasollama: boolean
}

interface ExtensionInfo {
    id: string;
    manifest: {
        name: string;
        version: string;
        author: string;
        description: string;
        entry_point: string;
        permissions: string[];
    };
    enabled: boolean;
}

export default function GPTchatinterface({ message, fgptendpoint = "localhost", setasollama = false }: gptargs) {
    const [enabledExtensions, setEnabledExtensions] = useState<ExtensionInfo[]>([]);
    const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
    const [extensionModule, setExtensionModule] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEnabledExtensions = async () => {
            try {
                setLoading(true);
                const extList: ExtensionInfo[] = await invoke("list_extensions");
                const enabled = extList.filter(ext => ext.enabled);
                setEnabledExtensions(enabled);
                // Default to the File Chat Interface extension if available
                const fileChatExt = enabled.find(ext => ext.manifest.name === "File Chat Interface");
                if (fileChatExt) {
                    setSelectedExtension(fileChatExt.id);
                }
                setLoading(false);
            } catch (err) {
                setError(`Failed to load extensions: ${err}`);
                setLoading(false);
            }
        };

        fetchEnabledExtensions();
    }, []);

    useEffect(() => {
        const loadExtensionModule = async () => {
            if (selectedExtension) {
                try {
                    const bundleUrl: string = await invoke("get_extension_bundle_url", {
                        extensionId: selectedExtension
                    });
                    if (bundleUrl.endsWith(".html")) {
                        setExtensionModule({ type: "html", url: bundleUrl });
                    } else {
                        // Attempt to dynamically import the module from the URL for JS content
                        // Note: This assumes the frontend build system supports dynamic imports
                        const module = await import(/* webpackIgnore: true */ bundleUrl);
                        setExtensionModule({ type: "js", module });
                    }
                } catch (err) {
                    console.error(`Failed to load extension module: ${err}`);
                    setExtensionModule(null);
                    setError(`Failed to load extension module: ${err}`);
                }
            } else {
                setExtensionModule(null);
            }
        };

        loadExtensionModule();
    }, [selectedExtension]);

    useEffect(() => {
        const setCurrentFile = async () => {
            if (message && message.path) {
                try {
                    await invoke("set_current_file", { filename: message.path });
                    console.log(`Set current file to: ${message.path}`);
                } catch (err) {
                    console.error(`Failed to set current file: ${err}`);
                }
            }
        };

        setCurrentFile();
    }, [message]);

    if (loading) {
        return <div>Loading chat interface...</div>;
    }

    if (error) {
        return (
            <div className="text-red-500">
                {error}
                <Button onClick={() => {
                    setLoading(true);
                    setError(null);
                    // Retry loading extensions
                    const fetchEnabledExtensions = async () => {
                        try {
                            const extList: ExtensionInfo[] = await invoke("list_extensions");
                            const enabled = extList.filter(ext => ext.enabled);
                            setEnabledExtensions(enabled);
                            const fileChatExt = enabled.find(ext => ext.manifest.name === "File Chat Interface");
                            if (fileChatExt) {
                                setSelectedExtension(fileChatExt.id);
                            }
                            setLoading(false);
                        } catch (err) {
                            setError(`Failed to load extensions: ${err}`);
                            setLoading(false);
                        }
                    };
                    fetchEnabledExtensions();
                }} className="mt-2">Retry</Button>
            </div>
        );
    }

    return (
        <div>
            <FileChatInterface message={message} fgptendpoint={fgptendpoint} setasollama={setasollama}/>
            {/* <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Chat Interface Extensions</h3>
                {enabledExtensions.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                        {enabledExtensions.map(ext => (
                            <Button
                                key={ext.id}
                                variant={selectedExtension === ext.id ? "default" : "outline"}
                                onClick={() => setSelectedExtension(selectedExtension === ext.id ? null : ext.id)}
                            >
                                {ext.manifest.name}
                            </Button>
                        ))}
                    </div>
                ) : (
                    <p>No enabled extensions found. Please enable the File Chat Interface extension in Settings.</p>
                )}
            </div>

            {selectedExtension && extensionModule ? (
                <div className="mb-4 border rounded p-4">
                    Render the dynamically imported extension module or HTML content
                    {(() => {
                        try {
                            if (extensionModule.type === "html") {
                                return (
                                    <iframe
                                        src={extensionModule.url}
                                        title="Extension Content"
                                        className="w-full h-96 border-0"
                                    />
                                );
                            } else {
                                const ExtensionComponent = extensionModule.module.default;
                                return <ExtensionComponent message={message} fgptendpoint={fgptendpoint} setasollama={setasollama} />;
                            }
                        } catch (err) {
                            return <div>Error rendering extension: {err.toString()}</div>;
                        }
                    })()}
                </div>
            ) : (
                <p>Select an extension to load the chat interface.</p>
            )} */}
        </div>
    );
}
