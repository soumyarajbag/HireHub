import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { FileService } from '@/services/file.service';
import { FileRepository } from '@/repositories/file.repository';
import { File } from '@/models/file.entity';
import { asyncHandler } from '@/middleware/error.middleware';

const fileRepository = new FileRepository(File);
const fileService = new FileService(fileRepository);

export class FileController extends BaseController {
  public uploadFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return this.handleError(new Error('No file uploaded'), res);
    }

    const file = await fileService.uploadFile(
      req.file,
      req.user!._id,
      req.body.type
    );

    return this.handleSuccess(res, 'File uploaded successfully', { file }, 201);
  });

  public uploadVideo = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return this.handleError(new Error('No video uploaded'), res);
    }

    const file = await fileService.uploadVideo(req.file, req.user!._id);

    return this.handleSuccess(
      res,
      'Video uploaded successfully',
      { file },
      201
    );
  });

  public getFiles = asyncHandler(async (req: Request, res: Response) => {
    const result = await fileService.getFilesByUploader(
      req.user!._id,
      req.query
    );

    return this.handleSuccess(
      res,
      'Files retrieved successfully',
      result.data,
      200,
      result.meta
    );
  });

  public getFileById = asyncHandler(async (req: Request, res: Response) => {
    const file = await fileService.findById(req.params.id);

    if (!file) {
      return this.handleNotFound(res, 'File not found');
    }

    if (file.uploadedBy.toString() !== req.user!._id) {
      return this.handleForbidden(res, 'Access denied to this file');
    }

    return this.handleSuccess(res, 'File retrieved successfully', { file });
  });

  public deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const success = await fileService.deleteFile(req.params.id, req.user!._id);

    if (!success) {
      return this.handleNotFound(res, 'File not found or access denied');
    }

    return this.handleSuccess(res, 'File deleted successfully');
  });

  public getFileStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await fileService.getFileStats();

    return this.handleSuccess(res, 'File statistics retrieved successfully', {
      stats: stats[0] || {},
    });
  });

  public generateSignedUrl = asyncHandler(
    async (req: Request, res: Response) => {
      const { publicId } = req.params;
      const { options = {} } = req.body;

      const signedUrl = await fileService.generateSignedUrl(publicId, options);

      return this.handleSuccess(res, 'Signed URL generated successfully', {
        signedUrl,
      });
    }
  );

  public cleanupExpiredFiles = asyncHandler(
    async (req: Request, res: Response) => {
      const deletedCount = await fileService.cleanupExpiredFiles();

      return this.handleSuccess(res, 'Expired files cleaned up successfully', {
        deletedCount,
      });
    }
  );
}
