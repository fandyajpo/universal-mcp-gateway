import { Model, FilterQuery } from "mongoose";

import { BaseRepository, PaginationOptions } from "./base";

export class TenantAwareRepository<T> extends BaseRepository<T> {
  protected tenantId: string;

  constructor(model: Model<T>, tenantId: string, defaultExcludes?: string) {
    super(model, defaultExcludes);
    this.tenantId = tenantId;
  }

  protected scopeFilter(filter: FilterQuery<T> = {}): FilterQuery<T> {
    return { ...filter, tenantId: this.tenantId };
  }

  async findById(id: string): Promise<T | null> {
    return super.findById(id, { tenantId: this.tenantId });
  }

  async findOne(filter: FilterQuery<T> = {}): Promise<T | null> {
    return super.findOne(this.scopeFilter(filter));
  }

  async findMany(filter: FilterQuery<T> = {}, options?: PaginationOptions): Promise<T[]> {
    return super.findMany(this.scopeFilter(filter), options);
  }

  async create(data: Partial<T>): Promise<T> {
    return super.create({ ...data, tenantId: this.tenantId });
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const scoped = data.map((d) => ({ ...d, tenantId: this.tenantId } as Partial<T>));
    return super.createMany(scoped);
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return super.updateById(id, data, { tenantId: this.tenantId });
  }

  async deleteById(id: string): Promise<T | null> {
    return super.deleteById(id, { tenantId: this.tenantId });
  }

  async hardDeleteById(id: string): Promise<T | null> {
    return super.hardDeleteById(id, { tenantId: this.tenantId });
  }

  withoutTenantScope(): Omit<BaseRepository<T>, "withoutTenantScope" | "model"> {
    return {
      findById: (id: string) => super.findById(id),
      findOne: (filter: FilterQuery<T>) => super.findOne(filter),
      findMany: (filter?: FilterQuery<T>, options?: PaginationOptions) =>
        super.findMany(filter, options),
      create: (data: Partial<T>) => super.create(data),
      createMany: (data: Partial<T>[]) => super.createMany(data),
      updateById: (id: string, data: Partial<T>) => super.updateById(id, data),
      updateMany: (filter: FilterQuery<T>, data: Partial<T>) =>
        super.updateMany(filter, data),
      deleteById: (id: string) => super.deleteById(id),
      hardDeleteById: (id: string) => super.hardDeleteById(id),
      count: (filter?: FilterQuery<T>) => super.count(filter),
      exists: (filter: FilterQuery<T>) => super.exists(filter),
    };
  }
}
