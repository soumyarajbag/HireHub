import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseHandler {
  public static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    meta?: any
  ): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
    };

    return res.status(statusCode).json(response);
  }

  public static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };

    return res.status(statusCode).json(response);
  }

  public static validationError(
    res: Response,
    message: string = 'Validation failed',
    errors?: any
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
      error: errors,
    };

    return res.status(400).json(response);
  }

  public static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
    };

    return res.status(401).json(response);
  }

  public static forbidden(
    res: Response,
    message: string = 'Forbidden'
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
    };

    return res.status(403).json(response);
  }

  public static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
    };

    return res.status(404).json(response);
  }

  public static conflict(
    res: Response,
    message: string = 'Conflict'
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
    };

    return res.status(409).json(response);
  }

  public static tooManyRequests(
    res: Response,
    message: string = 'Too many requests'
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
    };

    return res.status(429).json(response);
  }
}
