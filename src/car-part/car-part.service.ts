import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarPart } from './schema/car-part.schema';

@Injectable()
export class CarPartsService {
    constructor(@InjectModel('CarPart') private carPartModel: Model<CarPart>) {}
  async createCarPart(carPartDto: any): Promise<CarPart> {
    const newCarPart = new this.carPartModel(carPartDto);
    return newCarPart.save();
  }

  async getAllCarParts(): Promise<CarPart[]> {
    return this.carPartModel.find().exec();
  }

  async getCarPartById(id: string): Promise<CarPart> {
    const part = await this.carPartModel.findById(id).exec();
    if (!part) {
      throw new NotFoundException(`Car part with ID ${id} not found`);
    }
    return part;
  }

  async updateCarPart(id: string, carPartDto: any): Promise<CarPart> {
    const updatedPart = await this.carPartModel.findByIdAndUpdate(id, carPartDto, { new: true }).exec();
    if (!updatedPart) {
      throw new NotFoundException(`Car part with ID ${id} not found`);
    }
    return updatedPart;
  }

  async deleteCarPart(id: string): Promise<void> {
    const result = await this.carPartModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Car part with ID ${id} not found`);
    }
  }
}