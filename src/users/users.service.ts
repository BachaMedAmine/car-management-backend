// src/users.service.ts

import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';


@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name, role = 'user', emailCredentials, confirmPassword } = createUserDto;

    // Check if the user already exists
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Ensure password and confirmPassword match
    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Define newUser object based on optional emailCredentials
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      name,
      role,
      refreshTokens: [],
      emailCredentials: emailCredentials ? emailCredentials : undefined,
    });

    return newUser.save();
  }


  async findUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Searching for user with normalized email:', normalizedEmail); // Log email parameter
    const user = await this.userModel.findOne({ email }).exec();
    console.log('User found:', user); // Log the result
    return user;
  }




  async updateUserRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.userModel.updateOne(
      { _id: userId },
      {
        $push: {
          refreshTokens: {
            $each: [hashedRefreshToken],
            $slice: -5, // Store only the last 5 refresh tokens
          },
        },
      },
    ).exec();
  }

  async findUserByRefreshToken(refreshToken: string): Promise<User | undefined> {
    const users = await this.userModel.find().exec();

    for (const user of users) {
      // Convert to plain JavaScript object if necessary to access refreshTokens as an array
      const refreshTokens = user.toObject().refreshTokens as string[];

      for (const storedToken of refreshTokens) {
        const isMatch = await bcrypt.compare(refreshToken, storedToken);
        if (isMatch) {
          return user; // Return the user if a match is found
        }
      }
    }
    return undefined; // Return undefined if no match is found
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }


  async findUserById(id: string): Promise<User | null> {
    console.log(`Looking for user with ID: ${id}`); // Debug log
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      console.error(`User not found with ID: ${id}`); // Debug log
      return null;
    }
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<any> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updateUserName(userId: string, newName: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.name = newName;
    await user.save();

    return { message: 'User name updated successfully' };
  }


async updateUserPassword(userId: string, newPassword: string) {
  console.log(`Updating password for user with ID: ${userId}`);

  const user = await this.userModel.findById(userId);
  if (!user) {
    console.error(`User with ID ${userId} not found`);
    throw new NotFoundException('User not found');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  console.log(`Password updated successfully for user: ${user.email}`);
}

  async findOrCreateUser(profile: any) {
    const email = profile.emails[0].value;
    const name = profile.displayName;

    // Check if the user already exists
    let user = await this.findUserByEmail(email);
    if (!user) {
      // If user doesn't exist, create a new one with a placeholder password
      const newUser: CreateUserDto = {
        email,
        name,
        password: '', // Leave main password empty as it's handled by Google
        confirmPassword: '', // Placeholder for confirmPassword
        role: 'user', // Default role if required
        emailCredentials: { email, password: 'OAuthPlaceholder' },
      };
      user = await this.createUser(newUser);
    }

    return user;
  }
  async findById(userId: string) {
    return this.userModel.findById(userId);
  }

  async updatePassword(userId: string, newPassword: string) {
    return this.userModel.findByIdAndUpdate(userId, { password: newPassword });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<any> {
    const { oldPassword, newPassword } = changePasswordDto;
  
    // Fetch the user by ID
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Check if the old password matches
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }
  
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();
  
    return { message: 'Password updated successfully' };
  }

  

}