// src/users.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
//import { EmailService } from '../email/email.service'; 
import { MailModule } from 'src/auth/mail/mail.module';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule), // Import AuthModule to get access to JwtService
  ],
  providers: [UsersService, /*EmailService*/],
  controllers: [UsersController],
  exports: [UsersService,MongooseModule],
})
export class UsersModule {}