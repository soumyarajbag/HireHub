import { Router } from 'express';
import { FileController } from '@/controllers/file.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { fileUploadLimiter } from '@/middleware/rate-limiter.middleware';
import {
  uploadSingle,
  handleUploadError,
} from '@/middleware/upload.middleware';
import {
  validateMongoId,
  validatePagination,
} from '@/middleware/validation.middleware';
import { validateRequest } from '@/utils/validation';

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
  validateRequest(validatePagination),
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
  validateRequest(validateMongoId('id')),
  fileController.getFileById
);

router.delete(
  '/:id',
  authenticate,
  validateRequest(validateMongoId('id')),
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
