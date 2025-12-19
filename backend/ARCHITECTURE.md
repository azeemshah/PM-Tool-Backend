# 🏗️ System Architecture

## Overview

This document provides a visual overview of the PM Tool API architecture.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │  │   Postman    │  │  Mobile App  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                   ┌─────────▼──────────┐
                   │   API Gateway      │
                   │   (NestJS)         │
                   │   Port 3000        │
                   └─────────┬──────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                   APPLICATION LAYER                              │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────┐    │
│  │               NestJS Application                         │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │            Middleware & Guards                     │  │    │
│  │  │  • Rate Limiter  • JWT Auth  • Validation        │  │    │
│  │  │  • CORS  • Helmet  • Compression                 │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │   Auth       │  │   Users      │  │   Email      │  │    │
│  │  │   Module     │  │   Module     │  │   Module     │  │    │
│  │  │              │  │              │  │              │  │    │
│  │  │ • Register   │  │ • Profile    │  │ • Welcome    │  │    │
│  │  │ • Login      │  │ • Update     │  │ • Reset Pwd  │  │    │
│  │  │ • Forgot Pwd │  │ • Get User   │  │ • Confirmed  │  │    │
│  │  │ • Reset Pwd  │  │              │  │              │  │    │
│  │  │ • Change Pwd │  │              │  │              │  │    │
│  │  │ • Get Me     │  │              │  │              │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │    │
│  │         │                  │                  │          │    │
│  └─────────┼──────────────────┼──────────────────┼──────────┘    │
│            │                  │                  │               │
└────────────┼──────────────────┼──────────────────┼───────────────┘
             │                  │                  │
             │                  │                  │
┌────────────┼──────────────────┼──────────────────┼───────────────┐
│       DATA LAYER              │                  │               │
│            │                  │                  │               │
│  ┌─────────▼──────────┐       │       ┌─────────▼──────────┐    │
│  │     MongoDB        │       │       │   SMTP Server      │    │
│  │   Port 27017       │       │       │   (Email)          │    │
│  │                    │       │       │                    │    │
│  │  • Users Collection│◄──────┘       │  • Gmail/Other     │    │
│  │  • Projects (TBD)  │               │                    │    │
│  │  • Issues (TBD)    │               └────────────────────┘    │
│  │  • Sprints (TBD)   │                                         │
│  └────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────┐                                              ┌──────────┐
│ Client  │                                              │   API    │
└────┬────┘                                              └────┬─────┘
     │                                                        │
     │  1. POST /auth/register                               │
     │  {email, password, firstName, lastName}               │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                           2. Validate Input            │
     │                           3. Hash Password             │
     │                           4. Save to MongoDB           │
     │                           5. Generate JWT Token        │
     │                           6. Send Welcome Email        │
     │                                                        │
     │  7. {accessToken, refreshToken, user}                 │
     │◄───────────────────────────────────────────────────────┤
     │                                                        │
     │  8. Store Token in Client                             │
     │                                                        │
     │  9. GET /auth/me                                      │
     │  Header: Authorization: Bearer {token}                │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                           10. Verify JWT Token         │
     │                           11. Extract User ID          │
     │                           12. Get User from DB         │
     │                                                        │
     │  13. {user profile data}                              │
     │◄───────────────────────────────────────────────────────┤
     │                                                        │
```

---

## 🔄 Password Reset Flow

```
┌─────────┐                                              ┌──────────┐
│ Client  │                                              │   API    │
└────┬────┘                                              └────┬─────┘
     │                                                        │
     │  1. POST /auth/forgot-password                        │
     │  {email}                                              │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                           2. Find User by Email        │
     │                           3. Generate Reset Token      │
     │                           4. Save Token to DB          │
     │                           5. Send Email with Link      │
     │                                                        │
     │  6. {message: "Email sent"}                           │
     │◄───────────────────────────────────────────────────────┤
     │                                                        │
     │  7. User receives email with reset link               │
     │                                                        │
     │  8. POST /auth/reset-password                         │
     │  {token, newPassword}                                 │
     ├──────────────────────────────────────────────────────►│
     │                                                        │
     │                           9. Verify Token             │
     │                           10. Check Expiration        │
     │                           11. Hash New Password       │
     │                           12. Update User in DB       │
     │                           13. Clear Reset Token       │
     │                           14. Send Confirmation Email │
     │                                                        │
     │  15. {message: "Password reset successful"}           │
     │◄───────────────────────────────────────────────────────┤
     │                                                        │
