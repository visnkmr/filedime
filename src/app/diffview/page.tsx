"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// Avoid any top-level window or Tauri API references during prerender/static export.
// We lazy-import Tauri APIs inside effects/callbacks on the client.
let listen: typeof import("@tauri-apps/api/event").listen | undefined;
let invoke: typeof import("@tauri-apps/api/tauri").invoke | undefined;
let appWindow: import("@tauri-apps/api/window").WebviewWindow | undefined;
let open: typeof import("@tauri-apps/api/dialog").open | undefined;

const ensureTauri = async () => {
  if (typeof window === "undefined") return;
  if (!listen || !invoke || !appWindow || !open) {
    const [{ listen: _listen }, { invoke: _invoke }, { appWindow: _appWindow }, { open: _open }] = await Promise.all([
      import("@tauri-apps/api/event"),
      import("@tauri-apps/api/tauri"),
      import("@tauri-apps/api/window"),
      import("@tauri-apps/api/dialog"),
    ]);
    listen = _listen;
    invoke = _invoke;
    appWindow = _appWindow;
    open = _open;
  }
};

import { ZoomableContent } from "../../components/ZoomableContent";

type PaneChunk = {
  top_line: number;
  highlight_line: number;
  html: string;
};

type DualChunkPayload = {
  window_label: string;
  f1: PaneChunk;
  f2: PaneChunk;
};

type DualStatePayload = {
  window_label: string;
  top1: number;
  top2: number;
  hl1: number;
  hl2: number;
};

