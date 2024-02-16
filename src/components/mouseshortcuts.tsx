"use client";
import { useCallback, useEffect } from "react";

type ShortcutFunction = (event: MouseEvent) => void;

type Config = {
  targetElement?: HTMLElement;
  button?:number
};

function useMouseShortcut(
  shortcutFunction: ShortcutFunction,
  config: Config
) {
  // NextJS: Check if running server-side or in browser
  const isBrowserRunning = typeof window !== "undefined";
  const targetElement = isBrowserRunning
    ? config?.targetElement || document
    : null;

  const handleKeyDown = useCallback(
    (event: Event) => {
        // if (document.activeElement.tagName === 'INPUT') return;
        // if (isTextSelected()) return;
      const keyboardEvent = event as MouseEvent;
      const { button } = keyboardEvent;
      // console.log(keyboardEvent)
      if (config.button !== undefined && config.button !== button) return;
      shortcutFunction(keyboardEvent);
    },
    [shortcutFunction, config]
  );

  useEffect(() => {
    targetElement?.addEventListener("mouseup", handleKeyDown);

    return () => {
      targetElement?.removeEventListener("mouseup", handleKeyDown);
    };
  }, [targetElement, handleKeyDown]);
}

export { useMouseShortcut };