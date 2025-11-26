import nodemailer from 'nodemailer';
import { EMAIL_TEMPLATES } from '@/lib/constants';
import {
  generatePasswordResetEmail,
  generatePasswordResetSuccessEmail
} from '@/templates/email-templates';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${EMAIL_TEMPLATES.APP_NAME}" <${emailConfig.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send password reset code email
 */
export async function sendPasswordResetCode(
  email: string,
  resetCode: string,
  username: string
): Promise<boolean> {
  const html = generatePasswordResetEmail(resetCode, username);
  const text = `Your password reset code is: ${resetCode}. This code will expire in 60 seconds.`;

  return await sendEmail({
    to: email,
    subject: `🔐 Password Reset Code - ${EMAIL_TEMPLATES.APP_NAME}`,
    html,
    text,
  });
}

/**
 * Send password reset success email
 */
export async function sendPasswordResetSuccess(
  email: string,
  username: string
): Promise<boolean> {
  const html = generatePasswordResetSuccessEmail(username);

  return await sendEmail({
    to: email,
    subject: `✅ Password Reset Successful - ${EMAIL_TEMPLATES.APP_NAME}`,
    html,
  });
}