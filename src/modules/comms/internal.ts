/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prettier/prettier */
// @ts-nocheck
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const Handlebars = require("handlebars");

const redactKeys = ['authorization', 'apiKey', 'api_key', 'token', 'password', 'secret'];

const safeSerialize = (value) => {
  const seen = new WeakSet();

  return JSON.stringify(
    value,
    (key, item) => {
      if (redactKeys.some((redactKey) => key.toLowerCase().includes(redactKey.toLowerCase()))) {
        return '[REDACTED]';
      }

      if (typeof item === 'bigint') {
        return item.toString();
      }

      if (item && typeof item === 'object') {
        if (seen.has(item)) {
          return '[Circular]';
        }
        seen.add(item);
      }

      return item;
    },
    2
  );
};

const normalizeError = (error) => {
  const response = error?.response;
  const responseData = response?.data || response?.body || error?.data || error?.body;
  const ownProperties = {};

  if (error && typeof error === 'object') {
    Object.getOwnPropertyNames(error).forEach((key) => {
      if (!['stack', 'response', 'request'].includes(key)) {
        ownProperties[key] = error[key];
      }
    });
  }

  return {
    name: error?.name,
    message: error?.message || responseData?.message || responseData?.error,
    status: error?.status || response?.status,
    statusCode: error?.statusCode || response?.statusCode || response?.status,
    code: error?.code,
    response: responseData,
    raw: ownProperties,
    stack: error?.stack,
  };
};

const getErrorMessage = (error) => {
  const details = normalizeError(error);

  if (details.message) {
    return details.message;
  }

  if (details.response) {
    return safeSerialize(details.response);
  }

  return safeSerialize(details.raw) || String(error);
};

const wrapNotificationError = (prefix, error) => {
  const details = normalizeError(error);
  const wrappedError = new Error(`${prefix}: ${getErrorMessage(error)}`);
  wrappedError.details = details;
  wrappedError.cause = error;
  return wrappedError;
};

class SendNotification {
  constructor(apiKey, senderEmail = "noreply@servly.app", senderName = "Servly") {
    if (!apiKey) {
      throw new Error('API key is required for MailerSend');
    }
    
    this.mailerSend = new MailerSend({
      apiKey,
    });
    this.senderEmail = senderEmail;
    this.senderName = senderName;
    
  }

  // Helper method to process HTML template with variables using Handlebars
  processTemplate(htmlTemplate, variables) {
    try {
      const template = Handlebars.compile(htmlTemplate);
      return template(variables);
    } catch (error) {
      throw new Error(`Template processing error: ${error.message}`);
    }
  }

  // Helper method to send email with HTML content
  async sendEmail(to, toName, subject, htmlContent, textContent = null) {
    try {
      const sentFrom = new Sender(this.senderEmail, this.senderName);
      const recipients = [new Recipient(to, toName)];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setReplyTo(sentFrom)
        .setSubject(subject)
        .setHtml(htmlContent);

      if (textContent) {
        emailParams.setText(textContent);
      }

      const response = await this.mailerSend.email.send(emailParams);
      return response;
    } catch (error) {
      const details = normalizeError(error);
      console.error('MailerSend email error details:', safeSerialize(details));
      
      const wrappedError = new Error(`Error sending email: ${getErrorMessage(error)}`);
      wrappedError.details = details;
      wrappedError.cause = error;
      throw wrappedError;
    }
  }

  async sendPasswordResetNotification(subscriberId, email, resetLink, securityEmail, htmlTemplate) {
    try {
      const variables = {
        resetLink,
        securityEmail,
        subscriberId
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, subscriberId, "Password Reset Request", htmlContent);
      return 'Password reset notification sent successfully.';
    } catch (error) {
      throw new Error(`Error sending password reset notification: ${error.message}`);
    }
  }

  async sendTenantWelcomeEmail(subscriberId, email, resetLink, securityEmail, htmlTemplate) {
    try {
      const variables = {
        resetLink,
        securityEmail,
        subscriberId
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, subscriberId, "Welcome to Servly!", htmlContent);
      return 'Tenant welcome email sent successfully.';
    } catch (error) {
      throw new Error(`Error sending tenant welcome email: ${error.message}`);
    }
  }

