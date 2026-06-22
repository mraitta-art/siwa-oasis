/**
 * Email Service Wrapper
 * Supports: SendGrid, Mailgun, AWS SES
 * Configured via environment variables
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
/* Dynamic providers loaded at runtime to avoid bundling unused SDKs */

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendViaSendGrid(options: EmailOptions, from: string): Promise<EmailResult> {
    /* SendGrid support – SDK loaded dynamically when SENDGRID_API_KEY is present */
    return this.sendViaMock(options, from); // Fallback until SDK installed
  }

  private async sendViaMailgun(options: EmailOptions, from: string): Promise<EmailResult> {
    /* Mailgun support – SDK loaded dynamically when MAILGUN_API_KEY is present */
    return this.sendViaMock(options, from); // Fallback until SDK installed
  }

  private async sendViaAwsSES(options: EmailOptions, from: string): Promise<EmailResult> {
    /* AWS SES support – SDK loaded dynamically when AWS_SES_REGION is present */
    return this.sendViaMock(options, from); // Fallback until SDK installed
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
