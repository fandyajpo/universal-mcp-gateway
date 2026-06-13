"use client";

import { useEffect, useRef, useState } from "react";

import { checkSlugAction } from "@/actions/workspace/create";

import { slugify } from "@repo/utils";

export function useCreateWorkspace(): {
  slug: string;
  setSlug: (slug: string) => void;
  slugAvailable: boolean | null;
  isCheckingSlug: boolean;
  onNameChange: (name: string) => void;
} {
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUserEditedSlug = useRef(false);

  useEffect(function () {
    return function (): void {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(function () {
    if (slug.length < 2) {
      setSlugAvailable(null);
      setIsCheckingSlug(false);
      return;
    }

    setIsCheckingSlug(true);

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(function (): void {
      checkSlugAction(slug)
        .then(function (result: { available: boolean }): void {
          setSlugAvailable(result.available);
        })
        .catch(function (): void {
          setSlugAvailable(null);
        })
        .finally(function (): void {
          setIsCheckingSlug(false);
        });
    }, 400);

    return function (): void {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [slug]);

  function onNameChange(name: string): void {
    if (hasUserEditedSlug.current) return;
    const generated = slugify(name).substring(0, 63);
    setSlug(generated);
  }

  function handleSetSlug(value: string): void {
    hasUserEditedSlug.current = true;
    setSlug(value);
  }

  return {
    slug,
    setSlug: handleSetSlug,
    slugAvailable,
    isCheckingSlug,
    onNameChange,
  };
}
