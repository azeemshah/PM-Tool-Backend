import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Attachment extends Document {

    @Prop({ type: Types.ObjectId, ref: 'WorkItem' })
    workItemId: Types.ObjectId;

    @Prop({ required: true })
    filename: string;

    @Prop({ required: true})
    fileUrl: string;

    @Prop({ type: Types.ObjectId, ref: 'User'})
    uploadedBy: Types.ObjectId;

    @Prop({ default: 1 })
    version: number;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);