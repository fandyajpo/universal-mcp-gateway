import { SessionModel, ISession } from "../models/session";
import { TenantAwareRepository } from "./tenant-aware";

export class SessionRepository extends TenantAwareRepository<ISession> {
  constructor(tenantId: string) {
    super(SessionModel, tenantId);
  }

  async findByToken(token: string): Promise<ISession | null> {
    return this.findOne({ token });
  }

  async findActiveByUser(userId: string): Promise<ISession[]> {
    return this.findMany({ userId, isValid: true });
  }

  async invalidateSession(token: string): Promise<ISession | null> {
    const session = await this.findByToken(token);
    if (!session) return null;
    const id = String((session as unknown as { _id: unknown })._id);
    return this.updateById(id, { isValid: false });
  }

  async invalidateAllUserSessions(userId: string): Promise<number> {
    return this.updateMany(
      { userId, isValid: true },
      { isValid: false },
    );
  }

  async cleanupExpired(): Promise<number> {
    const result = await SessionModel.deleteMany({
      expiresAt: { $lte: new Date() },
    });
    return result.deletedCount;
  }
}
