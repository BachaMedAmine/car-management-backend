// src/auth/dto/reset-password.dto.ts

import { IsString, MinLength,IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  newPassword: string;

  
}