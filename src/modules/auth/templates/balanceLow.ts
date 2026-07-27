const topUpTokensTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
        margin: 0 0 20px 0;
      }
      
      .balance-section {
        margin-bottom: 20px;
      }
      
      .section-label {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .balance-card {
        padding: 16px;
        border: 1px solid #d73a49;
        border-radius: 6px;
        background-color: #ffeef0;
        text-align: center;
        border-left: 3px solid #d73a49;
      }
      
      .balance-value {
        color: #d73a49;
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 2px 0;
      }
      
      .balance-label {
        color: #586069;
        font-size: 11px;
        font-weight: 500;
        margin: 0;
      }
      
      .warning-section {
        margin-bottom: 20px;
      }
      
      .warning-card {
        padding: 12px 16px;
        background-color: #fffbdd;
        border: 1px solid #d9d0a5;
        border-radius: 6px;
        border-left: 3px solid #dbab09;
      }
      
      .warning-title {
        color: #735c0f;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 4px 0;
        display: flex;
        align-items: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .warning-icon {
        margin-right: 4px;
        font-size: 12px;
      }
      
      .warning-text {
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
        
        .balance-value {
          font-size: 20px;
        }
        
        .balance-card {
          padding: 14px;
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
          <h1 class="header-title">Token Balance Alert</h1>
          <p class="header-subtitle">Your AI token balance is running low</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 class="main-title">Low Token Balance</h2>
          <p class="description">
            Your AI token balance is running low. To continue using AI features without interruption, 
            please top up your account.
          </p>
          
          <!-- Balance Info -->
          <div class="balance-section">
            <p class="section-label">Current Balance</p>
            <div class="balance-card">
              <p class="balance-value">{{remainingTokens}}</p>
              <p class="balance-label">tokens remaining</p>
            </div>
          </div>
          
          <!-- Warning Notice -->
          <div class="warning-section">
            <div class="warning-card">
              <p class="warning-title">
                <span class="warning-icon">⚠</span>
                Important Notice
              </p>
              <p class="warning-text">
                When your token balance reaches zero, AI features will be temporarily disabled. 
                Top up now to maintain uninterrupted service.
              </p>
            </div>
          </div>
          
          <!-- Additional Info -->
          <div class="info-section">
            <p class="info-text">
              You can view your detailed usage statistics and purchase additional tokens from your account dashboard. 
              For billing questions, contact us at hi@servly.app.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This is an automated message from Servly. Please do not reply to this email.
          </p>
          <p class="company-info">
            © 2025 Servly • <a href="https://servly.app" class="footer-link">servly.app</a> • Billing: hi@servly.app
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

export default topUpTokensTemplate;