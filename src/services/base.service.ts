import { BaseRepository } from '@/repositories/base.repository';
import { Document } from 'mongoose';
import { PaginationQuery, PaginationResult } from '@/types';

export abstract class BaseService<T extends Document> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  public async create(data: Partial<T>): Promise<T> {
    return await this.repository.create(data);
  }

  public async findById(id: string): Promise<T | null> {
    return await this.repository.findById(id);
  }

  public async findOne(filter: any): Promise<T | null> {
    return await this.repository.findOne(filter);
  }

  public async find(filter: any = {}): Promise<T[]> {
    return await this.repository.find(filter);
  }

  public async findWithPagination(
    filter: any = {},
    pagination: PaginationQuery = {}
  ): Promise<PaginationResult<T>> {
    return await this.repository.findWithPagination(filter, pagination);
  }

  public async updateById(id: string, update: any): Promise<T | null> {
    return await this.repository.updateById(id, update);
  }

  public async updateOne(filter: any, update: any): Promise<T | null> {
    return await this.repository.updateOne(filter, update);
  }

  public async updateMany(filter: any, update: any): Promise<any> {
    return await this.repository.updateMany(filter, update);
  }

  public async deleteById(id: string): Promise<T | null> {
    return await this.repository.deleteById(id);
  }

  public async deleteOne(filter: any): Promise<any> {
    return await this.repository.deleteOne(filter);
  }

  public async deleteMany(filter: any): Promise<any> {
    return await this.repository.deleteMany(filter);
  }

  public async count(filter: any = {}): Promise<number> {
    return await this.repository.count(filter);
  }

  public async exists(filter: any): Promise<boolean> {
    return await this.repository.exists(filter);
  }
}