  async sendOTP(subscriberId, email, otp, name, htmlTemplate) {
    try {
      const variables = {
        firstName: name,
        otp_code: otp,
        timestamp: new Date().toISOString(),
        device_info: "example text",
        ip_address: "123 Main Street",
        subscriberId
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, name, "Your OTP Code", htmlContent);
      return 'OTP sent notification sent successfully.';
    } catch (error) {
      
      console.error('OTP notification error details:', safeSerialize(normalizeError(error)));
      throw wrapNotificationError('Error sending otp notification', error);
    }
  }

  async sendWelcome( email, name, htmlTemplate) {
    try {
      const variables = {
        firstName: name
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, name, "Welcome To Servly", htmlContent);
      return 'welcom sent notification sent successfully.';
    } catch (error) {
      
      throw new Error(`Error sending welcome notification: ${error.message}`);
    }
  }

  async sendSucessfulDeploymentEmail(email, name, htmlTemplate, data) {
    try {
      // Check if htmlTemplate is a function, if so, convert it to a string
      const templateString = typeof htmlTemplate === 'function' 
        ? htmlTemplate.toString().replace(/^[^`]*`/, '').replace(/`[^`]*$/, '') 
        : htmlTemplate;
      
      const variables = {
        ...data
      };
      
      const htmlContent = this.processTemplate(templateString, variables);
      
      await this.sendEmail(email, name, "Successfully Deployment", htmlContent);
      return 'send successful deployment notification sent successfully.';
    } catch (error) {
      throw new Error(`Error sending success deployment notification: ${error.message}`);
    }
  }

  async sendFailedDeploymentEmail ( email, name, htmlTemplate, data) {
    try {
      const variables = {
        ...data
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, name, "Failed Deployment", htmlContent);
      return 'failed deployment notification sent successfully.';
    } catch (error) {
      throw new Error(`Error sending failed deployment notification: ${error.message}`);
    }
  }

  async sendTopUpTokensEmail ( email, name, htmlTemplate, data) {
    try {
      const variables = {
        ...data
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, name, "Tokens Running Low", htmlContent);
      return 'failed deployment notification sent successfully.';
    } catch (error) {
      
      throw new Error(`Error sending failed deployment notification: ${error.message}`);
    }
  }

  async sendUserWelcomeEmail(subscriberId, email, resetLink, securityEmail, htmlTemplate) {
    try {
      const variables = {
        resetLink,
        securityEmail,
        subscriberId
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, subscriberId, "Welcome to Servly!", htmlContent);
      return 'User welcome email sent successfully.';
    } catch (error) {
      throw new Error(`Error sending user welcome email: ${error.message}`);
    }
  }

  async sendPasswordChangedEmail(subscriberId, email, resetLink, securityEmail, htmlTemplate) {
    try {
      const variables = {
        resetLink,
        securityEmail,
        subscriberId
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, subscriberId, "Password Changed Successfully", htmlContent);
      return 'Password changed email sent successfully.';
    } catch (error) {
      throw new Error(`Error sending password changed email: ${error.message}`);
    }
  }

  async sendTenantMonthlyLimitEmail(subscriberId, email, resetLink, securityEmail, htmlTemplate) {
    try {
      const variables = {
        resetLink,
        securityEmail,
        subscriberId
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, subscriberId, "Monthly Limit Reached", htmlContent);
      return 'Monthly limit email sent successfully.';
    } catch (error) {
      throw new Error(`Error sending monthly limit email: ${error.message}`);
    }
  }

  async sendBroadcastNotification(subscriberId, email, resetLink, securityEmail, htmlTemplate) {
    try {
      const variables = {
        resetLink,
        securityEmail,
        subscriberId
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, subscriberId, "Important Announcement", htmlContent);
      return 'Broadcast notification sent successfully.';
    } catch (error) {
      throw new Error(`Error sending broadcast notification: ${error.message}`);
    }
  }

  async sendUserInviteEmail(subscriberId, email, inviteLink, companyName, username, htmlTemplate,inviterEmail) {
    try {
      const variables = {
        inviteLink,
       organizationName: companyName,
        username,
        subscriberId,
        inviterEmail
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, username, `Invitation to join ${companyName}`, htmlContent);
      return 'User invite email sent successfully.';
    } catch (error) {
      throw new Error(`Error sending user invite email: ${error.message}`);
    }
  }

