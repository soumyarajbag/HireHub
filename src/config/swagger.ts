import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Portal API',
      version: '1.0.0',
      description:
        'Comprehensive job portal API with OTP-based authentication, role-based access control, and advanced features',
      contact: {
        name: 'API Support',
        email: 'support@jobportal.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.jobportal.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Error details',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Success message',
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator', 'hr', 'applicant'],
              example: 'applicant',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            isEmailVerified: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'SecurePass123',
            },
            role: {
              type: 'string',
              enum: ['hr', 'applicant', 'user'],
              example: 'applicant',
            },
          },
        },
        RegisterOtpRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            role: {
              type: 'string',
              enum: ['hr', 'applicant'],
              example: 'applicant',
            },
          },
        },
        VerifyRegistrationOtpRequest: {
          type: 'object',
          required: ['email', 'otp', 'name', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            otp: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '123456',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'SecurePass123',
            },
            role: {
              type: 'string',
              enum: ['hr', 'applicant'],
              example: 'applicant',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'SecurePass123',
            },
          },
        },
        LoginOtpRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
          },
        },
        VerifyLoginOtpRequest: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            otp: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '123456',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        PasswordResetOtpRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
          },
        },
        VerifyPasswordResetOtpRequest: {
          type: 'object',
          required: ['email', 'otp', 'newPassword'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            otp: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '123456',
            },
            newPassword: {
              type: 'string',
              minLength: 6,
              example: 'NewSecurePass123',
            },
          },
        },
        VerifyEmailOtpRequest: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            otp: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '123456',
            },
          },
        },
        ResendOtpRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'newemail@example.com',
            },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              example: 'OldPass123',
            },
            newPassword: {
              type: 'string',
              minLength: 6,
              example: 'NewPass123',
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Senior Backend Developer',
            },
            description: {
              type: 'string',
              example: 'We are looking for an experienced backend developer...',
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['5+ years of experience', 'Node.js expertise'],
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['nodejs', 'typescript', 'mongodb'],
            },
            category: {
              type: 'string',
              enum: [
                'backend',
                'frontend',
                'full_stack',
                'mobile',
                'devops',
                'data_science',
                'machine_learning',
                'ui_ux',
                'qa',
                'security',
                'blockchain',
                'other',
              ],
              example: 'backend',
            },
            type: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'full_time',
                  'part_time',
                  'contract',
                  'internship',
                  'remote',
                  'on_site',
                  'hybrid',
                ],
              },
              example: ['full_time', 'remote'],
            },
            location: {
              type: 'string',
              example: 'New York, NY',
            },
            isRemote: {
              type: 'boolean',
              example: true,
            },
            salary: {
              type: 'object',
              properties: {
                min: {
                  type: 'number',
                  example: 50000,
                },
                max: {
                  type: 'number',
                  example: 100000,
                },
                currency: {
                  type: 'string',
                  example: 'USD',
                },
              },
            },
            duration: {
              type: 'string',
              example: '6 months',
            },
            applicationDeadline: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731434435650,
            },
            postedBy: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            companyName: {
              type: 'string',
              example: 'Tech Corp',
            },
            companyLogo: {
              type: 'string',
              format: 'uri',
            },
            companyCoverImage: {
              type: 'string',
              format: 'uri',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'expired', 'closed'],
              example: 'published',
            },
            views: {
              type: 'number',
              example: 150,
            },
            applicantsCount: {
              type: 'number',
              example: 25,
            },
            bookmarksCount: {
              type: 'number',
              example: 10,
            },
            expiresAt: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731628835650,
            },
            publishedAt: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731434435650,
            },
            createdAt: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731434435650,
            },
            updatedAt: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731434435650,
            },
          },
        },
        JobCreateRequest: {
          type: 'object',
          required: [
            'title',
            'description',
            'category',
            'type',
            'location',
            'salary',
            'companyName',
          ],
          properties: {
            title: {
              type: 'string',
              minLength: 5,
              maxLength: 200,
              example: 'Senior Backend Developer',
            },
            description: {
              type: 'string',
              minLength: 50,
              maxLength: 10000,
              example: 'We are looking for an experienced backend developer...',
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['5+ years of experience', 'Node.js expertise'],
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['nodejs', 'typescript', 'mongodb'],
            },
            category: {
              type: 'string',
              enum: [
                'backend',
                'frontend',
                'full_stack',
                'mobile',
                'devops',
                'data_science',
                'machine_learning',
                'ui_ux',
                'qa',
                'security',
                'blockchain',
                'other',
              ],
              example: 'backend',
            },
            type: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'full_time',
                  'part_time',
                  'contract',
                  'internship',
                  'remote',
                  'on_site',
                  'hybrid',
                ],
              },
              example: ['full_time', 'remote'],
            },
            location: {
              type: 'string',
              example: 'New York, NY',
            },
            isRemote: {
              type: 'boolean',
              example: true,
            },
            salary: {
              type: 'object',
              required: ['min', 'max'],
              properties: {
                min: {
                  type: 'number',
                  example: 50000,
                },
                max: {
                  type: 'number',
                  example: 100000,
                },
                currency: {
                  type: 'string',
                  default: 'USD',
                  example: 'USD',
                },
              },
            },
            duration: {
              type: 'string',
              example: '6 months',
            },
            applicationDeadline: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731434435650,
            },
            companyName: {
              type: 'string',
              example: 'Tech Corp',
            },
            companyLogo: {
              type: 'string',
              format: 'uri',
            },
            companyCoverImage: {
              type: 'string',
              format: 'uri',
            },
            expiresAt: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731628835650,
            },
          },
        },
        JobUpdateRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 5,
              maxLength: 200,
            },
            description: {
              type: 'string',
              minLength: 50,
              maxLength: 10000,
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            category: {
              type: 'string',
              enum: [
                'backend',
                'frontend',
                'full_stack',
                'mobile',
                'devops',
                'data_science',
                'machine_learning',
                'ui_ux',
                'qa',
                'security',
                'blockchain',
                'other',
              ],
            },
            type: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            location: {
              type: 'string',
            },
            isRemote: {
              type: 'boolean',
            },
            salary: {
              type: 'object',
              properties: {
                min: {
                  type: 'number',
                },
                max: {
                  type: 'number',
                },
                currency: {
                  type: 'string',
                },
              },
            },
            duration: {
              type: 'string',
            },
            applicationDeadline: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731434435650,
            },
            companyName: {
              type: 'string',
            },
            companyLogo: {
              type: 'string',
              format: 'uri',
            },
            companyCoverImage: {
              type: 'string',
              format: 'uri',
            },
            expiresAt: {
              type: 'number',
              description: 'Unix timestamp in milliseconds',
              example: 1731628835650,
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'expired', 'closed'],
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
