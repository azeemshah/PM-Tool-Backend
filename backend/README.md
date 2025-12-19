# 🚀 Project Management Tool API

> A production-ready NestJS authentication boilerplate for building a JIRA-like project management tool

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

A complete, secure, and scalable authentication system that serves as the foundation for a JIRA-clone application with comprehensive user management and email notifications.

## Features

- 🔐 **Complete Authentication System**
  - User Registration with email verification
  - Login with JWT tokens
  - Forgot Password flow
  - Reset Password with secure tokens
  - Change Password (authenticated)
  - Update Profile

- 🛡️ **Security**
  - Password hashing with bcrypt
  - JWT token authentication
  - Rate limiting
  - Helmet security headers
  - Input validation with class-validator

- 📧 **Email Notifications**
  - Welcome emails on registration
  - Password reset emails
  - Password change confirmations

- 🏗️ **Architecture**
  - Modular structure
  - DTOs for validation
  - Guards and decorators
  - Error handling middleware
  - MongoDB with Mongoose

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your credentials
```

## Database Setup

Make sure MongoDB is running locally or update the `MONGODB_URI` in `.env`:

```bash
# Local MongoDB
mongodb://localhost:27017/pm-tool

# Or MongoDB Atlas
mongodb+srv://username:password@cluster.mongodb.net/pm-tool
```

## Running the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/change-password` - Change password (authenticated)
- `GET /api/v1/auth/me` - Get current user

### User Profile

- `PATCH /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/profile` - Get user profile

## Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
src/
├── auth/               # Authentication module
├── users/              # User management module
├── email/              # Email service
├── config/             # Configuration
├── common/             # Shared utilities
│   ├── decorators/     # Custom decorators
│   ├── guards/         # Auth guards
│   ├── filters/        # Exception filters
│   └── interfaces/     # Shared interfaces
└── main.ts             # Application entry point
```

## Future Enhancements

This boilerplate is designed to support JIRA-like features:
- Projects and Workspaces
- Issues/Tasks with statuses
- Sprints and Boards
- Team collaboration
- Comments and attachments
- Activity tracking

## License

MIT
