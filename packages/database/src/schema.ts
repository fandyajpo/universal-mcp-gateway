import { Schema } from "mongoose";

export const baseSchemaFields: Record<string, unknown> = {
  tenantId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
};

export function timestampsPlugin(schema: Schema): void {
  schema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });
}

export function softDeletePlugin(schema: Schema): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema.pre("find", function (this: any, next) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const filter = this.getFilter() as Record<string, unknown>;
    if (filter.deletedAt === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.where({ deletedAt: null });
    }
    next();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema.pre("findOne", function (this: any, next) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const filter = this.getFilter() as Record<string, unknown>;
    if (filter.deletedAt === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.where({ deletedAt: null });
    }
    next();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema.pre("countDocuments", function (this: any, next) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const filter = this.getFilter() as Record<string, unknown>;
    if (filter.deletedAt === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.where({ deletedAt: null });
    }
    next();
  });
}

export function toJSONTransform(schema: Schema): void {
  schema.set("toJSON", {
    transform: (_doc: Record<string, unknown>, ret: Record<string, unknown>): void => {
      const id = ret._id;
      if (id) {
        ret.id = (id as { toString: () => string }).toString();
      }
      delete ret._id;
      delete ret.__v;
    },
  });
}
