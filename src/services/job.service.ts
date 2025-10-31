import { JobRepository } from '@/repositories/job.repository';
import { BaseService } from './base.service';
import { IJob } from '@/models/job.entity';
import { JobCreateInput, JobUpdateInput, JobFilterQuery } from '@/types';
import { JobStatus } from '@/enums';
import { logger } from '@/utils/logger';

export class JobService extends BaseService<IJob> {
  private jobRepository: JobRepository;

  constructor(jobRepository: JobRepository) {
    super(jobRepository);
    this.jobRepository = jobRepository;
  }

  public async createJob(
    userId: string,
    jobData: JobCreateInput
  ): Promise<IJob> {
    const jobPayload: any = {
      ...jobData,
      postedBy: userId,
      status: JobStatus.DRAFT,
    };

    // Validate and convert dates
    if (
      jobData.applicationDeadline !== undefined &&
      jobData.applicationDeadline !== null
    ) {
      const deadline = new Date(jobData.applicationDeadline);
      if (deadline < new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      jobPayload.applicationDeadline = deadline;
    }

    if (jobData.expiresAt !== undefined && jobData.expiresAt !== null) {
      const expiresAt = new Date(jobData.expiresAt);
      if (expiresAt < new Date()) {
        throw new Error('Expires at must be in the future');
      }
      // Validate expiresAt is after applicationDeadline if both are provided
      if (
        jobPayload.applicationDeadline &&
        expiresAt < jobPayload.applicationDeadline
      ) {
        throw new Error(
          'Expires at must be after or equal to application deadline'
        );
      }
      jobPayload.expiresAt = expiresAt;
    }

    const job = await this.repository.create(jobPayload);
    logger.info(`Job created: ${job._id} by user ${userId}`);

    return job;
  }

  public async updateJob(
    jobId: string,
    userId: string,
    updateData: JobUpdateInput
  ): Promise<IJob | null> {
    const job = await this.repository.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.postedBy.toString() !== userId) {
      throw new Error('Unauthorized to update this job');
    }

    // Prevent invalid status transitions
    if (updateData.status) {
      if (
        job.status === JobStatus.EXPIRED &&
        updateData.status !== JobStatus.EXPIRED
      ) {
        throw new Error('Cannot change status of an expired job');
      }
      if (
        job.status === JobStatus.CLOSED &&
        updateData.status !== JobStatus.CLOSED
      ) {
        throw new Error(
          'Cannot change status of a closed job. Reopen it first.'
        );
      }
      if (
        job.status === JobStatus.PUBLISHED &&
        updateData.status === JobStatus.DRAFT
      ) {
        throw new Error(
          'Cannot change published job to draft. Unpublish it instead.'
        );
      }
      if (
        updateData.status === JobStatus.CLOSED ||
        updateData.status === JobStatus.EXPIRED
      ) {
        throw new Error(
          `Cannot set status to ${updateData.status} via update. Use the specific close/expire methods.`
        );
      }
    }

    const updatePayload: any = { ...updateData };

    // Remove fields that shouldn't be updated directly
    delete updatePayload.publishedAt; // publishedAt is managed by publishJob

    // Validate and convert dates
    if (
      updateData.applicationDeadline !== undefined &&
      updateData.applicationDeadline !== null
    ) {
      const deadline = new Date(updateData.applicationDeadline);
      if (deadline < new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      updatePayload.applicationDeadline = deadline;
    }

    if (updateData.expiresAt !== undefined && updateData.expiresAt !== null) {
      const expiresAt = new Date(updateData.expiresAt);
      if (expiresAt < new Date()) {
        throw new Error('Expires at must be in the future');
      }
      // If job is published, ensure expiresAt is after publishedAt
      if (
        job.status === JobStatus.PUBLISHED &&
        job.publishedAt &&
        expiresAt < job.publishedAt
      ) {
        throw new Error('Expires at must be after the publish date');
      }
      // If applicationDeadline is set, expiresAt should be >= applicationDeadline
      const appDeadline =
        updatePayload.applicationDeadline || job.applicationDeadline;
      if (appDeadline && expiresAt < appDeadline) {
        throw new Error(
          'Expires at must be after or equal to application deadline'
        );
      }
      updatePayload.expiresAt = expiresAt;
    }

    const updatedJob = await this.repository.updateById(jobId, updatePayload);
    return updatedJob;
  }

  public async publishJob(jobId: string, userId: string): Promise<IJob | null> {
    const job = await this.repository.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.postedBy.toString() !== userId) {
      throw new Error('Unauthorized to publish this job');
    }

    // Validate job can be published
    if (job.status === JobStatus.PUBLISHED) {
      throw new Error('Job is already published');
    }

    if (job.status === JobStatus.EXPIRED) {
      throw new Error('Cannot publish an expired job');
    }

    if (job.status === JobStatus.CLOSED) {
      throw new Error('Cannot publish a closed job');
    }

    // Validate required fields for publishing
    if (
      !job.title ||
      !job.description ||
      !job.category ||
      !job.location ||
      !job.companyName
    ) {
      throw new Error(
        'Job must have all required fields (title, description, category, location, companyName) before publishing'
      );
    }

    // Prepare update data
    const updateData: any = {
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
    };

    // Set expiresAt if not provided - use applicationDeadline or set default (30 days from now)
    if (!job.expiresAt) {
      if (job.applicationDeadline) {
        updateData.expiresAt = job.applicationDeadline;
      } else {
        // Default to 30 days from publish date
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        updateData.expiresAt = defaultExpiry;
        logger.info(`Setting default expiry (30 days) for job ${jobId}`);
      }
    } else {
      // Validate existing expiresAt is in the future
      if (job.expiresAt < new Date()) {
        throw new Error(
          'Cannot publish job with expired expiry date. Update expiresAt first.'
        );
      }
    }

    // Validate expiresAt is after publishedAt
    if (updateData.expiresAt < updateData.publishedAt) {
      throw new Error('Expires at must be after the publish date');
    }

    const publishedJob = await this.repository.updateById(jobId, updateData);
    return publishedJob;
  }

