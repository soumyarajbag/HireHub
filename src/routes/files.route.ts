import { Router } from 'express';
import { FileController } from '@/controllers/file.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { fileUploadLimiter } from '@/middleware/rate-limiter.middleware';
import { uploadSingle, handleUploadError } from '@/middleware/upload.middleware';
import { validateMongoId, validatePagination } from '@/middleware/validation.middleware';

const router = Router();
const fileController = new FileController();

router.post(
  '/upload',
  authenticate,
  fileUploadLimiter,
  uploadSingle('file'),
  handleUploadError,
  fileController.uploadFile
);

router.post(
  '/upload-video',
  authenticate,
  fileUploadLimiter,
  uploadSingle('video'),
  handleUploadError,
  fileController.uploadVideo
);

router.get(
  '/',
  authenticate,
  validatePagination,
  fileController.getFiles
);

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  fileController.getFileStats
);

router.get(
  '/:id',
  authenticate,
  validateMongoId('id'),
  fileController.getFileById
);

router.delete(
  '/:id',
  authenticate,
  validateMongoId('id'),
  fileController.deleteFile
);

router.post(
  '/:publicId/signed-url',
  authenticate,
  fileController.generateSignedUrl
);

router.post(
  '/cleanup',
  authenticate,
  authorize('admin'),
  fileController.cleanupExpiredFiles
);

export default router;
