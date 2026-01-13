import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Counter schema for generating atomic unique issue keys
 * Prevents race conditions in key generation
 */
@Schema()
export class Counter extends Document {
  @Prop({ required: true, unique: true })
  counterId: string; // Format: "issue_counter_<projectId>"

  @Prop({ required: true, default: 0 })
  sequence: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
