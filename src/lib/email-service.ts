/**
 * Email Service Wrapper
 * Supports: SendGrid, Mailgun, AWS SES
 * Configured via environment variables
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private provider: 'sendgrid' | 'mailgun' | 'aws-ses' | 'mock' = 'mock';
  private from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM || 'noreply@siwatoday.com';
    
    if (process.env.SENDGRID_API_KEY) {
      this.provider = 'sendgrid';
    } else if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      this.provider = 'mailgun';
    } else if (process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID) {
      this.provider = 'aws-ses';
    } else {
      console.warn('⚠️ No email provider configured. Using mock provider.');
      this.provider = 'mock';
    }
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const from = options.from || this.from;
      
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendViaSendGrid(options, from);
        case 'mailgun':
          return await this.sendViaMailgun(options, from);
        case 'aws-ses':
          return await this.sendViaAwsSES(options, from);
        case 'mock':
        default:
          return this.sendViaMock(options, from);
      }
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendViasendGrid(options: EmailOptions, from: string): Promise<EmailResult> {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: options.to,
      from: from,
      subject: options.subject,
      text: options.text || 'See HTML version',
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc
    };

    const response = await sgMail.send(msg);
    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };
  }

  private async sendViaMailgun(options: EmailOptions, from: string): Promise<EmailResult> {
    const FormData = require('form-data');
    const Mailgun = require('mailgun.js');
    
    const mg = new Mailgun(FormData);
    const client = mg.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    });

    const messageData = {
      from: from,
      to: options.to,
      subject: options.subject,
      text: options.text || 'See HTML version',
      html: options.html,
      'h:Reply-To': options.replyTo
    };

    if (options.cc) messageData.cc = options.cc.join(',');
    if (options.bcc) messageData.bcc = options.bcc.join(',');

    const response = await client.messages.create(process.env.MAILGUN_DOMAIN!, messageData);
    return {
      success: true,
      messageId: response.id
    };
  }

  private async sendViaAwsSES(options: EmailOptions, from: string): Promise<EmailResult> {
    const AWS = require('aws-sdk');
    
    const ses = new AWS.SES({
      apiVersion: '2010-12-01',
      region: process.env.AWS_SES_REGION
    });

    const params = {
      Source: from,
      Destination: {
        ToAddresses: [options.to],
        CcAddresses: options.cc || [],
        BccAddresses: options.bcc || []
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8'
          },
          Text: {
            Data: options.text || 'See HTML version',
            Charset: 'UTF-8'
          }
        }
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined
    };

    const response = await ses.sendEmail(params).promise();
    return {
      success: true,
      messageId: response.MessageId
    };
  }

  private sendViaMock(options: EmailOptions, from: string): EmailResult {
    console.log('📧 MOCK EMAIL SENT:');
    console.log(`  From: ${from}`);
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Reply-To: ${options.replyTo || 'N/A'}`);
    console.log('---');
    console.log(options.html);
    console.log('---');

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
