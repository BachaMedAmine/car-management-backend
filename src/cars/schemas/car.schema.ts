////src/cars/schemas/car.schema.ts

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Car extends Document {
  @Prop({ required: true })
  make: string;

  @Prop({ required: true })
  carModel: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  mileage?: number;
 
  @Prop()
  imageUrl: string;


  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    owner: Types.ObjectId;
}
export const CarSchema = SchemaFactory.createForClass(Car);