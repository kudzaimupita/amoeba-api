export const welcomeTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      
      .welcome-section {
        margin-bottom: 20px;
      }
      
      .welcome-card {
        background-color: #f1f8ff;
        border: 1px solid #c8e1ff;
        border-left: 3px solid #0366d6;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 16px;
      }
      
      .welcome-title {
        color: #044289;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 6px 0;
        display: flex;
        align-items: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .welcome-icon {
        margin-right: 4px;
        font-size: 12px;
      }
      
      .welcome-text {
        color: #044289;
        font-size: 11px;
        line-height: 1.5;
        margin: 0;
      }
      
      .cta-container {
        text-align: center;
        margin-bottom: 20px;
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
      
      .features-section {
        margin-bottom: 16px;
      }
      
      .section-label {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 8px 0;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .features-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .feature-card {
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .feature-icon {
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .feature-content {
        flex: 1;
      }
      
      .feature-title {
        color: #24292e;
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 2px 0;
      }
      
      .feature-description {
        color: #586069;
        font-size: 10px;
        line-height: 1.3;
        margin: 0;
      }
      
      .info-section {
        margin-bottom: 16px;
      }
      
      .info-text {
        color: #586069;
        font-size: 11px;
        line-height: 1.5;
        text-align: center;
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
        
        .welcome-card {
          padding: 10px 12px;
        }
        
        .feature-card {
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
          <h1 class="header-title">Welcome to Servly</h1>
          <p class="header-subtitle">Your AI-powered development journey begins</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 class="main-title">Welcome! 👋</h2>
          <p class="description">
            We're excited to welcome you to Servly! You've just joined a growing community of developers who are making web development effortless with AI.
          </p>
          
          <!-- Welcome Message -->
          <div class="welcome-section">
            <div class="welcome-card">
              <p class="welcome-title">
                <span class="welcome-icon">🚀</span>
                Your AI-Powered Journey
              </p>
              <p class="welcome-text">
                Begin by telling our AI what kind of app you want to build. It'll create your backend resources (database, auth, notifications) first, then generate your UI with a simple prompt. Once everything is set up, you can dive in and customize every detail to match your vision.
              </p>
            </div>
          </div>
          
          <!-- CTA Button -->
          <div class="cta-container">
            <a href="https://studio.servly.app" class="primary-button">Start Building Now</a>
          </div>
          
          <!-- Features Section -->
          <div class="features-section">
            <p class="section-label">What You Can Build</p>
            <div class="features-list">
              <div class="feature-card">
                <div class="feature-icon">💾</div>
                <div class="feature-content">
                  <p class="feature-title">Backend APIs</p>
                  <p class="feature-description">Database, auth, and business logic</p>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🎨</div>
                <div class="feature-content">
                  <p class="feature-title">Modern UIs</p>
                  <p class="feature-description">Responsive interfaces with Tailwind</p>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📧</div>
                <div class="feature-content">
                  <p class="feature-title">Notifications</p>
                  <p class="feature-description">Email templates and messaging</p>
                </div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <div class="feature-content">
                  <p class="feature-title">Security</p>
                  <p class="feature-description">User management and RBAC</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Additional Info -->
          <div class="info-section">
            <p class="info-text">
              Need help getting started? Check out our documentation or contact our support team. We're here to help you build amazing applications.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This is an automated welcome message from Servly. Please do not reply to this email.
          </p>
          <p class="company-info">
            © 2025 Servly • <a href="https://servly.app" class="footer-link">servly.app</a> • Support: {{supportEmail}}
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

export default welcomeTemplate;