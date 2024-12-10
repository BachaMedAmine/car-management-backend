// src/users.controller.ts

import { Body, Controller,Put,Req, Post,Delete,Patch, Get,Param, UsePipes, UseGuards, ValidationPipe, NotFoundException, InternalServerErrorException,BadRequestException ,UnauthorizedException  } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Ensure the path is correct
import * as bcrypt from 'bcrypt';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDto } from './dto/change-password.dto';


//mport { EmailService } from '../email/email.service';





@Controller('users')
export class UsersController 
{
  constructor(
    private readonly usersService: UsersService,
   // private readonly emailService: EmailService
  ) {}



  // Public Registration Route (No Guards)
  @Post('register')
  @UsePipes(new ValidationPipe()) // Apply validation pipe to enforce DTO validation
  async register(@Body() createUserDto: CreateUserDto) {
    // Force the role to 'user' for public registration
    createUserDto.role = 'user';
    return this.usersService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-dashboard')
async adminDashboard() {
  return { message: 'Welcome to the Admin Dashboard' };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Only admins can access this route
@Post('register-admin')
async registerAdmin(@Body() createUserDto: CreateUserDto) {
  // Ensure that the role is explicitly set to 'admin'
  if (createUserDto.role !== 'admin') {
    throw new BadRequestException('Only admins can register other admins');
  }
  return this.usersService.createUser(createUserDto);
}

  // Admin-Only Route (Protected by JwtAuthGuard and RolesGuard)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  getAdminData() {
    return { message: 'Admin-only data' };
  }

  // User and Admin Route (Protected by JwtAuthGuard and RolesGuard)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @Get('profile')
    getProfile() {
      return { message: 'User profile data' };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin') // Only admins can access this route
    @Get('all')
    async getAllUsers() {
      return this.usersService.findAllUsers();
    }


    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'user')
    async getUserById(@Param('id') id: string) {
      return this.usersService.findUserById(id);
          }


      @Patch(':id')
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles('admin', 'user')
        async updateUser(
        @Param('id') id: string,
      @Body() updateUserDto: UpdateUserDto
      ){
          return this.usersService.updateUser(id, updateUserDto);
      }


        @Delete(':id')
        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('admin')
        async deleteUser(@Param('id') id: string) {
          return this.usersService.deleteUser(id);
        }

  
        @UseGuards(AuthGuard('jwt')) // Ensures the user is authenticated
        @Put('profile')
        async updateUserName(@Req() req, @Body('name') name: string) {
            try {
                const userId = req.user.id;
                console.log('Updating user with ID:', userId);
                return await this.usersService.updateUserName(userId, name);
            } catch (error) {
                if (error instanceof NotFoundException) {
                    console.error('Error: User not found:', error.message);
                }
                throw error; // Rethrow the error for the framework to handle
            }
        }


        @Put('change-password')
        @UseGuards(JwtAuthGuard)
        async changePassword(
          @Req() req,
          @Body() changePasswordDto: ChangePasswordDto,
        ): Promise<any> {
          const userId = req.user.sub; // Extract user ID from JWT payload

          // Validate userId format
          if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            throw new BadRequestException('Invalid user ID');
          }

          // Validate that newPassword matches confirmNewPassword
          if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
            throw new BadRequestException('New password and confirm new password do not match');
          }

          return this.usersService.changePassword(userId, changePasswordDto);
        }

}