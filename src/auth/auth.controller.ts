import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { FacebookAuthGuard } from './facebook-auth.guard';
import { Request } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleSignUpRequestDto } from './dto/google-signup-request.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';


// Extend the Request interface to include user
interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('auth') // This defines the /auth base route
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  // User Signup
  @Post('signup')
  @UsePipes(new ValidationPipe())
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  // User Login
  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  // Refresh Token
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    const userId = await this.authService.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findUserById(userId);
    return this.authService.login(user); // Returns a new access_token
  }

  // Send OTP for password reset
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  // Verify OTP and reset password
  @Put('verify-otp')
  async verifyOtp(@Body('otp') otp: string) {
      // Verify the OTP
      const user = await this.authService.verifyOtp(otp);
      if (!user) {
          throw new BadRequestException('Invalid or expired OTP');
      }
  
      // Generate an access token with a consistent payload
      const payload = { sub: user._id.toString(), email: user.email, role: user.role };
      console.log(`Payload for token: ${JSON.stringify(payload)}`);
      
      const accessToken = this.jwtService.sign(payload);
      console.log(`Generated access token: ${accessToken}`);
  
      return {
          message: 'OTP verified successfully',
          accessToken,
      };
  }

  // Change Password
  @UseGuards(AuthGuard('jwt'))
  @Put('change-password')
  async changePassword(
    @Req() req: AuthRequest,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    const userId = req.user.userId;
    return await this.authService.changePassword(userId, currentPassword, newPassword);
  }

  @UseGuards(AuthGuard('jwt')) // Protect the route
@Post('reset-password')
async resetPassword(
  @Req() req: AuthRequest, // Extract user from the JWT
  @Body() body: { newPassword: string; confirmPassword: string },
) {
  const { newPassword, confirmPassword } = body;

  if (newPassword !== confirmPassword) {
    throw new BadRequestException('Passwords do not match');
  }

  const userId = req.user?.userId; // Correctly map `userId`
  if (!userId) {
    throw new UnauthorizedException('User ID not found in token');
  }

  await this.authService.resetUserPassword(userId, newPassword);

  // Generate a new access token
  const payload = {
    sub: userId,
    email: req.user.email,
    role: req.user.role,
  };
  console.log('Payload for new token:', payload);

  const newAccessToken = this.jwtService.sign(payload);

  return { message: 'Password reset successfully', accessToken: newAccessToken };
}


  // Google Login
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    // This route redirects to Google’s consent screen
  }

  @Post('google/token')
  async googleLoginWithToken(@Body('idToken') idToken: string) {
    const user = await this.authService.verifyGoogleToken(idToken);
    if (!user) {
      throw new UnauthorizedException('Invalid Google token');
    }
    return this.authService.login(user);
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleLoginCallback(@Req() req: AuthRequest) {
    const user = req.user;
    return this.authService.login(user);
  }

  // Google Signup
  @Post('google-signup')
  async googleSignup(@Body() googleSignUpDto: GoogleSignUpRequestDto) {
    const user = await this.authService.googleSignUp(googleSignUpDto);
    return {
      message: 'User registered successfully',
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    };
  }

  // Facebook Login
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookLogin() {
    // Initiates the Facebook OAuth flow
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookLoginRedirect(@Req() req: AuthRequest) {
    return this.authService.login(req.user);
  }


  
  @UseGuards(JwtAuthGuard)
@Put('profile')
async updateUserName(@Req() req, @Body('name') name: string) {
  const userId = req.user?.sub; // Use `sub` from the JWT payload
  console.log('Request User:', req.user); // Debug user

  if (!userId) {
    throw new Error('User ID not found in token');
  }

  return this.authService.updateUserName(userId, name);
}
    
 


}