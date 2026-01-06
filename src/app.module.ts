import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { KanbanModule } from './kanban/kanban.module';
import { ProjectManagementModule } from './project-management/project-management.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { MemberModule } from './member/member.module';

@Module({
  imports: [
    // Configuration
    MongooseModule.forRoot('mongodb://localhost:27017/pm_tool'),
    ProjectManagementModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL') || 60,
          limit: configService.get('THROTTLE_LIMIT') || 10,
        },
      ],
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    EmailModule,
    DashboardModule,
    KanbanModule,
    WorkspaceModule,
    MemberModule,
    // ProjectsModule,
    // IssueModule,
    // SprintModule,
    // TimeLogModule,
    // UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
