import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberSchema } from './schemas/member.schema';
import { WorkspaceSchema } from '../workspace/schemas/workspace.schema';
import { UserSchema } from '../users/schemas/user.schema';
import { InvitationSchema } from './schemas/invitation.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'Workspace', schema: WorkspaceSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Invitation', schema: InvitationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
