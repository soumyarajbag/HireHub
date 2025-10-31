import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '@/utils/response';
import { logger } from '@/utils/logger';

export abstract class BaseController {
  protected handleError(error: any, res: Response, message?: string): Response {
    logger.error('Controller error:', error);

    if (error.message) {
      return ResponseHandler.error(
        res,
        message || error.message,
        error.statusCode || 500
      );
    }

    return ResponseHandler.error(res, message || 'An error occurred', 500);
  }

  protected handleSuccess(
    res: Response,
    message: string,
    data?: any,
    statusCode: number = 200,
    meta?: any
  ): Response {
    return ResponseHandler.success(res, message, data, statusCode, meta);
  }

  protected handleValidationError(
    res: Response,
    message: string = 'Validation failed',
    errors?: any
  ): Response {
    return ResponseHandler.validationError(res, message, errors);
  }

  protected handleNotFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return ResponseHandler.notFound(res, message);
  }

  protected handleUnauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response {
    return ResponseHandler.unauthorized(res, message);
  }

  protected handleForbidden(
    res: Response,
    message: string = 'Forbidden'
  ): Response {
    return ResponseHandler.forbidden(res, message);
  }

  protected handleConflict(
    res: Response,
    message: string = 'Conflict'
  ): Response {
    return ResponseHandler.conflict(res, message);
  }

  protected async executeAsync(
    operation: () => Promise<any>,
    res: Response,
    successMessage: string,
    successStatusCode: number = 200
  ): Promise<Response> {
    try {
      const result = await operation();
      return this.handleSuccess(res, successMessage, result, successStatusCode);
    } catch (error) {
      return this.handleError(error, res);
    }
  }
}
