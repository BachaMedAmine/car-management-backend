// src/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;
  @Prop()
  lastOtpSentAt?: Date; // Add this field
  @Prop({ required: true })
  name: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[];

  @Prop({ required: false }) // For OTP
  otp?: string;

  @Prop({ required: false }) // For OTP expiration
  otpExpiresAt?: Date;


  @Prop({
    type: { 
      email: { type: String, required: true }, 
      password: { type: String, required: true } 
    },
    required: false,
  })
  // In your User schema file
emailCredentials?: {
  email: { type: String, required: true },
  password: { type: String, required: false }, 
};

@Prop()
profilePicture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);