```

---

## 📊 Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Module                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Config Module                          │  │
│  │  • Environment Variables  • Validation  • Configuration   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │              │  │              │  │              │        │
│  │ Auth Module  │  │ Users Module │  │ Email Module │        │
│  │              │  │              │  │              │        │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │        │
│  │ │Controller│ │  │ │Controller│ │  │ │ Service  │ │        │
│  │ └────┬─────┘ │  │ └────┬─────┘ │  │ └────┬─────┘ │        │
│  │      │       │  │      │       │  │      │       │        │
│  │ ┌────▼─────┐ │  │ ┌────▼─────┐ │  │      │       │        │
│  │ │ Service  │ │  │ │ Service  │ │  │      │       │        │
│  │ └────┬─────┘ │  │ └────┬─────┘ │  │      │       │        │
│  │      │       │  │      │       │  │      │       │        │
│  │ ┌────▼─────┐ │  │ ┌────▼─────┐ │  │      │       │        │
│  │ │   DTOs   │ │  │ │   DTOs   │ │  │      │       │        │
│  │ └────┬─────┘ │  │ └────┬─────┘ │  │      │       │        │
│  │      │       │  │      │       │  │      │       │        │
│  │ ┌────▼─────┐ │  │ ┌────▼─────┐ │  │      │       │        │
│  │ │Strategy  │ │  │ │ Schema   │ │  │      │       │        │
│  │ └──────────┘ │  │ └──────────┘ │  │      │       │        │
│  │              │  │              │  │      │       │        │
│  └──────────────┘  └──────────────┘  └──────┴───────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Common Module                          │  │
│  │  • Guards  • Decorators  • Filters  • Interfaces         │  │
│  │  • Validators  • Enums  • Utils                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Database Module                          │  │
│  │  • MongoDB Connection  • Mongoose Configuration           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Incoming Request                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Rate Limiter   │ ◄── 10 req/60s per IP
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │   Helmet        │ ◄── Security Headers
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │   CORS          │ ◄── Origin Validation
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Validation     │ ◄── Input Validation
                  │  Pipe           │     (class-validator)
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  JWT Auth       │ ◄── Token Verification
                  │  Guard          │     (for protected routes)
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Roles Guard    │ ◄── Role-based Access
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Controller     │
                  │  Handler        │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Service        │
                  │  Business Logic │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Database       │
                  └─────────────────┘
```

---

## 📁 File Structure Diagram

```
PM-Tool/
│
├── 📦 Configuration Layer
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── nest-cli.json
│
├── 🐳 Deployment Layer
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.docker
│
├── 📚 Documentation Layer
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── API_EXAMPLES.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DOCKER.md
│   ├── OVERVIEW.md
│   └── SUMMARY.md
│
├── 🔧 Utilities Layer
│   ├── setup.sh
│   ├── verify-setup.sh
│   └── postman_collection.json
│
└── 💻 Application Layer (src/)
    │
    ├── 🎯 Core
    │   ├── main.ts
    │   └── app.module.ts
    │
    ├── 🔐 Authentication
    │   ├── Controllers
    │   ├── Services
    │   ├── DTOs
    │   ├── Strategies
    │   └── Module
    │
    ├── 👤 User Management
    │   ├── Controllers
    │   ├── Services
    │   ├── DTOs
    │   ├── Schemas
    │   └── Module
    │
    ├── 📧 Email Service
    │   ├── Service
    │   └── Module
    │
    ├── 🛠️ Common Utilities
    │   ├── Guards
    │   ├── Decorators
    │   ├── Filters
    │   ├── Interfaces
    │   ├── Validators
    │   ├── Enums
    │   └── Utils
    │
    └── ⚙️ Configuration
        ├── configuration.ts
        ├── validation.ts
        └── database.config.ts
```

---

## 🔄 Data Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ HTTP Request
     │
     ▼
┌────────────────┐
│   Controller   │ ◄── Routes & Endpoints
└────┬───────────┘
     │
     │ Call Service Method
     │
     ▼
┌────────────────┐
│    Service     │ ◄── Business Logic
└────┬───────────┘
     │
     ├──► Validate Data (DTOs)
     │
     ├──► Transform Data
     │
     ├──► Call Database
     │    │
     │    ▼
     │   ┌────────────────┐
     │   │    MongoDB     │ ◄── Data Storage
     │   └────────────────┘
     │
     ├──► Send Email (if needed)
     │    │
     │    ▼
     │   ┌────────────────┐
     │   │  Email Service │ ◄── Notifications
     │   └────────────────┘
     │
     │ Return Result
     │
     ▼
┌────────────────┐
│   Response     │ ◄── JSON Response
└────┬───────────┘
     │
     ▼
┌────────────────┐
│    Client      │
└────────────────┘
```

---

## 🎯 Future Architecture (JIRA Features)

```
Current Modules:
├── Auth Module ✅
├── Users Module ✅
└── Email Module ✅

Planned Modules:
├── Projects Module 🔜
│   ├── Create/Edit/Delete Projects
│   ├── Project Settings
│   └── Project Members
│
├── Issues Module 🔜
│   ├── Issue CRUD
│   ├── Issue Types (Story, Bug, Task)
│   ├── Status Workflow
│   └── Assignees
│
├── Sprints Module 🔜
│   ├── Sprint Management
│   ├── Sprint Planning
│   └── Burndown Charts
│
├── Boards Module 🔜
│   ├── Kanban Board
│   ├── Scrum Board
│   └── Custom Columns
│
├── Teams Module 🔜
│   ├── Team Creation
│   ├── Member Management
│   └── Permissions
│
├── Comments Module 🔜
│   ├── Comment CRUD
│   ├── @Mentions
│   └── Rich Text
│
└── Notifications Module 🔜
    ├── Real-time Notifications
    ├── Email Notifications
    └── In-app Notifications
```

---

## 🚀 Deployment Architecture

```
                     ┌─────────────┐
                     │   Client    │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │Load Balancer│
                     │  (nginx)    │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
         │  API    │   │  API    │   │  API    │
         │Instance1│   │Instance2│   │Instance3│
         └────┬────┘   └────┬────┘   └────┬────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
                     ┌──────▼──────┐
                     │  MongoDB    │
                     │  Cluster    │
                     └─────────────┘
```

---

*This architecture provides a scalable foundation for building a complete JIRA-like project management tool.*
