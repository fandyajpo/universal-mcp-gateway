import { createRequire } from "module";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..", "..", "..");

const bcrypt = createRequire(
  join(ROOT, "node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt/package.json"),
)("bcrypt");

export async function createUserData(userDef) {
  const passwordHash = await bcrypt.hash(userDef.password, 12);
  return {
    email: userDef.email,
    emailVerified: userDef.emailVerified ? new Date() : undefined,
    name: userDef.name,
    passwordHash,
    isActive: userDef.isActive,
    roles: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
