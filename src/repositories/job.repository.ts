import { IJob } from '@/models/job.entity';
import { BaseRepository } from './base.repository';
import { JobStatus, JobType, JobCategory, SortBy } from '@/enums';
import { JobFilterQuery, PaginationResult } from '@/types';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

const transformJobDates = (job: any): any => {
  if (!job) return job;

  if (job.applicationDeadline) {
    job.applicationDeadline = new Date(job.applicationDeadline).getTime();
  }
  if (job.expiresAt) {
    job.expiresAt = new Date(job.expiresAt).getTime();
  }
  if (job.publishedAt) {
    job.publishedAt = new Date(job.publishedAt).getTime();
  }
  if (job.createdAt) {
    job.createdAt = new Date(job.createdAt).getTime();
  }
  if (job.updatedAt) {
    job.updatedAt = new Date(job.updatedAt).getTime();
  }
  return job;
};

export class JobRepository extends BaseRepository<IJob> {
  public async findByPostedBy(postedBy: string): Promise<IJob[]> {
    return await this.find({ postedBy });
  }

  public async findByStatus(status: JobStatus): Promise<IJob[]> {
    return await this.find({ status });
  }

  public async findPublished(): Promise<IJob[]> {
    return await this.find({ status: JobStatus.PUBLISHED });
  }

