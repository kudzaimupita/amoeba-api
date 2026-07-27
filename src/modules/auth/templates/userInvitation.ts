export const inviteUserTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      
      /* Organization Card */
      .organization-section {
        margin-bottom: 16px;
      }
      
      .org-card {
        background-color: #f0f9ff;
        border: 1px solid #0366d6;
        border-left: 3px solid #0366d6;
        border-radius: 6px;
        padding: 12px;
      }
      
      .org-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      
      .org-name {
        color: #24292e;
        font-size: 12px;
        font-weight: 600;
        margin: 0;
      }
      
      .org-role {
        background-color: #0366d6;
        color: #ffffff;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 3px 6px;
        border-radius: 3px;
      }
      
      .org-details {
        color: #586069;
        font-size: 10px;
        line-height: 1.5;
        margin: 0;
      }
      
      /* Invitation Details */
      .details-section {
        margin-bottom: 16px;
      }
      
      .details-list {
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 12px;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 6px 0;
        border-bottom: 1px solid #e1e4e8;
      }
      
      .detail-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .detail-label {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }
      
      .detail-value {
        color: #24292e;
        font-size: 11px;
        font-weight: 500;
        margin: 0;
        text-align: right;
        word-break: break-word;
        max-width: 60%;
      }
      
      /* Expiry Notice */
      .expiry-notice {
        background-color: #fffbdd;
        border: 1px solid #f9e388;
        border-left: 3px solid #f9e388;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .expiry-label {
        color: #735c0f;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 4px 0;
      }
      
      .expiry-text {
        color: #735c0f;
        font-size: 10px;
        line-height: 1.5;
        margin: 0;
      }
      
      /* CTA Button */
      .cta-container {
        margin-bottom: 16px;
      }
      
      .primary-button {
        display: block;
        width: 100%;
        background-color: #0366d6;
        color: #ffffff;
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;
        text-align: center;
        padding: 10px 16px;
        border-radius: 6px;
        border: 1px solid #0366d6;
      }
      
      .primary-button:hover {
        background-color: #0256c2;
      }
      
      /* Link Section */
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
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 10px;
        text-align: center;
        word-break: break-all;
      }
      
      .invite-link {
        color: #0366d6;
        font-size: 10px;
        font-weight: 500;
        text-decoration: none;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        word-break: break-all;
      }
      
      .invite-link:hover {
        text-decoration: underline;
      }
      
      /* Help Section */
      .help-section {
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 16px;
      }
      
      .help-text {
        color: #586069;
        font-size: 10px;
        line-height: 1.5;
        margin: 0;
        text-align: center;
      }
      
      .help-link {
        color: #0366d6;
        text-decoration: none;
        font-weight: 500;
      }
      
      .help-link:hover {
        text-decoration: underline;
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
        
        .org-card {
          padding: 10px;
        }
        
        .details-list {
          padding: 10px;
        }
        
        .expiry-notice {
          padding: 10px;
        }
        
        .link-container {
          padding: 8px;
        }
        
        .help-section {
          padding: 8px;
        }
        
        .detail-item {
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-value {
          text-align: left;
          max-width: 100%;
        }
        
        .org-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
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
          <p class="header-label">TEAM INVITATION</p>
          <h1 class="header-title">Join Organization</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Welcome Section -->
          <p class="section-label">INVITATION</p>
          <h2 class="main-title">Join {{organizationName}}</h2>
          <p class="description">
            You've been invited to collaborate with a team on Servly. Accept this invitation to access shared projects and start working together.
          </p>
          
          <!-- Organization Card -->
          <div class="organization-section">
            <p class="section-label">ORGANIZATION</p>
            <div class="org-card">
              <div class="org-header">
                <h3 class="org-name">{{organizationName}}</h3>
                <span class="org-role">MEMBER</span>
              </div>
              <p class="org-details">You'll be joining as a team member with access to organization resources.</p>
            </div>
          </div>
          
          <!-- Invitation Details -->
          <div class="details-section">
            <p class="section-label">DETAILS</p>
            <div class="details-list">
              <div class="detail-item">
                <span class="detail-label">INVITED BY</span>
                <span class="detail-value">{{inviterEmail}}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ROLE</span>
                <span class="detail-value">Member</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ACCESS</span>
                <span class="detail-value">Organization Resources</span>
              </div>
            </div>
          </div>
          
          <!-- Expiry Notice -->
          <div class="expiry-notice">
            <p class="expiry-label">⏱ EXPIRES IN</p>
            <p class="expiry-text">This invitation expires in {{expiresIn}} days</p>
          </div>
          
          <!-- CTA Button -->
          <div class="cta-container">
            <a href="{{inviteLink}}" class="primary-button">ACCEPT INVITATION</a>
          </div>
          
          <!-- Invitation Link -->
          <div class="link-section">
            <p class="link-label">Or copy and paste this link in your browser:</p>
            <div class="link-container">
              <a href="{{inviteLink}}" class="invite-link">{{inviteLink}}</a>
            </div>
          </div>
          
          <!-- Help Section -->
          <div class="help-section">
            <p class="help-text">
              Having trouble? Contact <a href="mailto:{{inviterEmail}}" class="help-link">{{inviterEmail}}</a> for assistance.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This invitation was sent on behalf of {{organizationName}}.
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
//     organizationName,
//     inviterEmail,
//     inviteLink,
//     expiresIn
// }

export default inviteUserTemplate;