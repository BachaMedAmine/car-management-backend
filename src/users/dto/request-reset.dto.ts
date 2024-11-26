// src/users/dto/request-reset.dto.ts
import { IsEmail } from 'class-validator';

export class RequestResetDto {
  @IsEmail()
  email: string;
}