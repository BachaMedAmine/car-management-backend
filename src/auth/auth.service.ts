import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException,NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { MailService } from './mail/mail.service';
import { User } from 'src/users/schemas/user.schema';
import { ResetToken } from './schemas/reset-token.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { nanoid } from 'nanoid';
import { OAuth2Client } from 'google-auth-library';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleSignUpRequestDto } from './dto/google-signup-request.dto';
import { CarsService } from '../cars/cars.service';


@Injectable()
export class AuthService {
  private clientIds: string[];

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ResetToken.name) private resetTokenModel: Model<ResetToken>,
    private carsService: CarsService,
    private oauthClient: OAuth2Client,
    private usersService: UsersService,
    private mailService: MailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.clientIds = [
      this.configService.get<string>('GOOGLE_CLIENT_ID_WEB'),
      this.configService.get<string>('GOOGLE_CLIENT_ID_IOS'),
      this.configService.get<string>('GOOGLE_CLIENT_ID_ANDROID'),
    ];
  }

  // Validate User Credentials
  async validateUser(email: string, inputPassword: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(inputPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // Login Logic
  async login(user: any) {
    try {
        const payload = { email: user.email, sub: user._id.toString(), role: user.role };

        // Generate the access token
        const accessToken = this.jwtService.sign(payload);

        // Generate the refresh token
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION'),
        });

        // Hash the refresh token for storage
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateUserRefreshToken(user._id, hashedRefreshToken);

        // Fetch the user's cars (ensure `carsService` is properly injected in your AuthService)
        const userCars = await this.carsService.findCarsByOwner(user._id);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                email: user.email,
                name: user.name,
                cars: userCars || [], // Ensure it returns an empty array if no cars found
            },
        };
    } catch (error) {
        console.error('Error during login:', error.message);

        // Handle specific errors, e.g., cars fetching or token generation
        if (error.message.includes('some-specific-condition')) {
          throw new BadRequestException('Specific error occurred'); 
        }

        throw new InternalServerErrorException('Login failed');
    }
}

  // Google Token Verification
  async verifyGoogleToken(idToken: string): Promise<User> {
    const ticket = await this.oauthClient.verifyIdToken({
      idToken,
      audience: this.clientIds,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    let user = await this.usersService.findUserByEmail(payload.email);
    if (!user) {
      const createUserDto: CreateUserDto = {
        email: payload.email,
        name: payload.name || 'Google User',
        password: '',
        confirmPassword: '',
        role: 'user',
      };
      user = await this.usersService.createUser(createUserDto);
    }

    return user;
  }

  // Refresh Token Validation
  async verifyRefreshToken(refreshToken: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // User Signup
  async signup(createUserDto: CreateUserDto) {
    try {
        // Create the user
        const user = await this.usersService.createUser(createUserDto);

        // Send the signup email
        if (user && user.email) {
            try {
                await this.mailService.sendSignupEmail(user.email, user.name);
                console.log(`Signup confirmation email sent to ${user.email}`);
            } catch (emailError) {
                console.error(`Failed to send signup email to ${user.email}:`, emailError.message);
                // Optional: Decide whether to let the signup succeed even if email sending fails
            }
        }

        // Return the created user or a success message
        return {
            message: 'Signup successful! A confirmation email has been sent.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        };
    } catch (error) {
        console.error('Error in signup:', error.message);
        throw new InternalServerErrorException('Signup failed');
    }
}

  // Send OTP for Password Reset
  
  async sendOtp(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const now = new Date();

    // Check if an OTP is still valid
    if (user.otp && user.otpExpiresAt && now <= user.otpExpiresAt) {
        console.log(`Existing OTP is still valid: ${user.otp}`);
        return { message: 'A valid OTP has already been sent to your email' };
    }

    // Check the cooldown period for requesting a new OTP
    const cooldownPeriod = 60 * 1000; // 1 minute cooldown
    if (user.lastOtpSentAt && now.getTime() - user.lastOtpSentAt.getTime() < cooldownPeriod) {
        const timeRemaining = Math.ceil((cooldownPeriod - (now.getTime() - user.lastOtpSentAt.getTime())) / 1000);
        return { message: `Please wait ${timeRemaining} seconds before requesting another OTP.` };
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // OTP valid for 5 minutes

    // Update the user record atomically
    await this.userModel.updateOne(
        { email },
        {
            $set: {
                otp,
                otpExpiresAt,
                lastOtpSentAt: now,
            },
        }
    );

    // Fetch the updated user record to confirm changes
    const updatedUser = await this.usersService.findUserByEmail(email);
    console.log(`Saved OTP: ${updatedUser.otp} for email: ${email}`);

    // Send OTP via email
    try {
        await this.mailService.sendOtpEmail(user.email, otp);
        console.log(`OTP ${otp} sent to ${user.email}`);
    } catch (error) {
        console.error(`Failed to send OTP email to ${user.email}:`, error);
        throw new Error('Failed to send OTP email');
    }

    return { message: 'OTP sent to your email' };
}

  // Verify OTP and Reset Password
            async verifyOtp(otp: string): Promise<User> {
              // Find the user by OTP
              const user = await this.userModel.findOne({
                  otp,
                  otpExpiresAt: { $gte: new Date() }, // Ensure OTP is still valid
              }).exec();
              
              // Check if the user exists and OTP is valid
              if (!user) {
                  throw new BadRequestException('Invalid or expired OTP');
              }

              // Clear the OTP and its expiration after successful verification
              user.otp = null;
              user.otpExpiresAt = null;
              await user.save();

              console.log(`Valid OTP verified for user: ${user.email}`);
              return user; // Return the user object
          }


 
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear OTP fields (if applicable)
    user.otp = null;
    user.otpExpiresAt = null;

    // Save the updated user
    await user.save();

    console.log(`Password reset successfully for user: ${user.email}`);
  }

async getUserByLastOtp(): Promise<User> {
  // Retrieve the user with a valid OTP
  const user = await this.userModel.findOne({
    otp: { $ne: null }, // Ensure the OTP exists
    otpExpiresAt: { $gte: new Date() }, // Ensure the OTP is still valid
  }).exec();

  if (!user) {
    console.error("Invalid or expired OTP: No matching user found");
    throw new BadRequestException('Invalid or expired OTP');
  }

  return user;
}




  // Change Password
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: 'Password changed successfully' };
  }

  // Google Sign-Up
  async googleSignUp(request: GoogleSignUpRequestDto) {
    const { idToken } = request;

    const payload = await this.verifyGoogleToken(idToken);
    const { email, name } = payload;

    let user = await this.usersService.findUserByEmail(email);
    if (!user) {
      const createUserDto: CreateUserDto = {
        email,
        name,
        password: '',
        confirmPassword: '',
        role: 'user',
      };
      user = await this.usersService.createUser(createUserDto);
    }

    const accessToken = this.jwtService.sign({ sub: user._id, email: user.email });
    const refreshToken = this.jwtService.sign(
      { sub: user._id, email: user.email },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      refreshToken,
    };
  }


  async updateUserName(userId: string, newName: string): Promise<{ message: string }> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    user.name = newName;
    await user.save();
  
    return { message: 'User name updated successfully' };
  }

}