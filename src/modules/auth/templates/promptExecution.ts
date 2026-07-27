const promptExecutionTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
        margin-bottom: 12px;
        padding: 8px 12px;
        background-color: #f1f8ff;
        border-radius: 6px;
        border-left: 3px solid #0366d6;
      }
      
      .success-icon {
        color: #0366d6;
        font-size: 12px;
        margin-right: 6px;
        font-weight: 600;
      }
      
      .success-text {
        color: #24292e;
        font-size: 10px;
        font-weight: 600;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .main-title {
        color: #24292e;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 6px 0;
      }
      
      .description {
        color: #586069;
        font-size: 11px;
        line-height: 1.4;
        margin: 0 0 12px 0;
      }
      
      .execution-section {
        margin-bottom: 12px;
      }
      
      .section-label {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 6px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .execution-card {
        padding: 10px 12px;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        background-color: #fafbfc;
      }
      
      .execution-type {
        color: #0366d6;
        font-size: 12px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }
      
      .execution-details {
        color: #586069;
        font-size: 10px;
        line-height: 1.4;
        margin: 0;
      }
      
      .details-section {
        margin-bottom: 12px;
      }
      
      .details-card {
        padding: 10px 12px;
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        border-left: 3px solid #0366d6;
      }
      
      .details-title {
        color: #24292e;
        font-size: 10px;
        font-weight: 600;
        margin: 0 0 4px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .details-content {
        color: #586069;
        font-size: 10px;
        line-height: 1.4;
        margin: 0;
      }
      
      .help-section {
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 12px;
      }
      
      .help-text {
        color: #586069;
        font-size: 10px;
        line-height: 1.3;
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
        
        .execution-type {
          font-size: 12px;
        }
        
        .execution-card {
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
          <h1 class="header-title">Prompt Execution</h1>
          <p class="header-subtitle">Your prompt has finished executing</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Success Indicator -->
          <div class="success-indicator">
            <span class="success-icon">✓</span>
            <p class="success-text">Execution Completed</p>
          </div>
          
          <!-- Main Info -->
          <h2 class="main-title">Prompt Complete</h2>
          <p class="description">
            Hi {{userName}}, your prompt has completed successfully and is ready for review.
          </p>
          
          <!-- Execution Info -->
          <div class="execution-section">
            <p class="section-label">Execution Type</p>
            <div class="execution-card">
              <p class="execution-type">{{promptType}}</p>
              <div class="execution-details">
                {{#if isResource}}
                <strong>Resource:</strong> {{resourceName}}<br />
                {{/if}}
                {{#if isApp}}
                <strong>Application:</strong> {{appName}}<br />
                {{/if}}
                {{#if isFullSystem}}
                <strong>System:</strong> {{systemName}}<br />
                {{/if}}
              </div>
            </div>
          </div>
          
          <!-- Details Section -->
          <div class="details-section">
            <p class="section-label">Execution Details</p>
            <div class="details-card">
              <p class="details-title">Summary</p>
              <p class="details-content">{{details}}</p>
            </div>
          </div>
          
          <!-- Help Section -->
          <div class="help-section">
            <p class="help-text">
              If you have any questions or need help, contact our support team. Thank you for using Servly!
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            Thank you for using Servly!
          </p>
          <p class="company-info">
            © {{year}} Servly • <a href="https://servly.app" class="footer-link">servly.app</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

export default promptExecutionTemplate;