import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { Tag, TagSchema } from './schemas/tag.schema';
import { MemberModule } from '../../member/member.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }]),
    MemberModule,
  ],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService], // Export TagService for use in other modules
})
export class TagModule {}
