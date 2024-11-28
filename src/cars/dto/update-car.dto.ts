//src/cars/dto/update-car.dto.ts
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateCarDto {
  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  carModel?: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  engine?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;
}