# Postman Collection Setup Guide

This directory contains Postman collection files for testing the Interview Platform API.

## Files Included

1. **Interview_API_Collection.postman_collection.json** - Complete API collection with all endpoints
2. **Interview_API_Environment.postman_environment.json** - Environment variables
3. **SOCKET_IO_TEST_CLIENT.html** - Browser-based Socket.IO test client (since Postman doesn't natively support Socket.IO)

## Import Instructions

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files**
4. Choose `Interview_API_Collection.postman_collection.json`
5. Click **Import**

### Step 2: Import Environment
1. Click the **Environments** icon (left sidebar)
2. Click **Import**
3. Choose `Interview_API_Environment.postman_environment.json`
4. Click **Import**
5. Select the environment from the dropdown (top right)

### Step 3: Configure Environment Variables
Update these values in the environment:
- `baseUrl`: Your server URL (default: `http://localhost:3000`)
- `testEmail`: Your test email
- `testPassword`: Your test password

## Collection Structure

### 1. Authentication
- Register (OTP-based)
- Login (OTP-based and legacy)
- Token refresh
- Logout
- Password reset (OTP-based)
- Email verification (OTP-based)
- Profile management

### 2. Jobs
- Search jobs with filters
- Get job by ID
- Create/Update/Delete jobs (HR only)
- Publish/Unpublish/Close jobs (HR only)
- Get popular tags
- Get jobs by category
- Job statistics

### 3. Users
- Get all users (Admin/Moderator)
- Get user by ID
- Update/Delete users (Admin)
- Activate/Deactivate users (Admin)
- User statistics

### 4. Files
- Upload file/video
- Get files
- Get file by ID
- Delete file
- Generate signed URL
- File statistics
- Cleanup expired files

### 5. Notifications
- Get notifications
- Get unread notifications
- Mark as read
- Create notification (Admin/Moderator)
- Bulk notifications
- Notification statistics

## Usage Flow

### For Applicants:
1. **Register**: `Authentication > Register - Send OTP` → `Register - Verify OTP`
2. **Login**: `Authentication > Login - Verify OTP` (or Login - Legacy)
3. **Search Jobs**: `Jobs > Search Jobs`
4. **View Job**: `Jobs > Get Job By ID`
5. **View Notifications**: `Notifications > Get My Notifications`

### For HR Users:
1. **Register**: `Authentication > Register - Send OTP` (with role: "hr")
2. **Create Job**: `Jobs > Create Job (HR Only)`
3. **Publish Job**: `Jobs > Publish Job (HR Only)`
4. **View My Jobs**: `Jobs > Get My Jobs (HR Only)`

### For Admins:
1. **Login**: Use admin credentials
2. **Manage Users**: `Users > Get All Users`, etc.
3. **View Statistics**: Various stats endpoints

## Auto Token Management

The collection includes automatic token management:
- Tokens are automatically saved to collection variables after login
- Tokens are automatically used in subsequent requests
- Refresh token is automatically used when access token expires

## Testing Socket.IO

Postman doesn't natively support Socket.IO. Use one of these methods:

### Option 1: HTML Client (Recommended)
1. Open `SOCKET_IO_TEST_CLIENT.html` in your browser
2. Enter your server URL (default: `http://localhost:3000`)
3. Paste your access token from Postman
4. Click **Connect**
5. Trigger notifications via API to see real-time updates

### Option 2: Node.js Client
```bash
npm install socket.io-client
```

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

### Option 3: Browser Console
```javascript
// Include Socket.IO library first
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

## Test Cases Included

### Authentication Tests
- ✅ Register with OTP
- ✅ Login with OTP
- ✅ Token refresh
- ✅ Password reset
- ✅ Email verification

### Job Tests
- ✅ Search with filters (category, type, salary, keyword)
- ✅ Create job (draft)
- ✅ Publish job
- ✅ Update job
- ✅ Delete job
- ✅ Get popular tags

### Notification Tests
- ✅ Get notifications
- ✅ Mark as read
- ✅ Real-time Socket.IO notifications (via HTML client)

## Variables Automatically Set

The collection automatically sets these variables:
- `accessToken` - After login
- `refreshToken` - After login
- `userId` - After login
- `jobId` - After creating a job
- `fileId` - After uploading a file
- `notificationId` - After fetching notifications

## Common Issues

### 401 Unauthorized
- Make sure you're logged in and the access token is set
- Check if the token has expired (refresh it)

### 403 Forbidden
- Check your user role (HR, Admin, etc.)
- Ensure email is verified for certain endpoints

### 404 Not Found
- Verify the endpoint URL
- Check if the resource ID exists

### 429 Too Many Requests
- Rate limiting is active
- Wait a few minutes before retrying

## Tips

1. **Use Environment Variables**: Switch between development/production easily
2. **Save Responses**: Save successful responses as examples
3. **Use Tests Tab**: Add validation tests for each request
4. **Collection Runner**: Run multiple requests in sequence
5. **Monitors**: Set up automated tests with Postman monitors

## Socket.IO Test Client Features

The HTML client (`SOCKET_IO_TEST_CLIENT.html`) includes:
- ✅ Connection status indicator
- ✅ Real-time notification logging
- ✅ Connection/disconnection controls
- ✅ Error handling
- ✅ Message formatting
- ✅ Auto-scrolling logs

## Next Steps

1. Import both files into Postman
2. Set up your environment variables
3. Start with authentication endpoints
4. Test Socket.IO using the HTML client
5. Explore all endpoints systematically

Happy Testing! 🚀

