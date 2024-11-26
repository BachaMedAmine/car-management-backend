import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as path from 'path';

@Injectable()
export class AiService {
  private fileManager: GoogleAIFileManager;
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY);
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }

  async processImage(image: Express.Multer.File) {
    const maxRetries = 5; // Retry up to 5 times
    let retryCount = 0;
    const retryDelay = (attempt) => 1000 * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s, ...

    while (retryCount < maxRetries) {
      try {
        console.log(`Processing image with Google AI (Attempt ${retryCount + 1}/${maxRetries})`);

        // Upload the image to Google AI
        const uploadResult = await this.fileManager.uploadFile(
          path.join(__dirname, '../..', 'uploads', image.filename),
          {
            mimeType: 'image/jpeg',
            displayName: 'car image',
          },
        );

        const schema = {
          type: SchemaType.OBJECT,
          properties: {
            brand: { type: SchemaType.STRING, nullable: false },
            model: { type: SchemaType.STRING, nullable: false },
            year: { type: SchemaType.STRING, nullable: false },
            engine: { type: SchemaType.STRING, nullable: true },
          },
          required: ['brand', 'model', 'year','engine'],
        };

        // Use the Generative AI model
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        const result = await model.generateContent([
          'return the brand of the car and the full model of the car',
          {
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: uploadResult.file.mimeType,
            },
          },
        ]);

        console.log('AI Response:', result.response);

        if (result.response && typeof result.response.text === 'function') {
          const responseText = await result.response.text();
          return JSON.parse(responseText);
        } else {
          throw new Error('Invalid AI response structure.');
        }
      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed: ${error.message}`);

        if (retryCount < maxRetries && error.status === 503) {
          console.log('AI service overloaded. Retrying...');
          await new Promise((resolve) => setTimeout(resolve, retryDelay(retryCount)));
        } else {
          console.error('Failed to process car image:', error.message);
          throw new BadRequestException('Failed to process car image');
        }
      }
    }

    throw new BadRequestException('AI service is temporarily unavailable. Please try again later.');
  }
}