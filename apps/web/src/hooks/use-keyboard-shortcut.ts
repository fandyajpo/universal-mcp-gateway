"use client";

import { useEffect } from "react";

interface KeyCombo {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
}

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (
        event.key.toLowerCase() === combo.key.toLowerCase() &&
        event.metaKey === (combo.meta ?? false) &&
        event.ctrlKey === (combo.ctrl ?? false) &&
        event.shiftKey === (combo.shift ?? false)
      ) {
        event.preventDefault();
        callback();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return (): void => { document.removeEventListener("keydown", handleKeyDown); };
  }, [combo.key, combo.meta, combo.ctrl, combo.shift, callback, enabled]);
}
