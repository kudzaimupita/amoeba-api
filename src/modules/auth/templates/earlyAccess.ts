export const earlyAccessTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

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
      
      /* Access Badge */
      .access-badge {
        background-color: #f0f9ff;
        border: 1px solid #0366d6;
        border-left: 3px solid #0366d6;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .badge-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      
      .badge-label {
        color: #0366d6;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }
      
      .badge-icon {
        color: #0366d6;
        font-size: 16px;
      }
      
      .badge-text {
        color: #24292e;
        font-size: 11px;
        font-weight: 500;
        margin: 0;
      }
      
      /* Details List */
      .details-list {
        margin-bottom: 16px;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 6px 0;
        border-bottom: 1px solid #f6f8fa;
      }
      
      .detail-item:last-child {
        border-bottom: none;
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
      
      /* Features Section */
      .features-section {
        background-color: #fafbfc;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .features-label {
        color: #586069;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 8px 0;
      }
      
      .feature-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 6px;
        padding-left: 16px;
        position: relative;
      }
      
      .feature-item:last-child {
        margin-bottom: 0;
      }
      
      .feature-item:before {
        content: "→";
        color: #0366d6;
        font-size: 10px;
        position: absolute;
        left: 0;
        top: 0;
      }
      
      .feature-text {
        color: #24292e;
        font-size: 10px;
        line-height: 1.5;
        margin: 0;
      }
      
      /* Help Section */
      .help-section {
        background-color: #fffbdd;
        border: 1px solid #f9e388;
        border-left: 3px solid #f9e388;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .help-label {
        color: #735c0f;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 4px 0;
      }
      
      .help-text {
        color: #735c0f;
        font-size: 10px;
        line-height: 1.5;
        margin: 0;
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
        
        .access-badge {
          padding: 10px;
        }
        
        .features-section {
          padding: 10px;
        }
        
        .help-section {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <p>{{ greeting | default: "Hi" }} {{ first_name }},</p>

    <p>Thanks for applying to the Servly Beta. After careful consideration, we’ve accepted your request to try out Servly in Beta.</p>

    <p><strong>Why we think you're a great fit for the beta? </strong> {{ why_you | default: "You opted in early and you’re willing to test work-in-progress and share concrete notes." }}</p>

    <p><strong>The Beta Package:</strong></p>
    <ul>
      <li>Activation link: <a href="{{ activation_url }}">{{ activation_url }}</a></li>
      <li>Join Discord: <a href="{{ discord_invite_url }}">{{ discord_invite_url }}</a></li>
      <li><strong>Complimentary AI tokens:</strong> 1 million tokens added to your account so you can explore freely during beta.</li>
    </ul>

    <p>{{ closing_line | default: "If anything feels rough or confusing, reply here or ping us in Discord, we read everything." }}</p>

    <p>- {{ sender_name | default: "Eddie" }}<br/>Co-founder, Servly</p>

    <!-- Optional comms note; remove if not needed -->
    <p class="muted">{{ comms_note | default: "We’ll keep most updates in Discord and keep emails minimal." }}</p>
  </body>
</html>`;

export default earlyAccessTemplate;
