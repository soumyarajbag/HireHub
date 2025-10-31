import { IFile } from '@/models/file.entity';
import { BaseRepository } from './base.repository';
import { FileType, FileStatus } from '@/enums';

export class FileRepository extends BaseRepository<IFile> {
  public async findByUploader(uploaderId: string): Promise<IFile[]> {
    return await this.find({ uploadedBy: uploaderId });
  }

  public async findByType(type: FileType): Promise<IFile[]> {
    return await this.find({ type, status: FileStatus.UPLOADED });
  }

  public async findByStatus(status: FileStatus): Promise<IFile[]> {
    return await this.find({ status });
  }

  public async findByPublicId(publicId: string): Promise<IFile | null> {
    return await this.findOne({ publicId });
  }

  public async updateStatus(
    fileId: string,
    status: FileStatus
  ): Promise<IFile | null> {
    return await this.updateById(fileId, { status });
  }

  public async getFilesByUploaderWithPagination(
    uploaderId: string,
    pagination: any = {}
  ): Promise<any> {
    return await this.findWithPagination(
      { uploadedBy: uploaderId },
      pagination
    );
  }

  public async getFileStats(): Promise<any> {
    return await this.aggregate([
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          filesByType: {
            $push: {
              type: '$type',
              size: '$size',
            },
          },
          filesByStatus: {
            $push: {
              status: '$status',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalFiles: 1,
          totalSize: 1,
          typeDistribution: {
            $reduce: {
              input: '$filesByType',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.type',
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $getField: {
                                      field: '$$this.type',
                                      input: '$$value',
                                    },
                                  },
                                  0,
                                ],
                              },
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
          statusDistribution: {
            $reduce: {
              input: '$filesByStatus',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.status',
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $getField: {
                                      field: '$$this.status',
                                      input: '$$value',
                                    },
                                  },
                                  0,
                                ],
                              },
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

  public async deleteExpiredFiles(): Promise<number> {
    const result = await this.deleteMany({
      status: FileStatus.FAILED,
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    return result.deletedCount || 0;
  }
}
