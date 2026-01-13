import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { KanbanModule } from './kanban/kanban.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { MemberModule } from './member/member.module';
<<<<<<< HEAD
import { ItemModule } from './work-items/work-item.module';
=======
import { IssueModule } from './issue/issue.module';
>>>>>>> 5a1ba7f7caf7d116fb66218cd4b71a32f91f788b

@Module({
  imports: [
    // Configuration
    MongooseModule.forRoot('mongodb://localhost:27017/pm_tool2'),
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
    KanbanModule,
    WorkspaceModule,
    MemberModule,
<<<<<<< HEAD
    EmailModule,
    ItemModule,
    // ProjectsModule,
    // IssueModule,
    // SprintModule,
    // TimeLogModule,
    // UsersModule,
    AuthModule,
=======
    IssueModule,
>>>>>>> 5a1ba7f7caf7d116fb66218cd4b71a32f91f788b
  ],
})
export class AppModule {}
