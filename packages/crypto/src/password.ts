import bcrypt from "bcrypt";

const DEFAULT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, DEFAULT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function needsRehash(hash: string, cost: number = DEFAULT_COST): boolean {
  const parts = hash.split("$");
  const costStr: string | undefined = parts[2];
  const currentCost = costStr !== undefined ? parseInt(costStr, 10) : 0;
  return isNaN(currentCost) || currentCost < cost;
}
