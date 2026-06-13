"use client";

import { useCallback, useEffect, useState } from "react";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TocItem extends TocHeading {
  isActive: boolean;
}

export function extractHeadingsFromContent(
  containerSelector: string,
): TocHeading[] {
  if (typeof document === "undefined") return [];

  const container = document.querySelector(containerSelector);
  if (!container) return [];

  const headings = container.querySelectorAll("h1, h2, h3, h4");
  const items: TocHeading[] = [];

  headings.forEach((heading) => {
    const textContent = heading.textContent || "";
    const id = heading.id || textContent.toLowerCase().replace(/\s+/g, "-");
    const tagName = heading.tagName[1] ?? "2";
    const level = parseInt(tagName, 10);

    if (textContent.trim()) {
      if (!heading.id) {
        heading.id = id;
      }
      items.push({ id, text: textContent, level });
    }
  });

  return items;
}

export function useTableOfContents(
  containerSelector: string,
): TocItem[] {
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const extracted = extractHeadingsFromContent(containerSelector);
    setHeadings(extracted);

    if (extracted.length > 0) {
      const first = extracted[0];
      if (first) {
        setActiveId(first.id);
      }
    }
  }, [containerSelector]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }

    return (): void => {
      observer.disconnect();
    };
  }, [headings]);

  const isActive = useCallback(
    (id: string): boolean => id === activeId,
    [activeId],
  );

  return headings.map((heading) => ({
    ...heading,
    isActive: isActive(heading.id),
  }));
}
