import { IUser } from '@/models/user.entity';
import { BaseRepository } from './base.repository';
import { UserRole } from '@/enums';

export class UserRepository extends BaseRepository<IUser> {
  public async findByEmail(email: string): Promise<IUser | null> {
    return await this.findOne({ email: email.toLowerCase() });
  }

  public async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  public async findByEmailVerificationToken(token: string): Promise<IUser | null> {
    return await this.findOne({ emailVerificationToken: token });
  }

  public async findByPasswordResetToken(token: string): Promise<IUser | null> {
    return await this.model
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }

  public async findActiveUsers(): Promise<IUser[]> {
    return await this.find({ isActive: true });
  }

  public async findUsersByRole(role: UserRole): Promise<IUser[]> {
    return await this.find({ role, isActive: true });
  }

  public async findVerifiedUsers(): Promise<IUser[]> {
    return await this.find({ isEmailVerified: true, isActive: true });
  }

  public async updateLastLogin(userId: string): Promise<IUser | null> {
    return await this.updateById(userId, { lastLogin: new Date() });
  }

  public async incrementTokenVersion(userId: string): Promise<IUser | null> {
    return await this.model.findByIdAndUpdate(
      userId,
      { $inc: { tokenVersion: 1 } },
      { new: true }
    ).exec();
  }

  public async clearPasswordResetToken(userId: string): Promise<IUser | null> {
    return await this.updateById(userId, {
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  }

  public async verifyEmail(userId: string): Promise<IUser | null> {
    return await this.updateById(userId, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
    });
  }

  public async deactivateUser(userId: string): Promise<IUser | null> {
    return await this.updateById(userId, { isActive: false });
  }

  public async activateUser(userId: string): Promise<IUser | null> {
    return await this.updateById(userId, { isActive: true });
  }

  public async getUserStats(): Promise<any> {
    return await this.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] },
          },
          usersByRole: {
            $push: {
              role: '$role',
              isActive: '$isActive',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          activeUsers: 1,
          verifiedUsers: 1,
          roleDistribution: {
            $reduce: {
              input: '$usersByRole',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.role',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this.role', input: '$$value' } }, 0] },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ]);
  }
}
