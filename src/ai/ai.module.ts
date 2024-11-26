// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService,], // Export AiService to be used in other modules
})
export class AiModule {}