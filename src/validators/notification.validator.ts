import Joi from 'joi';
import { NotificationType } from '@/enums';

export const notificationCreateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required',
    }),
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Message must not be empty',
      'string.max': 'Message must not exceed 1000 characters',
      'any.required': 'Message is required',
    }),
  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .optional()
    .messages({
      'any.only': 'Invalid notification type specified',
    }),
  recipientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid recipient ID format',
      'any.required': 'Recipient ID is required',
    }),
  data: Joi.object()
    .optional(),
});

export const notificationUpdateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title must not exceed 200 characters',
    }),
  message: Joi.string()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Message must not be empty',
      'string.max': 'Message must not exceed 1000 characters',
    }),
  data: Joi.object()
    .optional(),
});

export const notificationQuerySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .optional()
    .messages({
      'any.only': 'Invalid notification type specified',
    }),
  status: Joi.string()
    .optional(),
  unread: Joi.boolean()
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

export const notificationIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid notification ID format',
      'any.required': 'Notification ID is required',
    }),
});

export const bulkNotificationSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required',
    }),
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Message must not be empty',
      'string.max': 'Message must not exceed 1000 characters',
      'any.required': 'Message is required',
    }),
  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .optional()
    .messages({
      'any.only': 'Invalid notification type specified',
    }),
  recipientIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid recipient ID format',
        })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one recipient ID is required',
      'array.max': 'Maximum 100 recipients allowed',
      'any.required': 'Recipient IDs are required',
    }),
  data: Joi.object()
    .optional(),
});
