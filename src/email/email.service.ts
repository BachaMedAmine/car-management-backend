// src/email/email.service.ts

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Example for general-purpose email notifications
  async sendNotificationEmail(to: string, subject: string, message: string): Promise<void> {
    const mailOptions = {
      from: 'Notification Service <your-email@example.com>',
      to,
      subject,
      text: message,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Notification sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send notification email to ${to}:`, error);
      throw new Error('Failed to send notification email');
    }
  }
}