import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ExtensionManifest {
  name: string;
  version: string;
  author: string;
  description: string;
  entry_point: string;
  permissions: string[];
}

interface ExtensionInfo {
  id: string;
  manifest: ExtensionManifest;
  enabled: boolean;
}

const ExtensionManager: React.FC = () => {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [installPath, setInstallPath] = useState<string>("");

  useEffect(() => {
    fetchExtensions();
  }, []);

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const extList: ExtensionInfo[] = await invoke("list_extensions");
      setExtensions(extList);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load extensions: ${err}`);
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!installPath) {
      setError("Please provide a path to the extension");
      return;
    }
    try {
      const result: string = await invoke("install_extension", { sourcePath: installPath });
      setInstallPath("");
      setError(null);
      alert(result);
      fetchExtensions();
    } catch (err) {
      setError(`Failed to install extension: ${err}`);
    }
  };

  const handleUninstall = async (id: string) => {
    try {
      const result: string = await invoke("uninstall_extension", { extensionId: id });
      alert(result);
      fetchExtensions();
    } catch (err) {
      setError(`Failed to uninstall extension: ${err}`);
    }
  };

  const handleToggle = async (id: string, enable: boolean) => {
    try {
      const result: string = await invoke("toggle_extension", { extensionId: id, enable });
      alert(result);
      fetchExtensions();
    } catch (err) {
      setError(`Failed to toggle extension: ${err}`);
    }
  };

  if (loading) {
    return <div>Loading extensions...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        {error}
        <Button onClick={fetchExtensions} className="mt-2">Retry</Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Extension Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Install New Extension</h3>
          <div className="flex gap-2">
            <Input
              value={installPath}
              onChange={(e) => setInstallPath(e.target.value)}
              placeholder="Enter path to extension folder"
              className="flex-1"
            />
            <Button onClick={handleInstall}>Install</Button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Installed Extensions</h3>
          {extensions.length === 0 ? (
            <p>No extensions installed.</p>
          ) : (
            <div className="space-y-4">
              {extensions.map((ext) => (
                <div key={ext.id} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{ext.manifest.name} (v{ext.manifest.version})</h4>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={ext.enabled}
                        onClick={() => handleToggle(ext.id, !ext.enabled)}
                      />
                      <span>{ext.enabled ? "Enabled" : "Disabled"}</span>
                      <Button
                        variant="destructive"
                        onClick={() => handleUninstall(ext.id)}
                      >
                        Uninstall
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Author: {ext.manifest.author}</p>
                  <p className="text-sm">{ext.manifest.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtensionManager;
