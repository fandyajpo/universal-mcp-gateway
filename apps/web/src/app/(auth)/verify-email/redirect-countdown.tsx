"use client";

import { useEffect, useState } from "react";

export function RedirectWithCountdown({
  to,
  seconds = 5,
}: {
  to: string;
  seconds?: number;
}): React.ReactNode {
  const [count, setCount] = useState(seconds);

  useEffect(function () {
    if (count <= 0) {
      window.location.href = to;
      return;
    }
    const id = setTimeout(function (): void {
      setCount(function (c: number): number {
        return c - 1;
      });
    }, 1000);
    return function (): void {
      clearTimeout(id);
    };
  }, [count, to]);

  return <>{count}</>;
}
