export const otpTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
      
      * {
        font-family: "Poppins", -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 0;
        padding: 0;
      }
      
      body {
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
        color: #24292e;
      }
      
      .email-container {
        max-width: 560px;
        margin: 0 auto;
        background-color: #ffffff;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .header {
        padding: 16px 20px;
        border-bottom: 1px solid #e1e4e8;
        background-color: #fafbfc;
      }
      
      .logo {
        height: 20px;
        width: auto;
        margin-bottom: 8px;
      }
      
      .header-title {
        color: #24292e;
        font-size: 13px;
        font-weight: 600;
        margin: 0;
      }
      
      .header-subtitle {
        color: #586069;
        font-size: 11px;
        font-weight: 400;
        margin: 2px 0 0 0;
      }
      
      .content {
        padding: 20px;
      }
      
      .main-title {
        color: #24292e;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 6px 0;
        text-align: center;
      }
      
      .description {
        color: #586069;
        font-size: 12px;
        line-height: 1.5;
        text-align: center;
        margin: 0 0 20px 0;
      }
      
      .otp-section {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .otp-label {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 10px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .otp-container {
        display: inline-block;
        background-color: #fafbfc;
        border: 2px solid #e1e4e8;
        border-radius: 6px;
        padding: 16px 24px;
        margin-bottom: 10px;
      }
      
      .otp-code {
        color: #24292e;
        font-size: 24px;
        font-weight: 600;
        letter-spacing: 6px;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        margin: 0;
      }
      
      .otp-expiry {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        margin: 0;
      }
      
      .security-section {
        margin-bottom: 16px;
      }
      
      .security-card {
        background-color: #fffbdd;
        border: 1px solid #d9d0a5;
        border-left: 3px solid #dbab09;
        border-radius: 6px;
        padding: 12px 16px;
      }
      
      .security-title {
        color: #735c0f;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 4px 0;
        display: flex;
        align-items: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .security-icon {
        margin-right: 4px;
        font-size: 12px;
      }
      
      .security-text {
        color: #735c0f;
        font-size: 11px;
        line-height: 1.4;
        margin: 0;
      }
      
      .info-section {
        margin-bottom: 12px;
      }
      
      .info-text {
        color: #586069;
        font-size: 11px;
        line-height: 1.5;
        margin: 0;
      }
      
      .help-section {
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 10px 16px;
        margin-bottom: 16px;
      }
      
      .help-text {
        color: #586069;
        font-size: 11px;
        line-height: 1.4;
        margin: 0;
        text-align: center;
      }
      
      .footer {
        padding: 16px 20px;
        border-top: 1px solid #e1e4e8;
        background-color: #fafbfc;
      }
      
      .footer-text {
        color: #586069;
        font-size: 10px;
        line-height: 1.4;
        text-align: center;
        margin: 0 0 6px 0;
      }
      
      .footer-link {
        color: #0366d6;
        text-decoration: none;
        font-weight: 500;
      }
      
      .footer-link:hover {
        text-decoration: underline;
      }
      
      .company-info {
        color: #959da5;
        font-size: 10px;
        text-align: center;
        margin: 0;
      }
      
      @media only screen and (max-width: 600px) {
        .email-container {
          margin: 0 12px;
          border-radius: 6px;
        }
        
        .header {
          padding: 14px 16px;
        }
        
        .content {
          padding: 16px;
        }
        
        .footer {
          padding: 14px 16px;
        }
        
        .main-title {
          font-size: 14px;
        }
        
        .otp-container {
          padding: 14px 20px;
        }
        
        .otp-code {
          font-size: 20px;
          letter-spacing: 5px;
        }
        
        .description {
          font-size: 11px;
        }
      }
    </style>
  </head>
  <body>
    <div style="background-color: #f5f5f5; padding: 32px 16px;">
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="https://studio.servly.app/servly-logo-fav-black.png" alt="Servly" class="logo" />
          <h1 class="header-title">Verification Code</h1>
          <p class="header-subtitle">Secure authentication required</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 class="main-title">Verify Your Identity</h2>
          <p class="description">
            We've sent you a one-time verification code to complete your authentication. 
            Enter the code below to continue securely.
          </p>
          
          <!-- OTP Section -->
          <div class="otp-section">
            <p class="otp-label">Your Verification Code</p>
            <div class="otp-container">
              <p class="otp-code">{{otp_code}}</p>
            </div>
            <p class="otp-expiry">Valid for 10 minutes</p>
          </div>
          
          <!-- Security Notice -->
          <div class="security-section">
            <div class="security-card">
              <p class="security-title">
                <span class="security-icon">🔒</span>
                Security Notice
              </p>
              <p class="security-text">
                Never share this code with anyone. Servly will never ask for this code via phone or email. 
                If you didn't request this verification, please ignore this message.
              </p>
            </div>
          </div>
          
          <!-- Additional Info -->
          <div class="info-section">
            <p class="info-text">
              This code was generated for your account security. If you have concerns about unauthorized access, 
              please contact our support team immediately.
            </p>
          </div>
          
          <!-- Help Section -->
          <div class="help-section">
            <p class="help-text">
              Having trouble? Contact our support team for assistance.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This is an automated security message. Please do not reply to this email.
          </p>
          <p class="company-info">
            © 2025 Servly • <a href="https://servly.app" class="footer-link">servly.app</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

// Template variables:
// {
//     otp_code
// }