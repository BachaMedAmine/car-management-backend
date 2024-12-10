// src/users/dto/create-user.dto.ts

import { IsEmail, IsNotEmpty, IsIn,MinLength, IsObject, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail() // Validates that email is in correct format
  email: string;

  @IsNotEmpty()
  @MinLength(6) // Ensures the password is at least 6 characters
  password: string;

  @IsNotEmpty() // Ensures the name is not empty
  name: string;

  @IsOptional()
  @IsIn(['user', 'admin']) // Ensure role is either user or admin
  role?: string;

  @IsOptional() // This makes confirmPassword optional
  confirmPassword?: string;
  
  @IsOptional()
  @IsObject() // Validates that this is an object
  emailCredentials?: {
    email: string;
    password: string;
  };
  
  @IsOptional() // Makes profilePicture optional
  profilePicture?: string; 
}