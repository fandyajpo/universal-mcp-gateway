import { ApiKeyModel, IApiKey } from "../models/api-key";
import { TenantAwareRepository } from "./tenant-aware";

const SENSITIVE_FIELDS = "-keyHash";

export class ApiKeyRepository extends TenantAwareRepository<IApiKey> {
  constructor(tenantId: string) {
    super(ApiKeyModel, tenantId, SENSITIVE_FIELDS);
  }

  async findByKeyHash(hash: string): Promise<IApiKey | null> {
    return super.findOne({ keyHash: hash });
  }

  async findByWorkspace(): Promise<IApiKey[]> {
    return this.findMany({});
  }

  async rotateKey(keyId: string, newHash: string): Promise<IApiKey | null> {
    return this.updateById(keyId, { keyHash: newHash });
  }

  async revokeKey(keyId: string): Promise<IApiKey | null> {
    return this.updateById(keyId, { isActive: false });
  }

  async recordUsage(keyId: string): Promise<void> {
    await ApiKeyModel.findByIdAndUpdate(keyId, { lastUsedAt: new Date() });
  }
}
