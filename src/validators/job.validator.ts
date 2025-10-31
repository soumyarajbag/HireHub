import { body, query } from 'express-validator';
import { JobType, JobCategory, JobStatus, SortBy } from '@/enums';

export const validateJobCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50, max: 10000 })
    .withMessage('Description must be between 50 and 10000 characters'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(Object.values(JobCategory))
    .withMessage('Invalid category'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isArray()
    .withMessage('Type must be an array')
    .custom((types) => {
      if (!Array.isArray(types) || types.length === 0) {
        throw new Error('At least one job type is required');
      }
      const validTypes = Object.values(JobType);
      const invalidTypes = types.filter((t: string) => !validTypes.includes(t));
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid job types: ${invalidTypes.join(', ')}`);
      }
      return true;
    }),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('isRemote')
    .optional()
    .isBoolean()
    .withMessage('isRemote must be a boolean'),
  body('salary.min')
    .notEmpty()
    .withMessage('Minimum salary is required')
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salary.max')
    .notEmpty()
    .withMessage('Maximum salary is required')
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number')
    .custom((max, { req }) => {
      if (req.body.salary && max < req.body.salary.min) {
        throw new Error('Maximum salary must be greater than minimum salary');
      }
      return true;
    }),
  body('salary.currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Duration must not exceed 50 characters'),
  body('applicationDeadline')
    .optional({ nullable: true, checkFalsy: true })
    .custom((deadline) => {
      if (deadline === undefined || deadline === null || deadline === '')
        return true;
      const timestamp =
        typeof deadline === 'string' ? parseInt(deadline, 10) : deadline;
      if (isNaN(timestamp) || timestamp < 0) {
        throw new Error(
          'Application deadline must be a valid timestamp (Unix timestamp in milliseconds)'
        );
      }
      if (timestamp < Date.now()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 200 })
    .withMessage('Company name must not exceed 200 characters'),
  body('companyLogo')
    .optional()
    .isURL()
    .withMessage('Company logo must be a valid URL'),
  body('companyCoverImage')
    .optional()
    .isURL()
    .withMessage('Company cover image must be a valid URL'),
  body('expiresAt')
    .optional({ nullable: true, checkFalsy: true })
    .custom((expiresAt) => {
      if (expiresAt === undefined || expiresAt === null || expiresAt === '')
        return true;
      const timestamp =
        typeof expiresAt === 'string' ? parseInt(expiresAt, 10) : expiresAt;
      if (isNaN(timestamp) || timestamp < 0) {
        throw new Error(
          'Expires at must be a valid timestamp (Unix timestamp in milliseconds)'
        );
      }
      if (timestamp < Date.now()) {
        throw new Error('Expires at must be in the future');
      }
      return true;
    }),
];

export const validateJobUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Description must be between 50 and 10000 characters'),
  body('category')
    .optional()
    .isIn(Object.values(JobCategory))
    .withMessage('Invalid category'),
  body('type').optional().isArray().withMessage('Type must be an array'),
  body('status')
    .optional()
    .isIn(Object.values(JobStatus))
    .withMessage('Invalid status'),
  body('applicationDeadline')
    .optional({ nullable: true, checkFalsy: true })
    .custom((deadline) => {
      if (deadline === undefined || deadline === null || deadline === '')
        return true;
      const timestamp =
        typeof deadline === 'string' ? parseInt(deadline, 10) : deadline;
      if (isNaN(timestamp) || timestamp < 0) {
        throw new Error(
          'Application deadline must be a valid timestamp (Unix timestamp in milliseconds)'
        );
      }
      if (timestamp < Date.now()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  body('expiresAt')
    .optional({ nullable: true, checkFalsy: true })
    .custom((expiresAt) => {
      if (expiresAt === undefined || expiresAt === null || expiresAt === '')
        return true;
      const timestamp =
        typeof expiresAt === 'string' ? parseInt(expiresAt, 10) : expiresAt;
      if (isNaN(timestamp) || timestamp < 0) {
        throw new Error(
          'Expires at must be a valid timestamp (Unix timestamp in milliseconds)'
        );
      }
      if (timestamp < Date.now()) {
        throw new Error('Expires at must be in the future');
      }
      return true;
    }),
  body('salary.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  body('salary.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
];

export const validateJobSearch = [
  query('category')
    .optional()
    .isIn(Object.values(JobCategory))
    .withMessage('Invalid category'),
  query('type')
    .optional()
    .isIn(Object.values(JobType))
    .withMessage('Invalid job type'),
  query('isRemote')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isRemote must be true or false'),
  query('minSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
  query('maxSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
  query('sort')
    .optional()
    .isIn(Object.values(SortBy))
    .withMessage('Invalid sort option'),
  query('keyword')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Keyword must be at least 2 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
