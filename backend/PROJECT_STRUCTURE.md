# PM Tool - Project Structure

## Overview
This is a production-ready NestJS authentication boilerplate designed for a JIRA-like project management tool.

## Directory Structure

```
pm-tool-api/
├── src/
│   ├── auth/                          # Authentication module
│   │   ├── dto/                       # Data Transfer Objects
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   ├── reset-password.dto.ts
│   │   │   ├── change-password.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   ├── strategies/                # Passport strategies
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts         # Auth endpoints
│   │   ├── auth.service.ts            # Auth business logic
│   │   └── auth.module.ts
│   │
│   ├── users/                         # User management module
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── schemas/
│   │   │   └── user.schema.ts         # Mongoose user schema
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── email/                         # Email service module
│   │   ├── email.service.ts           # Email templates & sending
│   │   └── email.module.ts
│   │
│   ├── common/                        # Shared resources
│   │   ├── decorators/                # Custom decorators
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/                    # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── filters/                   # Exception filters
│   │   │   └── all-exceptions.filter.ts
│   │   ├── interfaces/                # Shared interfaces
│   │   │   ├── jwt-payload.interface.ts
│   │   │   └── api-response.interface.ts
│   │   ├── validators/                # Custom validators
│   │   │   └── password.validator.ts
│   │   ├── enums/                     # Enumerations
│   │   │   └── user.enum.ts
│   │   └── utils/                     # Utility functions
│   │       └── response.util.ts
│   │
│   ├── config/                        # Configuration
│   │   ├── configuration.ts           # App configuration
│   │   ├── validation.ts              # Env validation schema
│   │   └── database.config.ts         # Database config
│   │
│   ├── app.module.ts                  # Root module
│   └── main.ts                        # Application entry point
│
├── .env.example                       # Environment variables template
├── .gitignore
├── .eslintrc.js                       # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── nest-cli.json                      # Nest CLI configuration
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript configuration
├── README.md                          # Project documentation
└── API_EXAMPLES.md                    # API usage examples
```

## Module Descriptions

### Auth Module
- **Purpose**: Handles all authentication-related operations
- **Endpoints**:
  - `POST /auth/register` - User registration
  - `POST /auth/login` - User login
  - `POST /auth/forgot-password` - Initiate password reset
  - `POST /auth/reset-password` - Complete password reset
  - `POST /auth/change-password` - Change password (authenticated)
  - `GET /auth/me` - Get current user info

### Users Module
- **Purpose**: Manages user profiles and data
- **Endpoints**:
  - `GET /users/profile` - Get user profile
  - `PATCH /users/profile` - Update user profile

### Email Module
- **Purpose**: Handles all email notifications
- **Features**:
  - Welcome emails
  - Password reset emails
  - Password change confirmations
  - HTML email templates

### Common Module
- **Purpose**: Shared utilities, guards, decorators, and interfaces
- **Components**:
  - JWT Authentication Guard
  - Role-based Authorization Guard
  - Custom decorators for current user and roles
  - Exception filters for error handling
  - Custom validators

## Key Features

### Security
- Password hashing with bcrypt (12 rounds)
- JWT token-based authentication
- Secure password reset flow with token expiration
- Rate limiting to prevent abuse
- Helmet for HTTP security headers
- Input validation with class-validator

### Database
- MongoDB with Mongoose ODM
- User schema with indexes
- Password hashing middleware
- Timestamps for all documents

### Email System
- Nodemailer integration
- HTML email templates
- Async email sending
- Error handling and logging

### Validation
- Class-validator for DTO validation
- Custom password strength validator
- Email format validation
- Whitelist and forbid non-whitelisted properties

## Future Enhancements (JIRA Features)

This boilerplate is designed to easily integrate:

1. **Projects Module**
   - Create/manage projects
   - Project roles and permissions
   - Project settings

2. **Issues/Tasks Module**
   - Create issues with types (Story, Bug, Task)
   - Assign to users
   - Status transitions
   - Priority levels

3. **Sprints Module**
   - Create and manage sprints
   - Sprint planning
   - Burndown charts

4. **Boards Module**
   - Kanban boards
   - Scrum boards
   - Drag-and-drop functionality

5. **Teams Module**
   - Team creation
   - Member management
   - Team permissions

6. **Comments Module**
   - Comment on issues
   - @mentions
   - Rich text support

7. **Activity Module**
   - Audit logs
   - Activity feeds
   - Notifications

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `SMTP_*` - Email server configuration
- `FRONTEND_URL` - Frontend application URL

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Start MongoDB
4. Run the application: `npm run start:dev`

## API Documentation

See [API_EXAMPLES.md](API_EXAMPLES.md) for detailed API usage examples with curl commands.
