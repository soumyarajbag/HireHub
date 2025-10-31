import Joi from 'joi';
import { FileType } from '@/enums';

export const fileUploadSchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(FileType))
    .optional()
    .messages({
      'any.only': 'Invalid file type specified',
    }),
});

export const fileQuerySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(FileType))
    .optional()
    .messages({
      'any.only': 'Invalid file type specified',
    }),
  status: Joi.string()
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  sort: Joi.string()
    .optional()
    .messages({
      'string.base': 'Sort must be a string',
    }),
  order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .messages({
      'any.only': 'Order must be either asc or desc',
    }),
});

export const fileIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid file ID format',
      'any.required': 'File ID is required',
    }),
});

export const fileUpdateSchema = Joi.object({
  originalName: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Original name must not be empty',
      'string.max': 'Original name must not exceed 255 characters',
    }),
  metadata: Joi.object({
    width: Joi.number()
      .integer()
      .min(1)
      .optional(),
    height: Joi.number()
      .integer()
      .min(1)
      .optional(),
    duration: Joi.number()
      .min(0)
      .optional(),
    format: Joi.string()
      .optional(),
  }).optional(),
});
