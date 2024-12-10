//src/cars/cars.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req,UseInterceptors, InternalServerErrorException,UploadedFile,BadRequestException } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';  // Import the CurrentUser decorator

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from '../utils/file-upload.utils';
import { Request } from 'express';
import * as path from 'path';
import { Car } from './schemas/car.schema';
import { Types } from 'mongoose';




@Controller('cars')
@UseGuards(JwtAuthGuard) // Require authentication for all routes
export class CarsController {
  constructor(private readonly carsService: CarsService) {}


  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Ensure only admins can access this route
@Get('owner/:id')
async getUserWithCars(@Param('id') id: string) {
  return this.carsService.getUserWithCars(id);
}


  // Get all cars (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // Only admins can access this route
  @Get('all')
  async getAllCars() {
    return this.carsService.findAllCars();
  }

  // Get car statistics (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // Ensure only admins can access this route
  @Get('statistics')
  async getCarStatistics() {
    return this.carsService.getCarStatistics();
  }

  // Get all cars statistics (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // Ensure only admins can access this route
  @Get('all-statistics')
  async getAllCarsStatistics() {
    return this.carsService.getAllCarsStatistics();
  }

  // Get a specific car by ID (authenticated users)
  @Get(':id')
  async getCarById(@Param('id') id: string) {
    return this.carsService.findCarById(id);
  }

  // Update a specific car (authenticated users)
  @Patch(':id')
  async updateCar(@Param('id') id: string, @Body() updateCarDto: UpdateCarDto) {
    return this.carsService.updateCar(id, updateCarDto);
  }

  // Delete a specific car (authenticated users)
  @Delete(':id')
  async deleteCar(@Param('id') id: string) {
    return this.carsService.deleteCar(id);
  }

 
@Post('upload-image')
@UseInterceptors(
    FileInterceptor('image', {
        storage: diskStorage({
            destination: './uploads',
            filename: editFileName,
        }),
        fileFilter: imageFileFilter,
    }),
)
async uploadCarImage(@UploadedFile() image: Express.Multer.File, @Req() req) {
  console.log('Request body:', req.body);
  console.log('Uploaded file:', image);
  console.log('Authorization user:', req.user); // Ensure this shows the JWT payload

  if (!image) {
      throw new BadRequestException('No image file uploaded');
  }

  const userId = req.user?.sub; // Extract `sub` instead of `userId`

  if (!userId) {
      throw new BadRequestException('User ID not found in the JWT payload');
  }

  try {
      const response = await this.carsService.processCarImage(image, userId);
      return response;
  } catch (error) {
      console.error('Error processing car image:', error.message);
      return {
          message: 'We encountered an issue while processing your image. Please try again later.',
      };
  }
}


@Post('owner')
async getCarsByOwner(@Req() req): Promise<Car[]> {
    console.log('JWT Payload:', req.user); // Debug the JWT payload
    const userId = req.user?.sub; // Extract user ID from JWT payload

    if (!userId) {
        throw new BadRequestException('User ID not found in token');
    }

    // Validate and convert userId to ObjectId
    if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
    }
    const objectId = new Types.ObjectId(userId);
    console.log('Converted userId to ObjectId:', objectId);

    return this.carsService.findCarsByOwner(objectId.toString());
}



}