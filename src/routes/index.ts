import { Router } from 'express';
import authRoutes from './auth.route';
import userRoutes from './users.route';
import fileRoutes from './files.route';
import notificationRoutes from './notifications.route';
import jobRoutes from './jobs.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/jobs', jobRoutes);

export default router;
