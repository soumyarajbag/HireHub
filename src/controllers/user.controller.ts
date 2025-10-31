import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { User } from '@/models/user.entity';
import { asyncHandler } from '@/middleware/error.middleware';

const userRepository = new UserRepository(User);
const userService = new UserService(userRepository);

export class UserController extends BaseController {
  public getUsers = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.findWithPagination({}, req.query);
    
    return this.handleSuccess(
      res,
      'Users retrieved successfully',
      result.data,
      200,
      result.meta
    );
  });

  public getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.findById(req.params.id);
    
    if (!user) {
      return this.handleNotFound(res, 'User not found');
    }
    
    return this.handleSuccess(
      res,
      'User retrieved successfully',
      { user }
    );
  });

  public updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.body);
    
    if (!user) {
      return this.handleNotFound(res, 'User not found');
    }
    
    return this.handleSuccess(
      res,
      'User updated successfully',
      { user }
    );
  });

  public deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const success = await userService.deleteUser(req.params.id);
    
    if (!success) {
      return this.handleNotFound(res, 'User not found');
    }
    
    return this.handleSuccess(
      res,
      'User deleted successfully'
    );
  });

  public deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.deactivateUser(req.params.id);
    
    if (!user) {
      return this.handleNotFound(res, 'User not found');
    }
    
    return this.handleSuccess(
      res,
      'User deactivated successfully',
      { user }
    );
  });

  public activateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.activateUser(req.params.id);
    
    if (!user) {
      return this.handleNotFound(res, 'User not found');
    }
    
    return this.handleSuccess(
      res,
      'User activated successfully',
      { user }
    );
  });

  public getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await userService.getUserStats();
    
    return this.handleSuccess(
      res,
      'User statistics retrieved successfully',
      { stats: stats[0] || {} }
    );
  });
}
