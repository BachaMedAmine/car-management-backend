//src/cars/cars.service.ts

import { Injectable, NotFoundException,BadRequestException ,InternalServerErrorException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Car } from './schemas/car.schema';
import { CreateCarDto } from 'src/cars/dto/create-car.dto';
import { UpdateCarDto } from 'src/cars/dto/update-car.dto';
import * as fs from 'fs';
import * as path from 'path';
import { AiService } from 'src/ai/ai.service';


@Injectable()
export class CarsService {
  constructor(@InjectModel(Car.name) private carModel: Model<Car>,
  private readonly aiService: AiService,) {}

  async processCarImage(file: Express.Multer.File, userId: string) {
    try {
        console.log('Processing image for user:', userId);
        console.log('Uploaded file details:', file);

        // Send the image to AI service for processing
        const carDetails = await this.aiService.processImage(file);
        console.log('AI response:', carDetails);

        // Validate AI response
        if (!carDetails.brand || !carDetails.model || !carDetails.year) {
            console.error('Invalid AI response:', carDetails);
            throw new Error('AI response is missing required fields (brand, model, year)');
        }

        // Set a default mileage if not provided
        const mileage = carDetails.mileage || 0;
        const imageUrl = `http://127.0.0.1:3000/uploads/${file.filename}`;// Create the new car document

        const newCar = new this.carModel({

            make: carDetails.brand,
            carModel: carDetails.model,
            year: parseInt(carDetails.year, 10),
            mileage: mileage,
            imageUrl,
            owner: userId, // Pass the owner (userId)
            engine: carDetails.engine !== 'null' ? carDetails.engine : null,
        });

        console.log('Saving car to database:', newCar);
        await newCar.save();
        return { message: 'Car details saved successfully', car: newCar };
    } catch (error) {
        console.error('Failed to process car image:', error.message);
        throw new BadRequestException('Failed to process car image');
    }
}

 


  // Create a car
  async createCar(createCarDto: CreateCarDto, ownerId: string): Promise<Car> {
    const newCar = new this.carModel({ ...createCarDto, owner: ownerId });
    return newCar.save();
  }

  // Get all cars (admin only)
  async findAllCars(): Promise<Car[]> {
    return this.carModel.find().exec(); // Fetch all cars
  }

  // Get a specific car by ID
  async findCarById(id: string): Promise<Car> {
    const car = await this.carModel.findById(id).exec();
    if (!car) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
    return car;
  }

  async getCarById(carId: string): Promise<Car> {
    return this.carModel.findById(carId).exec();
  }

  // Update a specific car
  async updateCar(id: string, updateCarDto: UpdateCarDto): Promise<Car> {
    return this.carModel.findByIdAndUpdate(id, updateCarDto, { new: true }).exec();
  }

  // Delete a specific car
  async deleteCar(id: string): Promise<any> {
    const result = await this.carModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Car with ID ${id} not found`);
    }
    return result;
  }


  async findCarsByOwner(ownerId: string) {
    const cars = await this.carModel.find({ owner: new Types.ObjectId(ownerId) });
    return cars;
  }
  // Additional method to help diagnose the issue
  async debugOwnerQuery(ownerId: string): Promise<any> {
    try {
      // Convert to ObjectId
      const ownerObjectId = new Types.ObjectId(ownerId);

      // Perform a raw query to get more information
      const rawResult = await this.carModel.collection.find({ 
        owner: ownerObjectId 
      }).toArray();

      console.log('Raw query result:', rawResult);

      return rawResult;
    } catch (error) {
      console.error('Debug query error:', error);
      throw error;
    }
  }
    
  async getCarStatistics(): Promise<{ make: string; count: number }[]> {
    try {
      return await this.carModel.aggregate([
        {
          $group: {
            _id: '$make', // Group by the `make` field
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            make: '$_id', // Rename `_id` to `make`
            count: 1,
          },
        },
      ]);
    } catch (error) {
      console.error('Error during aggregation:', error);
      throw new InternalServerErrorException('Failed to fetch car statistics');
    }
  }


  async getAllCarsStatistics(): Promise<{ totalCars: number }> {
    try {
      // Count the total number of cars in the database
      const totalCars = await this.carModel.countDocuments();
  
      return { totalCars };
    } catch (error) {
      console.error('Error fetching total cars count:', error.message);
      throw new InternalServerErrorException('Failed to fetch total cars count');
    }
  }
  async getUserWithCars(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
  
    const cars = await this.carModel.find({ owner: userId }).populate('owner').exec();
  
    if (!cars || cars.length === 0) {
      throw new NotFoundException(`No cars found for user with ID ${userId}`);
    }
  
    return {
      userId,
      cars,
    };
  }
}