export default function DiffViewPage() {
  const [leftHtml, setLeftHtml] = useState("<pre><code>Choose two files to begin...</code></pre>");
  const [rightHtml, setRightHtml] = useState("<pre><code>Choose two files to begin...</code></pre>");
  const [top1, setTop1] = useState(0);
  const [top2, setTop2] = useState(0);
  const [hl1, setHl1] = useState(0);
  const [hl2, setHl2] = useState(0);

  const [f1, setF1] = useState<string | null>(null);
  const [f2, setF2] = useState<string | null>(null);

  const inittedRef = useRef(false);
  const windowLabelRef = useRef<string>("");

  const requestChunk = useCallback(async () => {
    if (typeof window === "undefined") return;
    await ensureTauri();
    if (!windowLabelRef.current || !invoke) return;
    // Safe: invoke only exists on client after ensureTauri
    await invoke("dual_request", {
      args: { window_label: windowLabelRef.current },
    });
  }, []);

  const chooseFile = useCallback(async (setter: (p: string) => void) => {
    if (typeof window === "undefined") return;
    await ensureTauri();
    if (!open) return;
    const res = await open({
      multiple: false,
      directory: false,
      filters: [
        { name: "All", extensions: ["*"] },
        { name: "Text", extensions: ["txt", "log", "md", "rs", "ts", "tsx", "js", "json", "toml", "yaml", "yml", "html", "css"] },
      ],
    });
    if (typeof res === "string") {
      setter(res);
    }
  }, []);

  const tryOpenIfReady = useCallback(async () => {
    if (typeof window === "undefined") return;
    await ensureTauri();
    if (!f1 || !f2) return;
    if (!windowLabelRef.current || !invoke) return;
    await invoke("dual_open", {
      args: {
        window_label: windowLabelRef.current,
        file1: f1,
        file2: f2,
        dark_theme: true,
      },
    });
    await requestChunk();
  }, [f1, f2, requestChunk]);

  useEffect(() => {
    if (inittedRef.current) return;
    inittedRef.current = true;

    async function init() {
      // Guard against SSR/prerender contexts
      if (typeof window === "undefined") {
        return;
      }
      await ensureTauri();
      if (!appWindow) return;
      const label = appWindow.label;
      windowLabelRef.current = label;

      if (!listen) return;
      const unlistenChunk = await listen("dual_chunk", (e) => {
        const payload = e.payload as unknown as DualChunkPayload;
        if (payload.window_label !== windowLabelRef.current) return;
        setLeftHtml(payload.f1.html);
        setRightHtml(payload.f2.html);
      });

      if (!listen) return;
      const unlistenState = await listen("dual_state", (e) => {
        const payload = e.payload as unknown as DualStatePayload;
        if (payload.window_label !== windowLabelRef.current) return;
        setTop1(payload.top1);
        setTop2(payload.top2);
        setHl1(payload.hl1);
        setHl2(payload.hl2);
      });

      const unmount = async () => {
        if (invoke) {
          await invoke("dual_close", { args: { window_label: windowLabelRef.current } }).catch(() => {});
        }
        unlistenChunk();
        unlistenState();
      };
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", unmount);
      }
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("beforeunload", unmount);
        }
        unmount();
      };
    }

    init();
  }, []);

  useEffect(() => {
    // Guard against SSR/prerender contexts
    if (typeof window === "undefined") return;
    tryOpenIfReady();
  }, [tryOpenIfReady, f1, f2]);

  // Key handlers
  useEffect(() => {
    // Guard against SSR/prerender contexts
    if (typeof window === "undefined") return;
    const onKey = async (ev: KeyboardEvent) => {
      await ensureTauri();
      if (!windowLabelRef.current || !invoke) return;

      switch (ev.key) {
        case "ArrowDown":
          ev.preventDefault();
          await invoke("dual_scroll_sync", { args: { window_label: windowLabelRef.current, delta: 1 } });
          break;
        case "ArrowUp":
          ev.preventDefault();
          await invoke("dual_scroll_sync", { args: { window_label: windowLabelRef.current, delta: -1 } });
          break;
        case "w":
        case "W":
          ev.preventDefault();
          await invoke("dual_scroll_f1", { args: { window_label: windowLabelRef.current, delta: -1 } });
          break;
        case "s":
        case "S":
          ev.preventDefault();
          await invoke("dual_scroll_f1", { args: { window_label: windowLabelRef.current, delta: 1 } });
          break;
        case "u":
        case "U":
          ev.preventDefault();
          await invoke("dual_scroll_f2", { args: { window_label: windowLabelRef.current, delta: -1 } });
          break;
        case "j":
        case "J":
          ev.preventDefault();
          await invoke("dual_scroll_f2", { args: { window_label: windowLabelRef.current, delta: 1 } });
          break;
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKey);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", onKey);
      }
    };
  }, []);

  return (
    

    <main className="h-screen w-screen overflow-hidden flex flex-col">
      <header className="p-2 text-sm border-b flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border border-gray-500 hover:bg-gray-800 hover:text-white transition"
            onClick={() => chooseFile((p) => setF1(p))}
            title="Choose left file"
          >
            Choose Left
          </button>
          <span className="text-xs opacity-70 max-w-[30vw] truncate" title={f1 || ""}>
            {f1 || "No file selected"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border border-gray-500 hover:bg-gray-800 hover:text-white transition"
            onClick={() => chooseFile((p) => setF2(p))}
            title="Choose right file"
          >
            Choose Right
          </button>
          <span className="text-xs opacity-70 max-w-[30vw] truncate" title={f2 || ""}>
            {f2 || "No file selected"}
          </span>
        </div>
        <div className="opacity-60">Top L {top1} / R {top2} | HL L {hl1} / R {hl2}</div>
      </header>
      <section className="flex-1 grid grid-cols-2 gap-0 h-full overflow-hidden">
        <div className="h-full overflow-auto p-2 border-r">
          <ZoomableContent>

          <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: leftHtml }} />
          </ZoomableContent>
        </div>
        <div className="h-full overflow-auto p-2">
          <ZoomableContent>

          <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: rightHtml }} />
          </ZoomableContent>
        </div>
      </section>
      <footer className="p-2 text-xs border-t">
        Keys: ArrowUp/Down sync | w/s left | u/j right
      </footer>
    </main>
  );
}