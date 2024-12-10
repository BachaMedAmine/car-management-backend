import { Schema, Document } from 'mongoose';

export interface CarPart extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  partNumber: string;
  imageUrl?: string;
}

export const CarPartSchema = new Schema<CarPart>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String },
  partNumber: { type: String, unique: true, required: true },
  imageUrl: { type: String },
});