//src/email/email.module.ts

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { UsersModule } from '../users/users.module'; // Adjust the path if necessary

@Module({
  imports: [UsersModule], // Import UsersModule to use UsersService
  providers: [EmailService],
  exports: [EmailService], // Export EmailService for use in other modules
})
export class EmailModule {}