const resetPasswordTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
        margin: 0 0 8px 0;
      }
      
      .description {
        color: #586069;
        font-size: 12px;
        line-height: 1.5;
        margin: 0 0 16px 0;
      }
      
      .cta-container {
        text-align: center;
        margin-bottom: 16px;
      }
      
      .primary-button {
        display: inline-block;
        background-color: #0366d6;
        color: #ffffff;
        font-size: 12px;
        font-weight: 500;
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 6px;
        transition: background-color 0.2s ease;
      }
      
      .primary-button:hover {
        background-color: #0256c7;
      }
      
      .link-section {
        margin-bottom: 16px;
      }
      
      .link-label {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        margin: 0 0 6px 0;
        text-align: center;
      }
      
      .link-container {
        padding: 10px 12px;
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        text-align: center;
        word-break: break-all;
      }
      
      .reset-link {
        color: #0366d6;
        font-size: 10px;
        font-weight: 500;
        text-decoration: none;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        word-break: break-all;
      }
      
      .reset-link:hover {
        text-decoration: underline;
      }
      
      .security-section {
        margin-bottom: 16px;
      }
      
      .security-card {
        padding: 12px 16px;
        background-color: #fffbdd;
        border: 1px solid #d9d0a5;
        border-radius: 6px;
        border-left: 3px solid #dbab09;
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
        margin-bottom: 16px;
      }
      
      .info-text {
        color: #586069;
        font-size: 11px;
        line-height: 1.5;
        margin: 0;
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
        
        .primary-button {
          display: block;
          text-align: center;
          padding: 10px 16px;
          font-size: 11px;
        }
        
        .link-container {
          padding: 10px;
        }
        
        .reset-link {
          font-size: 9px;
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
          <h1 class="header-title">Password Reset</h1>
          <p class="header-subtitle">Reset your account password securely</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 class="main-title">Reset Your Password</h2>
          <p class="description">
            We received a request to reset your password. Click the button below to create a new password for your account.
          </p>
          
          <!-- Reset Button -->
          <div class="cta-container">
            <a href="{{resetLink}}" class="primary-button">Reset Password</a>
          </div>
          
          <!-- Reset Link -->
          <div class="link-section">
            <p class="link-label">Or copy and paste this link in your browser:</p>
            <div class="link-container">
              <a href="{{resetLink}}" class="reset-link">{{resetLink}}</a>
            </div>
          </div>
          
          <!-- Security Notice -->
          <div class="security-section">
            <div class="security-card">
              <p class="security-title">
                <span class="security-icon">🔒</span>
                Security Notice
              </p>
              <p class="security-text">
                This link is valid for 1 hour. If you didn't request this password reset, 
                please ignore this email or contact our support team.
              </p>
            </div>
          </div>
          
          <!-- Additional Info -->
          <div class="info-section">
            <p class="info-text">
              If you're having trouble with the button above, copy and paste the link into your web browser. 
              For security concerns, please contact us at {{securityEmail}}.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This is an automated message from Servly. Please do not reply to this email.
          </p>
          <p class="company-info">
            © 2025 Servly • <a href="https://servly.app" class="footer-link">servly.app</a> • Security: {{securityEmail}}
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

export default resetPasswordTemplate;