import { Model, FilterQuery } from "mongoose";

export interface PaginationOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1 | { $meta: string }>;
  select?: string;
}

export class BaseRepository<T> {
  protected model: Model<T>;
  protected defaultExcludes?: string;

  constructor(model: Model<T>, defaultExcludes?: string) {
    this.model = model;
    this.defaultExcludes = defaultExcludes;
  }

  async findById(id: string, filter?: FilterQuery<T>): Promise<T | null> {
    const combined: FilterQuery<T> = { ...filter, _id: id };
    let query = this.model.findOne(combined);
    if (this.defaultExcludes) query = query.select(this.defaultExcludes) as typeof query;
    const doc = await query.lean();
    return doc as T | null;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (this.defaultExcludes) query = query.select(this.defaultExcludes) as typeof query;
    const doc = await query.lean();
    return doc as T | null;
  }

  async findMany(
    filter: FilterQuery<T> = {},
    options?: PaginationOptions,
  ): Promise<T[]> {
    let query = this.model.find(filter);

    if (options?.skip !== undefined) {
      query = query.skip(options.skip);
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    if (options?.sort) {
      query = query.sort(options.sort);
    }
    if (options?.select) {
      query = query.select(options.select);
    } else if (this.defaultExcludes) {
      query = query.select(this.defaultExcludes) as typeof query;
    }

    const docs = await query.lean();
    return docs as T[];
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject();
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const docs = await this.model.insertMany(data as T[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (docs as any[]).map((d) => d.toObject() as T);
  }

  async updateById(id: string, data: Partial<T>, filter?: FilterQuery<T>): Promise<T | null> {
    const combined: FilterQuery<T> = { ...filter, _id: id };
    const doc = await this.model
      .findOneAndUpdate(combined, { $set: data }, { new: true })
      .lean();
    return doc as T | null;
  }

  async updateMany(filter: FilterQuery<T>, data: Partial<T>): Promise<number> {
    const result = await this.model.updateMany(filter, { $set: data });
    return result.modifiedCount;
  }

  async deleteById(id: string, filter?: FilterQuery<T>): Promise<T | null> {
    const combined: FilterQuery<T> = { ...filter, _id: id };
    const doc = await this.model
      .findOneAndUpdate(combined, { $set: { deletedAt: new Date() } }, { new: true })
      .lean();
    return doc as T | null;
  }

  async hardDeleteById(id: string, filter?: FilterQuery<T>): Promise<T | null> {
    const combined: FilterQuery<T> = { ...filter, _id: id };
    const doc = await this.model.findOneAndDelete(combined).lean();
    return doc as T | null;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.findOne(filter).select("_id").lean();
    return doc !== null;
  }
}
