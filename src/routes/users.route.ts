import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { validateMongoId, validatePagination } from '@/middleware/validation.middleware';
import { validateUserUpdate } from '@/middleware/validation.middleware';

const router = Router();
const userController = new UserController();

router.get(
  '/',
  authenticate,
  authorize('admin', 'moderator'),
  validatePagination,
  userController.getUsers
);

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  userController.getUserStats
);

router.get(
  '/:id',
  authenticate,
  authorize('admin', 'moderator'),
  validateMongoId('id'),
  userController.getUserById
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateMongoId('id'),
  validateUserUpdate,
  userController.updateUser
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateMongoId('id'),
  userController.deleteUser
);

router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('admin'),
  validateMongoId('id'),
  userController.deactivateUser
);

router.patch(
  '/:id/activate',
  authenticate,
  authorize('admin'),
  validateMongoId('id'),
  userController.activateUser
);

export default router;
