export interface TierLimits {
  maxFileSize: number;
  totalStorage: number;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxFileSize: 10 * 1024 * 1024,
    totalStorage: 1 * 1024 * 1024 * 1024,
  },
  pro: {
    maxFileSize: 50 * 1024 * 1024,
    totalStorage: 50 * 1024 * 1024 * 1024,
  },
  enterprise: {
    maxFileSize: 500 * 1024 * 1024,
    totalStorage: 1 * 1024 * 1024 * 1024 * 1024,
  },
};

const DEFAULT_TIER = "free";
const FREE_LIMITS: TierLimits = { maxFileSize: 10 * 1024 * 1024, totalStorage: 1 * 1024 * 1024 * 1024 };

export function getTierLimits(tier?: string): TierLimits {
  const key = (tier ?? DEFAULT_TIER).toLowerCase();
  return TIER_LIMITS[key] ?? FREE_LIMITS;
}

export function validateFileSize(fileSize: number, tier?: string, customMaxFileSize?: number): { valid: boolean; maxSize: number } {
  if (fileSize <= 0) {
    return { valid: false, maxSize: 0 };
  }

  const maxSize = customMaxFileSize ?? getTierLimits(tier).maxFileSize;

  return {
    valid: fileSize <= maxSize,
    maxSize,
  };
}

export function validateTotalStorage(
  currentUsage: number,
  fileSize: number,
  tier?: string,
  customTotalStorage?: number,
): { valid: boolean; maxTotal: number } {
  if (fileSize <= 0) {
    return { valid: false, maxTotal: 0 };
  }

  const maxTotal = customTotalStorage ?? getTierLimits(tier).totalStorage;

  return {
    valid: currentUsage + fileSize <= maxTotal,
    maxTotal,
  };
}
