import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty({ message: 'OTP is required' })
    otp: string;

}