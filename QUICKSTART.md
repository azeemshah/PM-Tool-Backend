# Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (v6 or higher) - locally or MongoDB Atlas account

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following required variables:

```env
# Database - Update with your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/pm-tool

# JWT Secrets - Generate secure random strings for production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Email Configuration - Use your email provider credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@pm-tool.com

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 3. Start MongoDB

If using local MongoDB:
```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/data/directory
```

If using MongoDB Atlas, ensure your connection string in `.env` is correct.

### 4. Run the Application

**Development mode with hot-reload:**
```bash
npm run start:dev
```

**Production build:**
```bash
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api/v1`

## Testing the API

### Using curl:

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

**Get current user (replace YOUR_TOKEN with the accessToken from login):**
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman or Insomnia:

1. Import the endpoints from `API_EXAMPLES.md`
2. Set the base URL: `http://localhost:3000/api/v1`
3. For authenticated endpoints, add header: `Authorization: Bearer YOUR_TOKEN`

## Gmail SMTP Setup

If using Gmail for email notifications:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate a new app password for "Mail"
3. Use this app password in your `.env` file as `SMTP_PASSWORD`

## Project Structure

```
src/
├── auth/           # Authentication endpoints (register, login, password reset)
├── users/          # User management (profile, update)
├── email/          # Email service for notifications
├── common/         # Shared guards, decorators, filters
├── config/         # Configuration files
├── app.module.ts   # Root module
└── main.ts         # Entry point
```

## Available Scripts

```bash
# Development
npm run start:dev      # Start with hot-reload

# Production
npm run build          # Build the project
npm run start:prod     # Run production build

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Generate coverage report
```

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check the `MONGODB_URI` in your `.env` file
- Verify network connectivity if using MongoDB Atlas

### Email Sending Fails
- Verify SMTP credentials in `.env`
- Check if 2FA and App Password are configured correctly
- Some email providers may block less secure apps

### Port Already in Use
- Change the `PORT` in `.env` to an available port
- Or stop the process using port 3000: `lsof -ti:3000 | xargs kill`

## Next Steps

1. ✅ Test all authentication endpoints
2. ✅ Verify email notifications are working
3. ✅ Review the code structure in `PROJECT_STRUCTURE.md`
4. ✅ Check API examples in `API_EXAMPLES.md`
5. 🚀 Start building JIRA-specific features:
   - Projects module
   - Issues/Tasks module
   - Sprints module
   - Boards module

## Documentation

- **README.md** - Project overview and features
- **API_EXAMPLES.md** - Detailed API endpoint examples
- **PROJECT_STRUCTURE.md** - Complete project structure documentation

## Support

For issues or questions:
1. Check the documentation files
2. Review the code comments
3. Ensure all environment variables are set correctly

---

**Congratulations!** 🎉 Your PM Tool API is now running!
