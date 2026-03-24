import { EMAIL_TEMPLATES } from '@/lib/constants';

/**
 * Generate password reset email HTML template
 */
export function generatePasswordResetEmail(resetCode: string, username: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your password - ${EMAIL_TEMPLATES.APP_NAME}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5; 
          color: #1c1e21; 
          background-color: #f0f2f5;
          padding: 20px 0;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
          color: white; 
          padding: 0;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-radius: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 60%),
            linear-gradient(45deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.02) 100%);
          pointer-events: none;
        }
        .header-content {
          padding: 50px 32px 40px 32px;
          position: relative;
          z-index: 2;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
          position: relative;
        }
        .logo-img {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 6px 20px rgba(0, 0, 0, 0.2),
            inset 0 2px 4px rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          border: 3px solid rgba(255, 255, 255, 0.2);
        }
        .logo-text { 
          font-size: 48px; 
          font-weight: 800; 
          letter-spacing: -1px;
          text-shadow: 
            0 6px 12px rgba(0, 0, 0, 0.4),
            0 3px 6px rgba(0, 0, 0, 0.3);
          background: linear-gradient(135deg, #ffffff 0%, #f1f3f4 50%, #e8eaed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
        }
        .header-subtitle {
          font-size: 22px;
          opacity: 0.9;
          font-weight: 500;
          text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
          position: relative;
          margin-top: 16px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .header-decoration {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, 
            rgba(255,255,255,0.2) 0%, 
            rgba(255,255,255,0.1) 25%, 
            rgba(255,255,255,0.15) 50%, 
            rgba(255,255,255,0.1) 75%, 
            rgba(255,255,255,0.2) 100%);
        }
        .content { 
          padding: 40px 32px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1c1e21;
          margin-bottom: 16px;
        }
        .main-text {
          font-size: 16px;
          color: #65676b;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .code-container { 
          background: #f8f9fa;
          border: 2px solid #e4e6ea;
          border-radius: 12px; 
          padding: 32px 24px; 
          text-align: center; 
          margin: 32px 0;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        .code-container:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .code-label {
          font-size: 14px;
          color: #65676b;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .code { 
          font-size: 36px; 
          font-weight: 700; 
          color: #f59e0b; 
          letter-spacing: 12px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          margin: 0;
        }
        .security-notice { 
          background: linear-gradient(135deg, #fff3cd 0%, #fef3cd 100%);
          border: 1px solid #ffc107;
          border-left: 4px solid #ffc107;
          padding: 24px; 
          border-radius: 12px; 
          margin: 32px 0;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
        }
        .security-title {
          font-size: 16px;
          font-weight: 600;
          color: #856404;
          margin-bottom: 12px;
        }
        .security-list {
          font-size: 14px;
          color: #856404;
          line-height: 1.6;
        }
        .security-list li {
          margin-bottom: 8px;
        }
        .cta-text {
          font-size: 16px;
          color: #1c1e21;
          text-align: center;
          margin: 32px 0;
          font-weight: 500;
        }
        .footer { 
          background: #f8f9fa;
          padding: 32px;
          border-top: 1px solid #e4e6ea;
        }
        .footer-content {
          text-align: center;
          font-size: 14px;
          color: #65676b;
          line-height: 1.6;
        }
        .footer-links {
          margin: 16px 0;
        }
        .footer-links a {
          color: #1877f2;
          text-decoration: none;
          margin: 0 12px;
          font-weight: 500;
        }
        .footer-links a:hover {
          text-decoration: underline;
        }
        .copyright {
          margin-top: 16px;
          font-size: 13px;
          color: #8a8d91;
        }
        .support-info {
          background: #f0f2f5;
          padding: 20px;
          border-radius: 8px;
          margin-top: 24px;
          text-align: center;
        }
        .support-title {
          font-size: 16px;
          font-weight: 600;
          color: #1c1e21;
          margin-bottom: 8px;
        }
        .support-text {
          font-size: 14px;
          color: #65676b;
          margin-bottom: 12px;
        }
        .support-email {
          font-size: 14px;
          color: #1877f2;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .email-container { margin: 0 16px; }
          .content { padding: 24px 20px; }
          .header-content { padding: 24px 20px; }
          .footer { padding: 24px 20px; }
          .code { font-size: 28px; letter-spacing: 8px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            <div class="logo-container">
              <img src="${EMAIL_TEMPLATES.LOGO_URL}" alt="HanalaFood Logo" class="logo-img" />
              <div class="logo-text">${EMAIL_TEMPLATES.APP_NAME}</div>
            </div>
            <div class="header-subtitle">Reset your password</div>
          </div>
          <div class="header-decoration"></div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${username},</div>
          
          <div class="main-text">
            We received a request to reset your password for your ${EMAIL_TEMPLATES.APP_NAME} account. 
            Use the verification code below to complete the process.
          </div>
          
          <div class="code-container">
            <div class="code-label">Your verification code</div>
            <div class="code">${resetCode}</div>
          </div>
          
          <div class="cta-text">
            Enter this code in the password reset form to continue.
          </div>
          
          <div class="security-notice">
            <div class="security-title">🔒 Security Notice</div>
            <ul class="security-list">
              <li>This code will expire in 60 seconds</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this code with anyone</li>
              <li>${EMAIL_TEMPLATES.APP_NAME} will never ask for your password via email</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="support-info">
              <div class="support-title">Need help?</div>
              <div class="support-text">If you're having trouble, contact our support team</div>
              <div class="support-email">${EMAIL_TEMPLATES.SUPPORT_EMAIL}</div>
            </div>
            
            <div class="footer-links">
              <a href="#">Help Center</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
            
            <div class="copyright">
              © 2024 ${EMAIL_TEMPLATES.APP_NAME}. All rights reserved.<br>
              This email was sent to you because you requested a password reset.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate password reset success email HTML template
 */
export function generatePasswordResetSuccessEmail(username: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password updated successfully - ${EMAIL_TEMPLATES.APP_NAME}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5; 
          color: #1c1e21; 
          background-color: #f0f2f5;
          padding: 20px 0;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
          color: white; 
          padding: 0;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-radius: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 60%),
            linear-gradient(45deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.02) 100%);
          pointer-events: none;
        }
        .header-content {
          padding: 50px 32px 40px 32px;
          position: relative;
          z-index: 2;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
          position: relative;
        }
        .logo-img {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 6px 20px rgba(0, 0, 0, 0.2),
            inset 0 2px 4px rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          border: 3px solid rgba(255, 255, 255, 0.2);
        }
        .logo-text { 
          font-size: 48px; 
          font-weight: 800; 
          letter-spacing: -1px;
          text-shadow: 
            0 6px 12px rgba(0, 0, 0, 0.4),
            0 3px 6px rgba(0, 0, 0, 0.3);
          background: linear-gradient(135deg, #ffffff 0%, #f1f3f4 50%, #e8eaed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
        }
        .header-subtitle {
          font-size: 22px;
          opacity: 0.9;
          font-weight: 500;
          text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
          position: relative;
          margin-top: 16px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .header-decoration {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, 
            rgba(255,255,255,0.2) 0%, 
            rgba(255,255,255,0.1) 25%, 
            rgba(255,255,255,0.15) 50%, 
            rgba(255,255,255,0.1) 75%, 
            rgba(255,255,255,0.2) 100%);
        }
        .content { 
          padding: 40px 32px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #1c1e21;
          margin-bottom: 16px;
        }
        .main-text {
          font-size: 16px;
          color: #65676b;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .success-container { 
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 2px solid #10b981;
          border-radius: 12px; 
          padding: 32px 24px; 
          text-align: center; 
          margin: 32px 0;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .success-title {
          font-size: 24px;
          font-weight: 700;
          color: #047857;
          margin-bottom: 12px;
        }
        .success-message {
          font-size: 16px;
          color: #065f46;
          font-weight: 500;
        }
        .security-notice { 
          background: linear-gradient(135deg, #fff3cd 0%, #fef3cd 100%);
          border: 1px solid #ffc107;
          border-left: 4px solid #ffc107;
          padding: 24px; 
          border-radius: 12px; 
          margin: 32px 0;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
        }
        .security-title {
          font-size: 16px;
          font-weight: 600;
          color: #856404;
          margin-bottom: 12px;
        }
        .security-list {
          font-size: 14px;
          color: #856404;
          line-height: 1.6;
        }
        .security-list li {
          margin-bottom: 8px;
        }
        .cta-section {
          text-align: center;
          margin: 32px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .footer { 
          background: #f8f9fa;
          padding: 32px;
          border-top: 1px solid #e4e6ea;
        }
        .footer-content {
          text-align: center;
          font-size: 14px;
          color: #65676b;
          line-height: 1.6;
        }
        .footer-links {
          margin: 16px 0;
        }
        .footer-links a {
          color: #1877f2;
          text-decoration: none;
          margin: 0 12px;
          font-weight: 500;
        }
        .footer-links a:hover {
          text-decoration: underline;
        }
        .copyright {
          margin-top: 16px;
          font-size: 13px;
          color: #8a8d91;
        }
        .support-info {
          background: #f0f2f5;
          padding: 20px;
          border-radius: 8px;
          margin-top: 24px;
          text-align: center;
        }
        .support-title {
          font-size: 16px;
          font-weight: 600;
          color: #1c1e21;
          margin-bottom: 8px;
        }
        .support-text {
          font-size: 14px;
          color: #65676b;
          margin-bottom: 12px;
        }
        .support-email {
          font-size: 14px;
          color: #1877f2;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .email-container { margin: 0 16px; }
          .content { padding: 24px 20px; }
          .header-content { padding: 24px 20px; }
          .footer { padding: 24px 20px; }
          .success-container { padding: 24px 20px; }
          .success-title { font-size: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            <div class="logo-container">
              <img src="${EMAIL_TEMPLATES.LOGO_URL}" alt="HanalaFood Logo" class="logo-img" />
              <div class="logo-text">${EMAIL_TEMPLATES.APP_NAME}</div>
            </div>
            <div class="header-subtitle">Password updated successfully</div>
          </div>
          <div class="header-decoration"></div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${username},</div>
          
          <div class="main-text">
            Your password has been successfully updated. You can now sign in to your account with your new password.
          </div>
          
          <div class="success-container">
            <div class="success-icon">✅</div>
            <div class="success-title">Password Updated Successfully!</div>
            <div class="success-message">Your account is now secure with your new password</div>
          </div>
          
          <div class="cta-section">
            <a href="#" class="cta-button">Sign In to Your Account</a>
          </div>
          
          <div class="security-notice">
            <div class="security-title">🔒 Security Notice</div>
            <ul class="security-list">
              <li>If you didn't make this change, please contact support immediately</li>
              <li>All your active sessions have been logged out for security</li>
              <li>Consider enabling two-factor authentication for better security</li>
              <li>Never share your password with anyone</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 32px; font-size: 16px; color: #1c1e21; font-weight: 500;">
            Thank you for using ${EMAIL_TEMPLATES.APP_NAME}! 🍽️
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-content">
            <div class="support-info">
              <div class="support-title">Need help?</div>
              <div class="support-text">If you're having trouble, contact our support team</div>
              <div class="support-email">${EMAIL_TEMPLATES.SUPPORT_EMAIL}</div>
            </div>
            
            <div class="footer-links">
              <a href="#">Help Center</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
            
            <div class="copyright">
              © 2024 ${EMAIL_TEMPLATES.APP_NAME}. All rights reserved.<br>
              This email was sent to confirm your password change.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
