const aiExecutionCompleteTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      
      * {
        font-family: "Inter", sans-serif;
        margin: 0;
        padding: 0;
      }
      
      body {
        background-color: #fafafa;
        margin: 0;
        padding: 0;
        color: #171717;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .header {
        padding: 32px 32px 24px 32px;
        border-bottom: 1px solid #f5f5f5;
      }
      
      .logo {
        height: 24px;
        width: auto;
        margin-bottom: 16px;
      }
      
      .header-title {
        color: #171717;
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }
      
      .header-subtitle {
        color: #737373;
        font-size: 14px;
        font-weight: 400;
        margin: 4px 0 0 0;
      }
      
      .content {
        padding: 32px;
      }
      
      .success-indicator {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
        padding: 16px;
        background-color: #f0fdf4;
        border-radius: 6px;
        border-left: 3px solid #22c55e;
      }
      
      .success-icon {
        color: #22c55e;
        font-size: 16px;
        margin-right: 12px;
        font-weight: 600;
      }
      
      .success-text {
        color: #171717;
        font-size: 14px;
        font-weight: 500;
        margin: 0;
      }
      
      .main-title {
        color: #171717;
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 12px 0;
      }
      
      .description {
        color: #737373;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 32px 0;
      }
      
      .resources-section {
        margin-bottom: 32px;
      }
      
      .section-label {
        color: #171717;
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 16px 0;
      }
      
      .resources-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .resource-item {
        padding: 16px;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        background-color: #fafafa;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .resource-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        background-color: #0070f3;
      }
      
      .resource-info {
        flex: 1;
      }
      
      .resource-name {
        color: #171717;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 2px 0;
      }
      
      .resource-type {
        color: #737373;
        font-size: 12px;
        text-transform: capitalize;
        margin: 0;
      }
      
      .resource-status {
        background-color: #dcfce7;
        color: #166534;
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .cta-container {
        text-align: left;
        margin-bottom: 32px;
      }
      
      .primary-button {
        display: inline-block;
        background-color: #171717;
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        padding: 12px 20px;
        border-radius: 6px;
        margin-right: 12px;
        transition: background-color 0.2s ease;
      }
      
      .primary-button:hover {
        background-color: #404040;
      }
      
      .secondary-button {
        display: inline-block;
        background-color: transparent;
        color: #171717;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        padding: 12px 20px;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        transition: all 0.2s ease;
      }
      
      .secondary-button:hover {
        background-color: #f5f5f5;
        border-color: #d4d4d4;
      }
      
      .next-steps {
        background-color: #f0f9ff;
        border: 1px solid #e0f2fe;
        border-radius: 6px;
        padding: 16px 20px;
        margin-bottom: 24px;
        border-left: 3px solid #0070f3;
      }
      
      .next-steps-text {
        color: #0f172a;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
      }
      
      .footer {
        padding: 24px 32px;
        border-top: 1px solid #f5f5f5;
        background-color: #fafafa;
      }
      
      .footer-text {
        color: #737373;
        font-size: 12px;
        line-height: 1.5;
        margin: 0 0 8px 0;
      }
      
      .footer-link {
        color: #0070f3;
        text-decoration: none;
        font-weight: 500;
      }
      
      .footer-link:hover {
        text-decoration: underline;
      }
      
      .company-info {
        color: #a3a3a3;
        font-size: 11px;
        margin: 0;
      }
      
      @media only screen and (max-width: 600px) {
        .email-container {
          margin: 0 16px;
          border-radius: 6px;
        }
        
        .header {
          padding: 24px 20px 20px 20px;
        }
        
        .content {
          padding: 24px 20px;
        }
        
        .footer {
          padding: 20px;
        }
        
        .header-title {
          font-size: 18px;
        }
        
        .main-title {
          font-size: 20px;
        }
        
        .primary-button, .secondary-button {
          display: block;
          text-align: center;
          margin: 8px 0;
          padding: 14px 20px;
        }
        
        .primary-button {
          margin-right: 0;
        }
      }
    </style>
  </head>
  <body>
    <div style="background-color: #fafafa; padding: 40px 16px;">
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <img src="https://studio.servly.app/servly-logo-fav-black.png" alt="Servly" class="logo" />
          <h1 class="header-title">Resources Created</h1>
          <p class="header-subtitle">Your AI execution is complete</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Success Indicator -->
          <div class="success-indicator">
            <span class="success-icon">✓</span>
            <p class="success-text">Resources ready to use</p>
          </div>
          
          <!-- Main Info -->
          <h2 class="main-title">Your Resources Are Ready!</h2>
          <p class="description">
            Great news! Your AI prompt has been successfully executed. All your requested resources have been created and are ready to use.
          </p>
          
          <!-- Resources Section -->
          <div class="resources-section">
            <p class="section-label">Created Resources</p>
            <div class="resources-list">
              {{#each resources}}
              <div class="resource-item">
                <div class="resource-icon">📦</div>
                <div class="resource-info">
                  <p class="resource-name">{{name}}</p>
                  <p class="resource-type">{{type}}</p>
                </div>
                <div class="resource-status">Ready</div>
              </div>
              {{/each}}
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="cta-container">
            <a href="https://studio.servly.app/" class="primary-button">View Dashboard</a>
            <a href="https://studio.servly.app" class="secondary-button">Manage Resources</a>
          </div>
          
          <!-- Next Steps -->
          <div class="next-steps">
            <p class="next-steps-text">
              <strong>What's Next?</strong> Now you can start customizing your resources, tweaking your APIs, 
              or generating your UI with additional AI prompts. Everything is live and ready for you to take control.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            Need help? Contact our support team at {{supportEmail}}.
          </p>
          <p class="company-info">
            © 2025 Servly • <a href="https://servly.app" class="footer-link">servly.app</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

export default aiExecutionCompleteTemplate;
