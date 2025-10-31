import {
  Document,
  Model,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
} from 'mongoose';
import { PaginationQuery, PaginationResult } from '@/types';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  public async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  public async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  public async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  public async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return await this.model.find(filter).exec();
  }

  public async findWithPagination(
    filter: FilterQuery<T> = {},
    pagination: PaginationQuery = {}
  ): Promise<PaginationResult<T>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
    } = pagination;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async updateById(
    id: string,
    update: UpdateQuery<T>
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<T | null> {
    return await this.model
      .findOneAndUpdate(filter, update, { new: true })
      .exec();
  }

  public async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<any> {
    return await this.model.updateMany(filter, update).exec();
  }

  public async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  public async deleteOne(filter: FilterQuery<T>): Promise<any> {
    return await this.model.deleteOne(filter).exec();
  }

  public async deleteMany(filter: FilterQuery<T>): Promise<any> {
    return await this.model.deleteMany(filter).exec();
  }

  public async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  public async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  public async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    return await this.model
      .findByIdAndUpdate(id, update, { new: true, ...options })
      .exec();
  }

  public async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    return await this.model
      .findOneAndUpdate(filter, update, { new: true, ...options })
      .exec();
  }

  public async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline).exec();
  }
}
