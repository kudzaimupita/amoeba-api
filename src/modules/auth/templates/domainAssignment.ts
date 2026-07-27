const domainAssignmentTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      
      .domain-section {
        margin-bottom: 32px;
      }
      
      .section-label {
        color: #171717;
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 12px 0;
      }
      
      .domain-card {
        padding: 20px;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        background-color: #fafafa;
        text-align: center;
      }
      
      .domain-value {
        color: #0070f3;
        font-size: 18px;
        font-weight: 600;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        word-break: break-all;
        margin: 0;
      }
      
      .dns-section {
        margin-bottom: 32px;
      }
      
      .dns-card {
        padding: 16px 20px;
        background-color: #fffbeb;
        border: 1px solid #fed7aa;
        border-radius: 6px;
        border-left: 3px solid #f59e0b;
      }
      
      .dns-title {
        color: #92400e;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 12px 0;
      }
      
      .dns-records {
        color: #92400e;
        font-size: 13px;
        line-height: 1.5;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        margin: 0;
      }
      
      .help-section {
        background-color: #f9f9f9;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        padding: 16px 20px;
        margin-bottom: 24px;
      }
      
      .help-text {
        color: #525252;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
        text-align: center;
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
        text-align: center;
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
        text-align: center;
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
        
        .domain-value {
          font-size: 16px;
        }
        
        .domain-card {
          padding: 16px;
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
          <h1 class="header-title">Domain Assignment</h1>
          <p class="header-subtitle">Your custom domain has been assigned</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 class="main-title">Domain Ready for Setup</h2>
          <p class="description">
            Hi {{userName}}, your custom domain has been successfully assigned to your application. 
            Complete the DNS setup below to activate your domain.
          </p>
          
          <!-- Domain Info -->
          <div class="domain-section">
            <p class="section-label">Assigned Domain</p>
            <div class="domain-card">
              <p class="domain-value">{{domain}}</p>
            </div>
          </div>
          
          <!-- DNS Records -->
          <div class="dns-section">
            <p class="section-label">DNS Configuration Required</p>
            <div class="dns-card">
              <p class="dns-title">Add these DNS records:</p>
              <div class="dns-records">
                {{#each dnsRecords}}
                {{type}} {{name}} → {{value}}
                {{/each}}
              </div>
            </div>
          </div>
          
          <!-- Help Section -->
          <div class="help-section">
            <p class="help-text">
              Once DNS records are added and propagated, your domain will be live. Need help? Contact our support team.
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

export default domainAssignmentTemplate;
