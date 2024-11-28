// src/users/dto/change-password.dto.ts

import { IsString, IsNotEmpty, Matches, ValidateIf } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@._-]{8,}$/, {
    message:
      'Password must be at least 8 characters long, contain at least one letter and one number, and can include special characters (@, ., _, -).',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password' })
  confirmNewPassword: string;

  @ValidateIf((o) => o.newPassword !== o.confirmNewPassword)
  validatePasswords() {
    if (this.newPassword !== this.confirmNewPassword) {
      throw new Error('New password and confirm new password do not match');
    }
  }
}