//src/cars/dto/create-car.dto
import { IsString,IsOptional, IsNotEmpty,IsInt, Min, Max } from 'class-validator';

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  carModel: string;

  @IsInt()
  @Min(1886) // Year of the first car
  @Max(new Date().getFullYear())
  year: number;

  @IsString()
  @IsOptional()
  engine?: string;

  @IsInt()
  @Min(0)
  mileage: number;

  
  lastTimingChainReplacementDate: Date | null; // Add this property
  lastTimingChainReplacementMileage: number; // Add this property
  
}