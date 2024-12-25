import { IsOptional, IsNumber, IsString, IsISO8601 } from 'class-validator';

export class UpdateTaskDto {
 

  @IsOptional()
  @IsString()
  status?: string;


  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsNumber()
  nextMileage?: number;
}