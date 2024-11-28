import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
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
        try {
            console.log('Uploading image to Google AI...');

            const uploadResult = await this.fileManager.uploadFile(
                path.join(__dirname, '../..', 'uploads', image.filename),
                {
                    mimeType: "image/jpeg",
                    displayName: "car image",
                },
            );

            const schema = {
                type: SchemaType.OBJECT,
                properties: {
                    brand: { type: SchemaType.STRING, nullable: false },
                    model: { type: SchemaType.STRING, nullable: false },
                    year: { type: SchemaType.STRING, nullable: false },
                    engine: { type: SchemaType.STRING, nullable: false },
                },
                required: ["brand", "model", "year", "engine"],
            };

            const model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            console.log('Processing image with Google AI...');
            const result = await model.generateContent([
                "return the brand of the car and the full model of the car and the engine",
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

                try {
                    const parsedResponse = JSON.parse(responseText);

                    // Validate AI response fields
                    if (!parsedResponse.brand || !parsedResponse.model || !parsedResponse.year || !parsedResponse.engine) {
                        console.error('AI response missing required fields:', parsedResponse);
                        throw new Error('AI response is incomplete.');
                    }

                    // Normalize data (e.g., extract the first year from ranges)
                    parsedResponse.year = parsedResponse.year.split('-')[0];

                    return parsedResponse;
                } catch (parseError) {
                    console.error('Failed to parse AI response:', responseText);
                    throw new Error('Invalid JSON structure from AI response.');
                }
            } else {
                throw new Error('Invalid response structure from AI model.');
            }
        } catch (error) {
            console.error('Failed to process car image:', error.message);
            throw new BadRequestException('Failed to process car image');
        }
    }
}