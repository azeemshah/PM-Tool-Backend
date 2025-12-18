import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { UserType } from 'src/enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  first_name: string;

  @Prop({ required: true, trim: true })
  last_name: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ trim: true })
  contact_number?: string;

  @Prop({
    type: String,
    enum: UserType,
    required: true,
    default: UserType.USER,
    index: true,
  })
  @IsEnum(UserType)
  user_type: UserType;



  @Prop({ default: true })
  is_active: boolean;


  @Prop({ type: String, default: null })
  avatar?: string | null;

  @Prop({ select: false })
  reset_password_token?: string;

  @Prop({ type: Date, select: false })
  reset_password_expires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
