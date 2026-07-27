const failedDeploymentsTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      
      .error-indicator {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        padding: 10px 12px;
        background-color: #ffeef0;
        border-radius: 6px;
        border-left: 3px solid #d73a49;
      }
      
      .error-icon {
        color: #d73a49;
        font-size: 14px;
        margin-right: 8px;
        font-weight: 600;
      }
      
      .error-text {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .app-name {
        color: #24292e;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 6px 0;
      }
      
      .description {
        color: #586069;
        font-size: 12px;
        line-height: 1.5;
        margin: 0 0 16px 0;
      }
      
      .deployment-list {
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .deployment-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        background-color: #fafbfc;
      }
      
      .deployment-label {
        color: #586069;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }
      
      .deployment-value {
        color: #24292e;
        font-size: 11px;
        font-weight: 500;
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      }
      
      .error-section {
        margin-bottom: 16px;
      }
      
      .error-label {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 6px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .error-container {
        padding: 12px;
        background-color: #24292e;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        overflow-x: auto;
      }
      
      .error-message {
        color: #f5f5f5;
        font-size: 10px;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
      }
      
      .help-section {
        background-color: #fffbdd;
        border: 1px solid #d9d0a5;
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 16px;
      }
      
      .help-text {
        color: #735c0f;
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
        
        .app-name {
          font-size: 13px;
        }
        
        .deployment-item {
          padding: 8px 10px;
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
          <h1 class="header-title">Deployment Failed</h1>
          <p class="header-subtitle">Your deployment encountered an error</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Error Indicator -->
          <div class="error-indicator">
            <span class="error-icon">✗</span>
            <p class="error-text">Deployment Failed</p>
          </div>
          
          <!-- Application Info -->
          <h2 class="app-name">{{applicationName}}</h2>
          <p class="description">
            Unfortunately, your deployment to {{environment}} encountered an error and couldn't be completed.
          </p>
          
          <!-- Deployment Details -->
          <div class="deployment-list">
            <div class="deployment-item">
              <p class="deployment-label">Failed At</p>
              <p class="deployment-value">{{failedAt}}</p>
            </div>
            <div class="deployment-item">
              <p class="deployment-label">Duration</p>
              <p class="deployment-value">{{duration}}</p>
            </div>
            <div class="deployment-item">
              <p class="deployment-label">Version</p>
              <p class="deployment-value">{{version}}</p>
            </div>
            <div class="deployment-item">
              <p class="deployment-label">Stage</p>
              <p class="deployment-value">{{failedStage}}</p>
            </div>
          </div>
          
          <!-- Error Details -->
          <div class="error-section">
            <p class="error-label">Error Details</p>
            <div class="error-container">
              <p class="error-message">{{errorMessage}}</p>
            </div>
          </div>
          
          <!-- Help Section -->
          <div class="help-section">
            <p class="help-text">
              Need help? Check our troubleshooting guide or contact support for assistance.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            View detailed logs and retry deployment in your <a href="https://studio.servly.app" class="footer-link">dashboard</a>.
          </p>
          <p class="company-info">
            © 2025 Servly • <a href="https://servly.app" class="footer-link">servly.app</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

export default failedDeploymentsTemplate;