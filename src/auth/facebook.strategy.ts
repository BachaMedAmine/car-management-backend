import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { UsersService } from '../users/users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: 'http://localhost:3000/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email'], // Fields requested from Facebook
      passReqToCallback: true,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log('Facebook Profile:', profile); // Add for debugging purposes
    const user = await this.usersService.findOrCreateUser(profile);
    return user;
  }
}