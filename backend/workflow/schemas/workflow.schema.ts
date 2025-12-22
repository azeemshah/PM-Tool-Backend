import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Workflow extends Document {

    @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
    projectID: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({
        type: [
            {
                name: String,
                order: Number,
                allowedRoles: [String],
            },
        ],
    })
    statuses: {
        name: string;
        order: number;
        allowedRoles: string[];
    }[];
    }

    export const WorkflowSchema = SchemaFactory.createForClass(Workflow);