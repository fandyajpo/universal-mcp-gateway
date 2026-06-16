import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform, softDeletePlugin } from "../schema";

export interface IUser {
  email: string;
  emailVerified?: Date;
  name: string;
  image?: string;
  passwordHash?: string;
  roles?: Record<string, string>;
  isActive: boolean;
  lastLoginAt?: Date;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  recoveryCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  emailVerified: { type: Date },
  name: { type: String, required: true, trim: true },
  image: { type: String },
  passwordHash: { type: String },
  roles: { type: Map, of: String, default: {} },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String },
  recoveryCodes: { type: [String] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

userSchema.index({ name: "text" }, { name: "idx_users_name_text" });
userSchema.index({ isActive: 1, lastLoginAt: 1 }, { name: "idx_users_isActive_lastLoginAt" });
userSchema.index({ emailVerified: 1, isActive: 1 }, { name: "idx_users_emailVerified_isActive" });

timestampsPlugin(userSchema);
softDeletePlugin(userSchema);
toJSONTransform(userSchema);

export const UserModel: Model<IUser> = model<IUser>("User", userSchema);
