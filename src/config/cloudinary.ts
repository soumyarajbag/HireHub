import { v2 as cloudinary } from 'cloudinary';
import { config } from './environment';

export class CloudinaryConfig {
  private static instance: CloudinaryConfig;
  private isConfigured = false;

  private constructor() {}

  public static getInstance(): CloudinaryConfig {
    if (!CloudinaryConfig.instance) {
      CloudinaryConfig.instance = new CloudinaryConfig();
    }
    return CloudinaryConfig.instance;
  }

  public configure(): void {
    if (this.isConfigured) {
      return;
    }

    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });

    this.isConfigured = true;
  }

  public getCloudinary() {
    if (!this.isConfigured) {
      this.configure();
    }
    return cloudinary;
  }

  public async uploadImage(file: string, options?: any): Promise<any> {
    const cloudinaryInstance = this.getCloudinary();
    return await cloudinaryInstance.uploader.upload(file, {
      resource_type: 'auto',
      folder: 'express-typescript-backend',
      ...options,
    });
  }

  public async uploadVideo(file: string, options?: any): Promise<any> {
    const cloudinaryInstance = this.getCloudinary();
    return await cloudinaryInstance.uploader.upload(file, {
      resource_type: 'video',
      folder: 'express-typescript-backend/videos',
      ...options,
    });
  }

  public async deleteImage(publicId: string): Promise<any> {
    const cloudinaryInstance = this.getCloudinary();
    return await cloudinaryInstance.uploader.destroy(publicId);
  }

  public async deleteVideo(publicId: string): Promise<any> {
    const cloudinaryInstance = this.getCloudinary();
    return await cloudinaryInstance.uploader.destroy(publicId, {
      resource_type: 'video',
    });
  }

  public generateImageUrl(publicId: string, options?: any): string {
    const cloudinaryInstance = this.getCloudinary();
    return cloudinaryInstance.url(publicId, options);
  }

  public generateVideoUrl(publicId: string, options?: any): string {
    const cloudinaryInstance = this.getCloudinary();
    return cloudinaryInstance.video_url(publicId, options);
  }
}
