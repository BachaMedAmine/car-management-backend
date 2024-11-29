////src/cars/schemas/car.schema.ts

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Car extends Document {
  @Prop()
  make: string;

  @Prop()
  carModel: string;

  @Prop()
  year: number;

  @Prop()
  engine: string;

  @Prop()
  mileage?: number;

 
  @Prop()
  imageUrl: string;


  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    owner: Types.ObjectId;
}
export const CarSchema = SchemaFactory.createForClass(Car);