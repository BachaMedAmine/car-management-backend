import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Maintenance, MaintenanceSchema } from './schemas/maintenance.schema';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { CarsModule } from '../cars/cars.module'; // To interact with car data

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Maintenance.name, schema: MaintenanceSchema }]),
    CarsModule, // Use CarsService to fetch car details
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}