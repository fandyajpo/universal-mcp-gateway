export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaults: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  };

  return new Intl.DateTimeFormat("en-US", options ?? defaults).format(date);
}

export function formatRelative(date: Date, base: Date = new Date()): string {
  const diffMs = date.getTime() - base.getTime();
  const absDiff = Math.abs(diffMs);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const prefix = diffMs < 0 ? "ago" : "from now";

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ${prefix}`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ${prefix}`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ${prefix}`;
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ${prefix}`;
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ${prefix}`;
  return `${years} year${years !== 1 ? "s" : ""} ${prefix}`;
}

export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function diffInDays(a: Date, b: Date): number {
  const diffMs = a.getTime() - b.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function now(): Date {
  return new Date();
}
