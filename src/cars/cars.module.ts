//src/cars/cars.module.ts

import { Module ,forwardRef} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';
import { Car, CarSchema } from 'src/cars/schemas/car.schema';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: 
  [
  MongooseModule.forFeature([{ name: Car.name, schema: CarSchema }]),
  forwardRef(() => AuthModule),
  AiModule, 
  ],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}