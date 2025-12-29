import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true})
export class ProjectRole extends Document {

    @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
    projectId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    role: string; // Admin | Member | Viewer
}

export const ProjectRoleSchema = SchemaFactory.createForClass(ProjectRole);