// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { CarsModule } from './cars/cars.module';
import { EmailModule } from './email/email.module';
import { PassportModule } from '@nestjs/passport';
import { AiModule } from './ai/ai.module';
import { AiService } from './ai/ai.service';
import { AiController } from './ai/ai.controller';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { CarPartsModule } from './car-part/car-part.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables
    MongooseModule.forRoot(process.env.MONGODB_URI), // Connect to MongoDB
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register Passport with default strategy
    AuthModule, // Import AuthModule for authentication features
    UsersModule, // Import UsersModule for user management
    CarsModule, // Import CarsModule for car-related features
    EmailModule,
    AiModule,
    MaintenanceModule,
    CarPartsModule, // Import EmailModule for email services
  ],
})
export class AppModule {}