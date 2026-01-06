import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberSchema } from './schemas/member.schema';
import { WorkspaceSchema } from '../workspace/schemas/workspace.schema';
import { UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'Workspace', schema: WorkspaceSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
