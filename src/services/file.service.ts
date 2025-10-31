import { FileRepository } from '@/repositories/file.repository';
import { BaseService } from './base.service';
import { IFile } from '@/models/file.entity';
import { FileType, FileStatus } from '@/enums';
import { CloudinaryConfig } from '@/config/cloudinary';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export class FileService extends BaseService<IFile> {
  private cloudinaryConfig: CloudinaryConfig;

  constructor(fileRepository: FileRepository) {
    super(fileRepository);
    this.cloudinaryConfig = CloudinaryConfig.getInstance();
  }

  public async uploadFile(
    file: any,
    uploaderId: string,
    type: FileType = FileType.OTHER
  ): Promise<IFile> {
    try {
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(process.env.UPLOAD_PATH || 'uploads', filename);

      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      fs.writeFileSync(filePath, file.buffer);

      const fileType = this.determineFileType(file.mimetype);
      const fileData = {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        url: '',
        type: fileType,
        status: FileStatus.UPLOADING,
        uploadedBy: uploaderId,
      };

      const savedFile = await this.repository.create(fileData);

      try {
        const uploadResult = await this.cloudinaryConfig.uploadImage(filePath, {
          public_id: `files/${savedFile._id}`,
        });

        const updatedFile = await this.repository.updateById(savedFile._id, {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          status: FileStatus.UPLOADED,
          metadata: {
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
          },
        });

        fs.unlinkSync(filePath);

        return updatedFile!;
      } catch (cloudinaryError) {
        logger.error('Cloudinary upload failed:', cloudinaryError);
        await this.repository.updateById(savedFile._id, {
          status: FileStatus.FAILED,
        });
        throw new Error('File upload failed');
      }
    } catch (error) {
      logger.error('File upload error:', error);
      throw error;
    }
  }

  public async uploadVideo(
    file: any,
    uploaderId: string
  ): Promise<IFile> {
    try {
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(process.env.UPLOAD_PATH || 'uploads', filename);

      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      fs.writeFileSync(filePath, file.buffer);

      const fileData = {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        url: '',
        type: FileType.VIDEO,
        status: FileStatus.UPLOADING,
        uploadedBy: uploaderId,
      };

      const savedFile = await this.repository.create(fileData);

      try {
        const uploadResult = await this.cloudinaryConfig.uploadVideo(filePath, {
          public_id: `videos/${savedFile._id}`,
        });

        const updatedFile = await this.repository.updateById(savedFile._id, {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          status: FileStatus.UPLOADED,
          metadata: {
            width: uploadResult.width,
            height: uploadResult.height,
            duration: uploadResult.duration,
            format: uploadResult.format,
          },
        });

        fs.unlinkSync(filePath);

        return updatedFile!;
      } catch (cloudinaryError) {
        logger.error('Cloudinary video upload failed:', cloudinaryError);
        await this.repository.updateById(savedFile._id, {
          status: FileStatus.FAILED,
        });
        throw new Error('Video upload failed');
      }
    } catch (error) {
      logger.error('Video upload error:', error);
      throw error;
    }
  }

  public async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await this.repository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.uploadedBy.toString() !== userId) {
      throw new Error('Unauthorized to delete this file');
    }

    try {
      if (file.publicId) {
        if (file.type === FileType.VIDEO) {
          await this.cloudinaryConfig.deleteVideo(file.publicId);
        } else {
          await this.cloudinaryConfig.deleteImage(file.publicId);
        }
      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      await this.repository.deleteById(fileId);
      return true;
    } catch (error) {
      logger.error('File deletion error:', error);
      throw error;
    }
  }

  public async getFilesByUploader(uploaderId: string, pagination: any = {}): Promise<any> {
    return await this.repository.getFilesByUploaderWithPagination(uploaderId, pagination);
  }

  public async getFileStats(): Promise<any> {
    return await this.repository.getFileStats();
  }

  public async cleanupExpiredFiles(): Promise<number> {
    return await this.repository.deleteExpiredFiles();
  }

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    } else if (mimeType.startsWith('video/')) {
      return FileType.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return FileType.AUDIO;
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('spreadsheet')
    ) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  public async generateSignedUrl(publicId: string, options: any = {}): Promise<string> {
    return this.cloudinaryConfig.generateImageUrl(publicId, {
      secure: true,
      ...options,
    });
  }
}
