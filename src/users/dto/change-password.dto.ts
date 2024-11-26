// src/users/dto/change-password.dto.ts
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;

  // Optionally, you can add a regex for password complexity
  @Matches(/^(?=.*[A-Za-z])[A-Za-z\d]{8,}$/, {
    message: 'Password must be at least 8 characters long and contain at least one letter and one number',
  })
  newPasswordComplexity?: string; // For more complex password rules
}