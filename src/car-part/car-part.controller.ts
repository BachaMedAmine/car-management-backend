import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CarPartsService } from './car-part.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('car-parts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarPartsController {
  constructor(private readonly carPartsService: CarPartsService) {}

  @Roles('admin')
  @Post()
  async createCarPart(@Body() carPartDto: any) {
    return this.carPartsService.createCarPart(carPartDto);
  }

  @Get()
  async getAllCarParts() {
    return this.carPartsService.getAllCarParts();
  }

  @Get(':id')
  async getCarPartById(@Param('id') id: string) {
    return this.carPartsService.getCarPartById(id);
  }

  @Roles('admin')
  @Patch(':id')
  async updateCarPart(@Param('id') id: string, @Body() carPartDto: any) {
    return this.carPartsService.updateCarPart(id, carPartDto);
  }

  @Roles('admin')
  @Delete(':id')
  async deleteCarPart(@Param('id') id: string) {
    return this.carPartsService.deleteCarPart(id);
  }
}