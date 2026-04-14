import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailQueue, EmailQueueSchema } from './schemas/email-queue.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: EmailQueue.name, schema: EmailQueueSchema }])],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
