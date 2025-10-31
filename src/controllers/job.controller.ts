import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { JobService } from '@/services/job.service';
import { JobRepository } from '@/repositories/job.repository';
import { Job } from '@/models/job.entity';
import { asyncHandler } from '@/middleware/error.middleware';
import { logger } from '@/utils/logger';

const jobRepository = new JobRepository(Job);
const jobService = new JobService(jobRepository);

export class JobController extends BaseController {
  public createJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.createJob((req as any).user._id, req.body);

    return this.handleSuccess(res, 'Job created successfully', { job }, 201);
  });

  public updateJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.updateJob(
      req.params.id,
      (req as any).user._id,
      req.body
    );

    if (!job) {
      return this.handleNotFound(res, 'Job not found');
    }

    return this.handleSuccess(res, 'Job updated successfully', { job });
  });

  public getJobById = asyncHandler(async (req: Request, res: Response) => {
    const incrementViews = req.query.incrementViews === 'true';
    const job = await jobService.getJobById(req.params.id, incrementViews);

    if (!job) {
      return this.handleNotFound(res, 'Job not found');
    }

    return this.handleSuccess(res, 'Job retrieved successfully', { job });
  });

  public searchJobs = asyncHandler(async (req: Request, res: Response) => {
    logger.debug('Search jobs request query:', req.query);

    const result = await jobService.searchJobs(req.query as any);

    logger.debug(
      `Search jobs result: ${result.data.length} jobs found, total: ${result.meta.total}`
    );

    return this.handleSuccess(
      res,
      'Jobs retrieved successfully',
      result.data,
      200,
      result.meta
    );
  });

  public getMyJobs = asyncHandler(async (req: Request, res: Response) => {
    const result = await jobService.getJobsByHr(
      (req as any).user._id,
      req.query as any
    );

    return this.handleSuccess(
      res,
      'Your jobs retrieved successfully',
      result.data,
      200,
      result.meta
    );
  });

  public publishJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.publishJob(
      req.params.id,
      (req as any).user._id
    );

    if (!job) {
      return this.handleNotFound(res, 'Job not found');
    }

    return this.handleSuccess(res, 'Job published successfully', { job });
  });

  public unpublishJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.unpublishJob(
      req.params.id,
      (req as any).user._id
    );

    if (!job) {
      return this.handleNotFound(res, 'Job not found');
    }

    return this.handleSuccess(res, 'Job unpublished successfully', { job });
  });

  public closeJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.closeJob(req.params.id, (req as any).user._id);

    if (!job) {
      return this.handleNotFound(res, 'Job not found');
    }

    return this.handleSuccess(res, 'Job closed successfully', { job });
  });

  public deleteJob = asyncHandler(async (req: Request, res: Response) => {
    const success = await jobService.deleteJob(
      req.params.id,
      (req as any).user._id
    );

    if (!success) {
      return this.handleNotFound(res, 'Job not found');
    }

    return this.handleSuccess(res, 'Job deleted successfully');
  });

  public getPopularTags = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const tags = await jobService.getPopularTags(limit);

    return this.handleSuccess(res, 'Popular tags retrieved successfully', {
      tags,
    });
  });

  public getJobsByCategory = asyncHandler(
    async (req: Request, res: Response) => {
      const categories = await jobService.getJobsByCategory();

      return this.handleSuccess(
        res,
        'Jobs by category retrieved successfully',
        { categories }
      );
    }
  );

  public getJobsStatistics = asyncHandler(
    async (req: Request, res: Response) => {
      const stats = await jobService.getJobsStatistics();

      return this.handleSuccess(res, 'Job statistics retrieved successfully', {
        stats,
      });
    }
  );
}