  public async unpublishJob(
    jobId: string,
    userId: string
  ): Promise<IJob | null> {
    const job = await this.repository.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.postedBy.toString() !== userId) {
      throw new Error('Unauthorized to unpublish this job');
    }

    // Only allow unpublishing published jobs
    if (job.status !== JobStatus.PUBLISHED) {
      throw new Error(
        `Cannot unpublish a job with status '${job.status}'. Only published jobs can be unpublished.`
      );
    }

    // Change status to draft but keep publishedAt for history
    const unpublishedJob = await this.jobRepository.updateStatus(
      jobId,
      JobStatus.DRAFT
    );
    return unpublishedJob;
  }

  public async deleteJob(jobId: string, userId: string): Promise<boolean> {
    const job = await this.repository.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.postedBy.toString() !== userId) {
      throw new Error('Unauthorized to delete this job');
    }

    const deleted = await this.repository.deleteById(jobId);
    return !!deleted;
  }

  public async getJobById(
    jobId: string,
    incrementViews: boolean = false
  ): Promise<IJob | null> {
    const job = await this.repository.findById(jobId);

    if (job && incrementViews && job.status === JobStatus.PUBLISHED) {
      // Increment views and get updated job to avoid race condition
      const updatedJob = await this.jobRepository.incrementViews(jobId);
      return updatedJob || job; // Return updated job if available, otherwise original
    }

    return job;
  }

  public async searchJobs(query: JobFilterQuery): Promise<any> {
    return await this.jobRepository.searchJobs(query);
  }

  public async getJobsByHr(hrId: string, query: JobFilterQuery): Promise<any> {
    logger.debug(`getJobsByHr called for HR: ${hrId}, query:`, query);
    const result = await this.jobRepository.searchJobs({
      ...query,
      postedBy: hrId,
      status: query.status || undefined, // Allow HR to see all their job statuses by default
    });
    logger.debug(`getJobsByHr result: ${result.data.length} jobs found`);
    return result;
  }

  public async incrementApplicantsCount(jobId: string): Promise<IJob | null> {
    return await this.jobRepository.incrementApplicantsCount(jobId);
  }

  public async incrementBookmarksCount(jobId: string): Promise<IJob | null> {
    return await this.jobRepository.incrementBookmarksCount(jobId);
  }

  public async decrementBookmarksCount(jobId: string): Promise<IJob | null> {
    return await this.jobRepository.decrementBookmarksCount(jobId);
  }

  public async getPopularTags(limit: number = 10): Promise<string[]> {
    return await this.jobRepository.getPopularTags(limit);
  }

  public async getJobsByCategory(): Promise<any[]> {
    return await this.jobRepository.getJobsByCategory();
  }

  public async getJobsStatistics(): Promise<any> {
    return await this.jobRepository.getJobsStatistics();
  }

  public async expireJobs(): Promise<number> {
    return await this.jobRepository.expireJobs();
  }

  public async closeJob(jobId: string, userId: string): Promise<IJob | null> {
    const job = await this.repository.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.postedBy.toString() !== userId) {
      throw new Error('Unauthorized to close this job');
    }

    // Only allow closing published or draft jobs
    if (job.status === JobStatus.CLOSED) {
      throw new Error('Job is already closed');
    }

    if (job.status === JobStatus.EXPIRED) {
      throw new Error(
        'Cannot close an expired job. Expired jobs cannot be modified.'
      );
    }

    const closedJob = await this.jobRepository.updateStatus(
      jobId,
      JobStatus.CLOSED
    );
    return closedJob;
  }
}
