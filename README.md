# Express TypeScript Backend

A comprehensive Express + TypeScript backend with modular object-oriented architecture, featuring MongoDB, Redis, Socket.IO, Cloudinary, Nodemailer, and more.

## Features

- **Modular OOP Architecture**: Clean separation of concerns with repositories, services, and controllers
- **TypeScript**: Full type safety and modern JavaScript features
- **MongoDB**: Document database with Mongoose ODM
- **Redis**: Caching and session management
- **Socket.IO**: Real-time communication
- **Cloudinary**: File upload and management
- **Nodemailer**: Email services with templates
- **Cron Jobs**: Automated tasks and cleanup
- **Swagger**: API documentation
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API protection
- **Validation**: Request validation with Joi and express-validator
- **Error Handling**: Centralized error management
- **Logging**: Winston-based logging system
- **Testing**: Jest test setup

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── enums/           # TypeScript enums
├── middleware/      # Express middleware
├── models/          # MongoDB models
├── repositories/    # Data access layer
├── routes/          # API routes
├── services/        # Business logic layer
├── templates/       # Email templates
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── validators/      # Validation schemas
└── tests/           # Test files
```

## Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- MongoDB
- Redis
- Cloudinary account
- SMTP email service

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd express-typescript-backend
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp env.example .env
```

4. Configure environment variables in `.env`

5. Build the project
```bash
npm run build
```

6. Start the server
```bash
npm start
```

For development:
```bash
npm run dev
```

### Environment Variables

See `env.example` for all required environment variables.

## API Documentation

Once the server is running, visit `/api-docs` for Swagger documentation.

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/request-password-reset` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/change-password` - Change password
- `DELETE /api/v1/auth/account` - Delete account

### Users
- `GET /api/v1/users` - Get all users (Admin/Moderator)
- `GET /api/v1/users/:id` - Get user by ID (Admin/Moderator)
- `PUT /api/v1/users/:id` - Update user (Admin)
- `DELETE /api/v1/users/:id` - Delete user (Admin)
- `PATCH /api/v1/users/:id/deactivate` - Deactivate user (Admin)
- `PATCH /api/v1/users/:id/activate` - Activate user (Admin)
- `GET /api/v1/users/stats` - Get user statistics (Admin)

### Files
- `POST /api/v1/files/upload` - Upload file
- `POST /api/v1/files/upload-video` - Upload video
- `GET /api/v1/files` - Get user's files
- `GET /api/v1/files/:id` - Get file by ID
- `DELETE /api/v1/files/:id` - Delete file
- `POST /api/v1/files/:publicId/signed-url` - Generate signed URL
- `GET /api/v1/files/stats` - Get file statistics (Admin)
- `POST /api/v1/files/cleanup` - Cleanup expired files (Admin)

### Notifications
- `POST /api/v1/notifications` - Create notification (Admin/Moderator)
- `POST /api/v1/notifications/bulk` - Send bulk notifications (Admin/Moderator)
- `GET /api/v1/notifications` - Get user's notifications
- `GET /api/v1/notifications/unread` - Get unread notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `GET /api/v1/notifications/:id` - Get notification by ID
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/mark-all-read` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `GET /api/v1/notifications/stats` - Get notification statistics (Admin)
- `POST /api/v1/notifications/cleanup` - Cleanup old notifications (Admin)
- `POST /api/v1/notifications/resend-failed` - Resend failed notifications (Admin)

## Socket.IO Events

- `connection` - User connects
- `disconnect` - User disconnects
- `join_room` - Join a room
- `leave_room` - Leave a room
- `message` - Send message
- `notification` - Receive notification
- `error` - Error occurred

## Cron Jobs

- **File Cleanup**: Runs daily at 2:00 AM UTC
- **Notification Cleanup**: Runs daily at 3:00 AM UTC
- **Failed Notification Resend**: Runs every 30 minutes
- **Health Check**: Runs every 5 minutes

## Testing

Run tests with:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

MIT License
