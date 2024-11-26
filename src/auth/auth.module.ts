// src/auth/auth.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './roles.guard';
import { GoogleStrategy } from './google.strategy';
import { FacebookStrategy } from './facebook.strategy';
import { EmailModule } from '../email/email.module';
import { EmailService } from 'src/email/email.service';
import { MailService } from './mail/mail.service';
import { ResetToken, ResetTokenSchema } from './schemas/reset-token.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from './mail/mail.module'; 
import { OAuth2Client } from 'google-auth-library';
import { CarsModule } from '../cars/cars.module'; // Adjusted for forwardRef
import { UsersService } from '../users/users.service';






// Provide OAuth2Client configuration
// src/auth/auth.module.ts

const GoogleOAuth2ClientProvider = {
  provide: OAuth2Client,
  useFactory: (configService: ConfigService) => {
    return new OAuth2Client();
  },
  inject: [ConfigService],
};



@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule,AuthModule,UsersModule,EmailModule,MailModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') }, // corrected expiration line
      }),
    }),
    MongooseModule.forFeature([{ name: ResetToken.name, schema: ResetTokenSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => CarsModule),
    MailModule,
  ],
  providers: [AuthController,
    AuthService, 
    JwtStrategy,RolesGuard,
    GoogleStrategy,
    FacebookStrategy,EmailService,
    MailService,
    GoogleOAuth2ClientProvider],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}