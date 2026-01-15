import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true })
export class Invitation {
  @Prop({ required: true })
  email: string;

  @Prop({ enum: ['ADMIN', 'MEMBER', 'VIEWER'], required: true })
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';

  @Prop({ unique: true, required: true })
  tokenHash: string;

  @Prop({
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true })
  invitedBy: string;

  @Prop({ required: true })
  workspaceId: string;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
