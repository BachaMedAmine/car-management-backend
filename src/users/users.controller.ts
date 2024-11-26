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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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

}