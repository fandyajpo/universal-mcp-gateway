"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseDocumentListKeyboardOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  onActivate: (index: number) => void;
  enabled?: boolean;
}

export function useDocumentListKeyboard({
  itemCount,
  onSelect,
  onActivate,
  enabled = true,
}: UseDocumentListKeyboardOptions): {
  focusedIndex: React.RefObject<number | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
} {
  const focusedIndex = useRef(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rows = container.querySelectorAll<HTMLElement>("[role='row'][data-index]");
    const row = rows[index];
    if (row) {
      row.scrollIntoView({ block: "nearest" });
      row.focus({ preventScroll: true });
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;

      let newIndex = focusedIndex.current;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.min(focusedIndex.current + 1, itemCount - 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.max(focusedIndex.current - 1, 0);
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
        case "PageUp":
          e.preventDefault();
          newIndex = Math.max(focusedIndex.current - 10, 0);
          break;
        case "PageDown":
          e.preventDefault();
          newIndex = Math.min(focusedIndex.current + 10, itemCount - 1);
          break;
        case "Enter":
        case " ":
          if (focusedIndex.current >= 0) {
            e.preventDefault();
            onActivate(focusedIndex.current);
          }
          return;
        case "Escape":
          e.preventDefault();
          focusedIndex.current = -1;
          containerRef.current?.focus();
          return;
        default:
          return;
      }

      if (newIndex !== focusedIndex.current) {
        focusedIndex.current = newIndex;
        onSelect(newIndex);
        scrollToIndex(newIndex);
      }
    },
    [itemCount, onSelect, onActivate, enabled, scrollToIndex],
  );

  useEffect(() => {
    focusedIndex.current = -1;
  }, [itemCount]);

  return { focusedIndex, containerRef, handleKeyDown };
}