  public async searchJobs(
    query: JobFilterQuery
  ): Promise<PaginationResult<IJob>> {
    const {
      page = 1,
      limit = 10,
      category,
      type,
      location,
      isRemote,
      minSalary,
      maxSalary,
      keyword,
      sort = 'recent',
      postedBy,
      status,
    } = query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const filter: any = {};

    // Only filter by status if explicitly provided, OR if no postedBy (public search - show only published)
    if (status !== undefined && status !== null && status !== '') {
      filter.status = status;
      logger.debug(`Job search - status filter (explicit): ${filter.status}`);
    } else if (!postedBy) {
      // Public search - only show published jobs
      filter.status = JobStatus.PUBLISHED;
      logger.debug(
        `Job search - status filter (public, defaulting to PUBLISHED)`
      );
    } else {
      // Owner search - show all statuses by default
      logger.debug(
        `Job search - no status filter (showing all statuses for owner)`
      );
    }

    logger.debug(`Job search - Final filter: ${JSON.stringify(filter)}`);

    if (category) {
      filter.category = category;
    }

    if (type) {
      filter.type = { $in: [type] };
    }

    if (location) {
      filter.location = { $regex: new RegExp(location, 'i') };
    }

    if (isRemote !== undefined) {
      filter.isRemote = isRemote === 'true';
    }

    if (minSalary || maxSalary) {
      const salaryFilters: any[] = [];
      if (minSalary) {
        salaryFilters.push({ 'salary.max': { $gte: Number(minSalary) } });
      }
      if (maxSalary) {
        salaryFilters.push({ 'salary.min': { $lte: Number(maxSalary) } });
      }
      if (salaryFilters.length > 0) {
        if (filter.$and) {
          filter.$and.push(...salaryFilters);
        } else {
          filter.$and = salaryFilters;
        }
      }
    }

    if (postedBy) {
      filter.postedBy = new mongoose.Types.ObjectId(postedBy);
    }

    let sortObj: any = {};

    switch (sort) {
      case SortBy.RECENT:
      case SortBy.DATE:
        // Use publishedAt if available, otherwise use createdAt
        sortObj = {
          publishedAt: -1,
          createdAt: -1,
        };
        break;
      case SortBy.POPULARITY:
        sortObj = { views: -1, applicantsCount: -1, createdAt: -1 };
        break;
      case SortBy.SALARY:
        sortObj = { 'salary.max': -1, 'salary.min': -1, createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const skip = (pageNum - 1) * limitNum;

    let aggregationPipeline: any[] = [{ $match: filter }];

    if (keyword) {
      aggregationPipeline.push({
        $match: {
          $text: { $search: keyword },
        },
      });
      aggregationPipeline.push({
        $addFields: {
          score: { $meta: 'textScore' },
        },
      });
      sortObj = { score: { $meta: 'textScore' }, createdAt: -1 };
    }

    aggregationPipeline.push({ $sort: sortObj });
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limitNum });

    try {
      logger.debug(
        `Executing aggregation pipeline with filter: ${JSON.stringify(filter)}`
      );
      logger.debug(
        `Aggregation pipeline: ${JSON.stringify(aggregationPipeline, null, 2)}`
      );

      const [data, totalResult] = await Promise.all([
        this.model.aggregate(aggregationPipeline).exec(),
        this.model.countDocuments(filter).exec(),
      ]);

      logger.debug(
        `Aggregation result: ${data.length} jobs, total count: ${totalResult}`
      );

      const populatedData = await Promise.all(
        data.map(async (job) => {
          if (job.postedBy) {
            try {
              const user = await mongoose
                .model('User')
                .findById(job.postedBy)
                .select('name email')
                .lean();
              job.postedBy = user || null;
            } catch (err) {
              logger.error(`Error populating user for job ${job._id}:`, err);
              job.postedBy = null;
            }
          }
          return transformJobDates(job);
        })
      );

      const totalPages = Math.ceil(totalResult / limitNum);

      return {
        data: populatedData,
        meta: {
          page: pageNum,
          limit: limitNum,
          total: totalResult,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      };
    } catch (error) {
      logger.error('Error in searchJobs:', error);
      throw error;
    }
  }

  public async incrementViews(jobId: string): Promise<IJob | null> {
    return await this.model.findByIdAndUpdate(
      jobId,
      { $inc: { views: 1 } },
      { new: true }
    );
  }

  public async incrementApplicantsCount(jobId: string): Promise<IJob | null> {
    return await this.model.findByIdAndUpdate(
      jobId,
      { $inc: { applicantsCount: 1 } },
      { new: true }
    );
  }

  public async incrementBookmarksCount(jobId: string): Promise<IJob | null> {
    return await this.model.findByIdAndUpdate(
      jobId,
      { $inc: { bookmarksCount: 1 } },
      { new: true }
    );
  }

  public async decrementBookmarksCount(jobId: string): Promise<IJob | null> {
    return await this.model.findByIdAndUpdate(
      jobId,
      { $inc: { bookmarksCount: -1 } },
      { new: true }
    );
  }

  public async updateStatus(
    jobId: string,
    status: JobStatus
  ): Promise<IJob | null> {
    const updateData: any = { status };
    if (status === JobStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }
    return await this.model.findByIdAndUpdate(jobId, updateData, { new: true });
  }

  public async findExpiredJobs(): Promise<IJob[]> {
    return await this.model.find({
      status: JobStatus.PUBLISHED,
      expiresAt: { $lte: new Date() },
    });
  }

  public async expireJobs(): Promise<number> {
    const result = await this.model.updateMany(
      {
        status: JobStatus.PUBLISHED,
        expiresAt: { $lte: new Date() },
      },
      { status: JobStatus.EXPIRED }
    );
    return result.modifiedCount || 0;
  }

  public async getPopularTags(limit: number = 10): Promise<string[]> {
    const result = await this.model.aggregate([
      { $match: { status: JobStatus.PUBLISHED } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]);

    return result.map((item) => item.tag);
  }

  public async getJobsByCategory(): Promise<any[]> {
    return await this.model.aggregate([
      { $match: { status: JobStatus.PUBLISHED } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }

  public async getJobsStatistics(): Promise<any> {
    const stats = await this.model.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          publishedJobs: {
            $sum: { $cond: [{ $eq: ['$status', JobStatus.PUBLISHED] }, 1, 0] },
          },
          draftJobs: {
            $sum: { $cond: [{ $eq: ['$status', JobStatus.DRAFT] }, 1, 0] },
          },
          expiredJobs: {
            $sum: { $cond: [{ $eq: ['$status', JobStatus.EXPIRED] }, 1, 0] },
          },
          totalViews: { $sum: '$views' },
          totalApplicants: { $sum: '$applicantsCount' },
          avgSalary: {
            $avg: { $divide: [{ $add: ['$salary.min', '$salary.max'] }, 2] },
          },
        },
      },
    ]);

    return stats[0] || {};
  }
}
