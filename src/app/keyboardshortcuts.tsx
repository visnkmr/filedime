"use client";
import { useCallback, useEffect } from "react";

type ShortcutFunction = (event: KeyboardEvent) => void;

type Config = {
  code?: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  targetElement?: HTMLElement;
  mousebutton?:number
};
function isTextSelected() {
    const selection = window.getSelection();
    return selection && selection.toString().trim() !== '';
}

function useKeyboardShortcut(
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
        if (document.activeElement.tagName === 'INPUT') return;
        if (isTextSelected()) return;
      const keyboardEvent = event as KeyboardEvent;
      const { code, ctrlKey, altKey, shiftKey } = keyboardEvent;
      // console.log(keyboardEvent)

      if (config.code !== code) return;
      if (config.ctrlKey && !ctrlKey) return;
      if (config.shiftKey && !shiftKey) return;
      if (config.altKey && !altKey) return;

      shortcutFunction(keyboardEvent);
    },
    [shortcutFunction, config]
  );

  useEffect(() => {
    targetElement?.addEventListener("keydown", handleKeyDown);

    return () => {
      targetElement?.removeEventListener("keydown", handleKeyDown);
    };
  }, [targetElement, handleKeyDown]);
}

export { useKeyboardShortcut };