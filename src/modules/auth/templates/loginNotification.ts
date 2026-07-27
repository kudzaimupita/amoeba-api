export const loginNotificationTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
        box-sizing: border-box;
      }
      
      body {
        background-color: #f6f8fa;
        margin: 0;
        padding: 0;
        color: #24292e;
      }
      
      .email-wrapper {
        background-color: #f6f8fa;
        padding: 20px 16px;
      }
      
      .email-container {
        max-width: 560px;
        margin: 0 auto;
        background-color: #ffffff;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .header {
        padding: 16px 20px;
        background-color: #fafbfc;
        border-bottom: 1px solid #e1e4e8;
      }
      
      .logo {
        height: 20px;
        width: auto;
        margin-bottom: 8px;
      }
      
      .header-label {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 4px 0;
      }
      
      .header-title {
        color: #24292e;
        font-size: 13px;
        font-weight: 600;
        margin: 0;
      }
      
      .content {
        padding: 20px;
      }
      
      .section-label {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 8px 0;
      }
      
      .main-title {
        color: #24292e;
        font-size: 13px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      
      .description {
        color: #586069;
        font-size: 11px;
        line-height: 1.5;
        margin: 0 0 16px 0;
      }
      
      /* Login Details */
      .login-details {
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .details-label {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 8px 0;
      }
      
      .login-detail {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 6px 0;
        border-bottom: 1px solid #e1e4e8;
      }
      
      .login-detail:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .login-detail-label {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
        min-width: 100px;
      }
      
      .login-detail-value {
        color: #24292e;
        font-size: 11px;
        font-weight: 500;
        margin: 0;
        text-align: right;
        word-break: break-word;
        max-width: 60%;
      }
      
      /* Security Alert */
      .security-section {
        margin-bottom: 16px;
      }
      
      .security-card {
        background-color: #fffbdd;
        border: 1px solid #f9e388;
        border-left: 3px solid #f9e388;
        border-radius: 6px;
        padding: 12px;
      }
      
      .security-title {
        color: #735c0f;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 6px 0;
        display: flex;
        align-items: center;
      }
      
      .security-icon {
        margin-right: 4px;
        font-size: 12px;
      }
      
      .security-text {
        color: #735c0f;
        font-size: 10px;
        line-height: 1.5;
        margin: 0;
      }
      
      /* Action Section */
      .action-section {
        background-color: #fff5f5;
        border: 1px solid #feb2b2;
        border-left: 3px solid #f56565;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .action-label {
        color: #c53030;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 6px 0;
      }
      
      .action-text {
        color: #c53030;
        font-size: 10px;
        line-height: 1.5;
        margin: 0 0 8px 0;
      }
      
      .action-link {
        color: #c53030;
        font-size: 10px;
        font-weight: 600;
        text-decoration: none;
        border-bottom: 1px solid #c53030;
      }
      
      .action-link:hover {
        opacity: 0.8;
      }
      
      /* Footer */
      .footer {
        padding: 16px 20px;
        background-color: #fafbfc;
        border-top: 1px solid #e1e4e8;
      }
      
      .footer-text {
        color: #586069;
        font-size: 10px;
        line-height: 1.5;
        text-align: center;
        margin: 0 0 8px 0;
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
        .email-wrapper {
          padding: 16px 12px;
        }
        
        .header {
          padding: 12px 16px;
        }
        
        .content {
          padding: 16px;
        }
        
        .footer {
          padding: 12px 16px;
        }
        
        .login-details {
          padding: 10px;
        }
        
        .security-card {
          padding: 10px;
        }
        
        .action-section {
          padding: 10px;
        }
        
        .login-detail {
          flex-direction: column;
          gap: 4px;
        }
        
        .login-detail-label {
          min-width: auto;
        }
        
        .login-detail-value {
          text-align: left;
          max-width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="https://studio.servly.app/servly-logo-fav-black.png" alt="Servly" class="logo" />
          <p class="header-label">SECURITY ALERT</p>
          <h1 class="header-title">Login Notification</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Alert Section -->
          <p class="section-label">NOTIFICATION</p>
          <h2 class="main-title">New Login Detected</h2>
          <p class="description">
            A login has been detected on your Servly account. Review the details below to ensure it was you.
          </p>
          
          <!-- Login Details -->
          <div class="login-details">
            <p class="details-label">LOGIN DETAILS</p>
            <div class="login-detail">
              <span class="login-detail-label">TIME</span>
              <span class="login-detail-value">{{loginTime}}</span>
            </div>
            <div class="login-detail">
              <span class="login-detail-label">IP ADDRESS</span>
              <span class="login-detail-value">{{ipAddress}}</span>
            </div>
            <div class="login-detail">
              <span class="login-detail-label">LOCATION</span>
              <span class="login-detail-value">{{location}}</span>
            </div>
            <div class="login-detail">
              <span class="login-detail-label">DEVICE</span>
              <span class="login-detail-value">{{deviceType}}</span>
            </div>
            <div class="login-detail">
              <span class="login-detail-label">OS</span>
              <span class="login-detail-value">{{operatingSystem}}</span>
            </div>
          </div>
          
          <!-- Security Notice -->
          <div class="security-section">
            <div class="security-card">
              <p class="security-title">
                <span class="security-icon">🔒</span>
                SECURITY NOTICE
              </p>
              <p class="security-text">
                If this was you, no action is needed. Your account remains secure.
              </p>
            </div>
          </div>
          
          <!-- Action Required -->
          <div class="action-section">
            <p class="action-label">⚠ UNRECOGNIZED LOGIN?</p>
            <p class="action-text">
              If you did not initiate this login, take action immediately to secure your account.
            </p>
            <a href="https://studio.servly.app/security" class="action-link">Secure Your Account →</a>
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

export default loginNotificationTemplate;