  async sendServlyContactFormMessage(email, username, content, htmlTemplate) {
    try {
      const variables = {
        username: `${username} - ${email}`,
        content
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail("kmupita@gmail.com", "Support Team", "New Contact Form Message", htmlContent);
      return 'Contact form message sent successfully.';
    } catch (error) {
      throw new Error(`Error sending contact form message: ${error.message}`);
    }
  }

  async sendServlyRequestDemoMessage(email, username, content, companyName, size, industry, htmlTemplate) {
    try {
      const variables = {
        username: `${username} - ${email}`,
        companyName,
        content,
        size,
        industry
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail("kmupita@gmail.com", "Support Team", "New Demo Request", htmlContent);
      return 'Demo request sent successfully.';
    } catch (error) {
      throw new Error(`Error sending demo request: ${error.message}`);
    }
  }

  async sendDomainAssignmentEmail(email, userName, htmlTemplate, data) {
    try {
      const variables = {
        userName,
        domain: data.domain,
        dnsRecords: data.dnsRecords,
        year: new Date().getFullYear(),
      };
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      await this.sendEmail(email, userName, "Domain Assigned - Action Required", htmlContent);
      return 'Domain assignment notification sent successfully.';
    } catch (error) {
      
      throw new Error(`Error sending domain assignment notification: ${error.message}`);
    }
  }

  async sendPromptExecutionEmail(email, userName, htmlTemplate, data) {
    try {
      const variables = {
        userName,
        promptType: data.promptType,
        isResource: data.isResource,
        resourceName: data.resourceName,
        isApp: data.isApp,
        appName: data.appName,
        isFullSystem: data.isFullSystem,
        systemName: data.systemName,
        details: data.details,
        year: new Date().getFullYear(),
      };
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      await this.sendEmail(email, userName, "Prompt Execution Complete", htmlContent);
      return 'Prompt execution notification sent successfully.';
    } catch (error) {
      
      throw new Error(`Error sending prompt execution notification: ${error.message}`);
    }
  }

  async sendLoginNotificationEmail(email: string, name: string, htmlTemplate: string, data: any) {
    try {
      const variables = {
        ...data
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, name, "Login Notification", htmlContent);
      return 'Login notification sent successfully.';
    } catch (error) {
      throw new Error(`Error sending login notification: ${error.message}`);
    }
  }

  async sendPasswordUpdateNotificationEmail(email: string, name: string, htmlTemplate: string, data: any) {
    try {
      const variables = {
        ...data
      };
      
      const htmlContent = this.processTemplate(htmlTemplate, variables);
      
      await this.sendEmail(email, name, "Password Update Notification", htmlContent);
      return 'Password update notification sent successfully.';
    } catch (error) {
      throw new Error(`Error sending password update notification: ${error.message}`);
    }
  }

  // Note: MailerSend doesn't have a direct equivalent to Novu's subscriber identification
  // You would typically manage this through MailerSend's contact management API
  async identifySubscriber(subscriberId, email, firstName, lastName, phone) {
    try {
      // This is a placeholder - you would implement contact management here
      // using MailerSend's contact API if needed
      return 'Subscriber identified successfully.';
    } catch (error) {
      throw new Error(`Error identifying subscriber: ${error.message}`);
    }
  }
}

export default SendNotification;
module.exports = SendNotification;

// Usage example:
// const apiKey = 'your-mailersend-api-key';
// const notifier = new SendNotification(apiKey);
// 
// const htmlTemplate = `
//   <p>Hey {{firstName}}!</p>
//   <p>Your OTP code is: <strong>{{otp_code}}</strong></p>
//   <p>This code was generated at {{timestamp}}</p>
//   <p>Device: {{device_info}}</p>
//   <p>IP Address: {{ip_address}}</p>
//   <br>
//   <p>Regards,</p>
//   <p>The Servly Team</p>
// `;
// 
// notifier.sendOTP(
//   'user123',
//   'user@example.com',
//   '123456',
//   'John Doe',
//   htmlTemplate
// );
