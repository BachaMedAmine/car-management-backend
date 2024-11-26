// src/services/mail.service.ts
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
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

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `https://z2kfnpzm-3000.euw.devtunnels.ms/reset-password?token=${token}`;
    const mailOptions = {
      from: 'Auth Service <medamine.bacha@esprit.tn>',
      to,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: 'Auth Service <your-email@example.com>',
      to,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${to}: ${otp}`);
    } catch (error) {
      console.error(`Failed to send OTP email to ${to}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }


  async sendSignupEmail(to: string, name: string): Promise<void> {
    const mailOptions = {
      from: 'OVA <mohamedaminebacha99@gmail.com>',
      to,
      subject: 'Welcome to OVA!',
      text: `Hello ${name},\n\nThank you for signing up for our app! We're excited to have you on board.`,
      html: `
        <p>Hello <b>${name}</b>,</p>
        <p>Thank you for signing up for OVA! We're excited to have you on board.</p>
        <p>If you have any questions, feel free to contact us at mohamedaminebacha99@gmail.com</p>
        <p>Best regards,</p>
        <p>Sidek Tej Rassek BECHA</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Signup email sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send signup email to ${to}:`, error);
      throw new Error('Failed to send signup email');
    }
  }


}