export const successfulDeploymentTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      
      .success-indicator {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        padding: 10px 12px;
        background-color: #dcffe4;
        border-radius: 6px;
        border-left: 3px solid #28a745;
      }
      
      .success-icon {
        color: #28a745;
        font-size: 14px;
        margin-right: 8px;
        font-weight: 600;
      }
      
      .success-text {
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
      
      .url-section {
        margin-bottom: 16px;
      }
      
      .url-label {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 6px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .url-container {
        padding: 10px 12px;
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        word-break: break-all;
      }
      
      .app-url {
        color: #0366d6;
        font-size: 11px;
        font-weight: 500;
        text-decoration: none;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      }
      
      .app-url:hover {
        text-decoration: underline;
      }
      
      .cta-container {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .primary-button {
        flex: 1;
        display: block;
        background-color: #0366d6;
        color: #ffffff;
        font-size: 11px;
        font-weight: 500;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 6px;
        text-align: center;
        transition: background-color 0.2s ease;
      }
      
      .primary-button:hover {
        background-color: #0256c7;
      }
      
      .secondary-button {
        flex: 1;
        display: block;
        background-color: #fafbfc;
        color: #24292e;
        font-size: 11px;
        font-weight: 500;
        text-decoration: none;
        padding: 8px 12px;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        text-align: center;
        transition: all 0.2s ease;
      }
      
      .secondary-button:hover {
        background-color: #f3f4f6;
        border-color: #d1d5da;
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
        
        .cta-container {
          flex-direction: column;
        }
        
        .primary-button, .secondary-button {
          padding: 10px 12px;
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
          <h1 class="header-title">Deployment Complete</h1>
          <p class="header-subtitle">Your application is now live</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Success Indicator -->
          <div class="success-indicator">
            <span class="success-icon">✓</span>
            <p class="success-text">Successfully Deployed</p>
          </div>
          
          <!-- Application Info -->
          <h2 class="app-name">{{applicationName}}</h2>
          <p class="description">
            Your application has been successfully deployed to {{environment}} and is now accessible to users.
          </p>
          
          <!-- Deployment Details -->
          <div class="deployment-list">
            <div class="deployment-item">
              <p class="deployment-label">Deploy Time</p>
              <p class="deployment-value">{{deployTime}}</p>
            </div>
            <div class="deployment-item">
              <p class="deployment-label">Build Duration</p>
              <p class="deployment-value">{{buildDuration}}</p>
            </div>
            <div class="deployment-item">
              <p class="deployment-label">Version</p>
              <p class="deployment-value">{{version}}</p>
            </div>
            <div class="deployment-item">
              <p class="deployment-label">Commit</p>
              <p class="deployment-value">{{deployId}}</p>
            </div>
          </div>
          
          <!-- Application URL -->
          <div class="url-section">
            <p class="url-label">Live URL</p>
            <div class="url-container">
              <a href="{{applicationUrl}}" class="app-url">{{applicationUrl}}</a>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="cta-container">
            <a href="{{applicationUrl}}" class="primary-button">View Application</a>
            <a href="{{dashboardUrl}}" class="secondary-button">View Dashboard</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            Monitor your deployment metrics and logs in your <a href="{{dashboardUrl}}" class="footer-link">dashboard</a>.
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
//     deployTime,
//     environment,
//     applicationName,
//     version,
//     buildDuration,
//     deployId,
//     applicationUrl,
//     dashboardUrl
// }