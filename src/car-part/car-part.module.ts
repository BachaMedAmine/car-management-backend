import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarPartsService } from './car-part.service';
import { CarPartsController } from './car-part.controller';
import { CarPartSchema } from './schema/car-part.schema';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [MongooseModule.forFeature([{ name: 'CarPart', schema: CarPartSchema }]),
  AuthModule,
],
  
  controllers: [CarPartsController],
  providers: [CarPartsService],
})
export class CarPartsModule {}