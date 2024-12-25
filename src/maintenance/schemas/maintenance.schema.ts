import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Maintenance extends Document {


  @Prop({ required: true })
  carId: string; // The car this maintenance task belongs to

  @Prop({ required: true })
  task: string; // e.g., "Oil Change", "Tire Replacement"

  @Prop({ required: false, default: null })
  dueDate?: Date; // When the task is due

  @Prop({ default: 'Pending' })
  status: string; // Task status: "Pending", "Completed"

  @Prop({ default: false })
  completed: boolean;

  @Prop({ required: false, default: null })
  nextMileage?: number;

  @Prop()
  comments?: string; // Optional notes or remarks
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);