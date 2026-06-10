import { UserModel, IUser } from "../models/user";
import { BaseRepository } from "./base";

const SENSITIVE_FIELDS = "-passwordHash -mfaSecret -recoveryCodes";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel, SENSITIVE_FIELDS);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  async findActive(): Promise<IUser[]> {
    return this.findMany({ isActive: true });
  }

  async searchByName(query: string): Promise<IUser[]> {
    return this.findMany({ $text: { $search: query } });
  }

  async setMfaSecret(userId: string, secret: string): Promise<IUser | null> {
    return this.updateById(userId, { mfaSecret: secret, mfaEnabled: true });
  }

  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select("recoveryCodes").lean();
    if (!user?.recoveryCodes) return false;

    const codes = user.recoveryCodes;
    const index = codes.indexOf(code);
    if (index === -1) return false;

    codes.splice(index, 1);
    await UserModel.findByIdAndUpdate(userId, { recoveryCodes: codes });
    return true;
  }
}
