import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter; 
  private resend!: Resend;              

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (nodeEnv === 'production') {
      // Use Resend for production
      this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
      this.logger.log('✅ Email service initialized with Resend (Production)');
    } else {
      // Use Mailtrap for development/testing
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAILTRAP_HOST'),
        port: this.configService.get<number>('MAILTRAP_PORT'),
        auth: {
          user: this.configService.get<string>('MAILTRAP_USER'),
          pass: this.configService.get<string>('MAILTRAP_PASS'),
        },
      });
      this.logger.log('✅ Email service initialized with Mailtrap (Development)');
    }
  }

  async sendUserInvitation(email: string, name: string, inviteLink: string): Promise<void> {
    const subject = 'You\'ve been invited to join DonorFlow';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to DonorFlow!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>You've been invited to join our organization on DonorFlow - the complete fundraising platform for NGOs.</p>
              <p>Click the button below to set your password and get started:</p>
              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">Set My Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e2e8f0; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;">
                ${inviteLink}
              </p>
              <p><strong>Note:</strong> This invitation link will expire in 24 hours.</p>
              <p>If you didn't expect this invitation, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>Powered by DonorFlow | Secure Fundraising Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendPasswordReset(email: string, name: string, resetLink: string): Promise<void> {
    const subject = 'Reset Your DonorFlow Password';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password for your DonorFlow account.</p>
              <p>Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e2e8f0; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;">
                ${resetLink}
              </p>
              <p><strong>Note:</strong> This reset link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>Powered by DonorFlow | Secure Fundraising Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const fromEmail = this.configService.get<string>('MAIL_FROM') || 'mailtrap@demomailtrap.co';

    try {
      if (nodeEnv === 'production') {
        // Send via Resend
        await this.resend.emails.send({
          from: `DonorFlow <${fromEmail}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`✅ Email sent via Resend to ${to}`);
      } else {
        // Send via Mailtrap (development)
        await this.transporter.sendMail({
          from: `DonorFlow <${fromEmail}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`✅ Email sent via Mailtrap to ${to}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}