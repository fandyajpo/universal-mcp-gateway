export function slugify(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export function truncate(text: string, maxLength: number, suffix = "..."): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace === -1) return truncated.slice(0, maxLength - suffix.length) + suffix;
  return truncated.slice(0, lastSpace) + suffix;
}

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function titleCase(text: string): string {
  const smallWords = new Set([
    "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "with", "in", "of", "as",
  ]);

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return capitalize(word);
    })
    .join(" ");
}

export function camelToKebab(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (_, char) => (char as string).toUpperCase());
}

export function generateId(length = 21): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b % 64)
    .map((v) => {
      if (v < 26) return String.fromCharCode(97 + v); // a-z
      if (v < 52) return String.fromCharCode(65 + v - 26); // A-Z
      if (v < 62) return String.fromCharCode(48 + v - 52); // 0-9
      if (v === 62) return "-";
      return "_";
    })
    .join("");
}

export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return email;

  const name = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (name.length <= 2) {
    return name.charAt(0) + "***" + domain;
  }

  return name.charAt(0) + "***" + domain;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  if (plural) return plural;

  if (singular.endsWith("s") || singular.endsWith("x") || singular.endsWith("z")) {
    return singular + "es";
  }
  if (singular.endsWith("y") && !["a", "e", "i", "o", "u"].includes(singular.charAt(singular.length - 2))) {
    return singular.slice(0, -1) + "ies";
  }
  return singular + "s";
}
