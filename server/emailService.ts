import { MailService } from '@sendgrid/mail';

export interface EmailProvider {
  sendEmail(params: EmailParams): Promise<boolean>;
}

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface BookingEmailData {
  bookingId: string;
  applicantName: string;
  applicantEmail: string;
  destination: string;
  bookingDate: string;
  returnDate: string;
  reason?: string;
  adminNotes?: string;
  processedBy?: string;
}

class SendGridProvider implements EmailProvider {
  private mailService: MailService;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY environment variable must be set");
    }
    this.mailService = new MailService();
    this.mailService.setApiKey(apiKey);
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      await this.mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text || '',
        html: params.html || '',
      });
      console.log(`Email sent successfully to ${params.to}`);
      return true;
    } catch (error: any) {
      console.error('SendGrid email error:', error);
      if (error.response?.body?.errors) {
        console.error('SendGrid error details:', error.response.body.errors);
        if (error.code === 403) {
          console.error('Email sending failed: Sender email not verified. Please verify your sender email in SendGrid console.');
        }
      }
      return false;
    }
  }
}

// Placeholder for MyGovCloud Mail API - ready for implementation
class MyGovCloudProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.MYGOV_MAIL_API_KEY || '';
    if (!this.apiKey) {
      console.warn("MyGovCloud Mail API not configured. Set MYGOV_MAIL_API_KEY to use this provider.");
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      // TODO: Implement MyGovCloud Mail API integration
      // This structure is ready for your approved government email service
      console.log('MyGovCloud Mail API would send:', params);
      return true;
    } catch (error) {
      console.error('MyGovCloud Mail API error:', error);
      return false;
    }
  }
}

// Email templates
const getBookingConfirmationTemplate = (data: BookingEmailData) => ({
  subject: `Pengesahan Permohonan Kenderaan - ${data.bookingId}`,
  text: `
Terima kasih atas permohonan kenderaan anda.

ID Tempahan: ${data.bookingId}
Nama Pemohon: ${data.applicantName}
Destinasi: ${data.destination}
Tarikh Perjalanan: ${data.bookingDate}
Tarikh Pulang: ${data.returnDate}

Status: Menunggu Kelulusan

Permohonan anda sedang diproses dan akan dimaklumkan melalui email apabila keputusan telah dibuat.

Jabatan Akauntan Negara Malaysia
Negeri Sembilan
  `,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Pengesahan Permohonan Kenderaan</h2>
      <p>Terima kasih atas permohonan kenderaan anda.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Maklumat Permohonan:</h3>
        <p><strong>ID Tempahan:</strong> ${data.bookingId}</p>
        <p><strong>Nama Pemohon:</strong> ${data.applicantName}</p>
        <p><strong>Destinasi:</strong> ${data.destination}</p>
        <p><strong>Tarikh Perjalanan:</strong> ${data.bookingDate}</p>
        <p><strong>Tarikh Pulang:</strong> ${data.returnDate}</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>Status:</strong> Menunggu Kelulusan</p>
      </div>
      
      <p>Permohonan anda sedang diproses dan akan dimaklumkan melalui email apabila keputusan telah dibuat.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        Jabatan Akauntan Negara Malaysia<br>
        Negeri Sembilan
      </p>
    </div>
  `
});

const getBookingApprovalTemplate = (data: BookingEmailData) => ({
  subject: `Permohonan Kenderaan Diluluskan - ${data.bookingId}`,
  text: `
Permohonan kenderaan anda telah DILULUSKAN.

ID Tempahan: ${data.bookingId}
Nama Pemohon: ${data.applicantName}
Destinasi: ${data.destination}
Tarikh Perjalanan: ${data.bookingDate}
Tarikh Pulang: ${data.returnDate}

${data.adminNotes ? `Catatan: ${data.adminNotes}` : ''}

Sila hubungi pihak pengurusan kenderaan untuk maklumat lanjut mengenai pengambilan kenderaan.

Diluluskan oleh: ${data.processedBy || 'Admin'}

Jabatan Akauntan Negara Malaysia
Negeri Sembilan
  `,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Permohonan Kenderaan Diluluskan</h2>
      <p>Permohonan kenderaan anda telah <strong style="color: #059669;">DILULUSKAN</strong>.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Maklumat Permohonan:</h3>
        <p><strong>ID Tempahan:</strong> ${data.bookingId}</p>
        <p><strong>Nama Pemohon:</strong> ${data.applicantName}</p>
        <p><strong>Destinasi:</strong> ${data.destination}</p>
        <p><strong>Tarikh Perjalanan:</strong> ${data.bookingDate}</p>
        <p><strong>Tarikh Pulang:</strong> ${data.returnDate}</p>
      </div>
      
      <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #059669;">
        <p style="margin: 0;"><strong>Status:</strong> Diluluskan</p>
      </div>
      
      ${data.adminNotes ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0;">Catatan:</h4>
          <p style="margin: 0;">${data.adminNotes}</p>
        </div>
      ` : ''}
      
      <p>Sila hubungi pihak pengurusan kenderaan untuk maklumat lanjut mengenai pengambilan kenderaan.</p>
      
      <p style="color: #6b7280;"><em>Diluluskan oleh: ${data.processedBy || 'Admin'}</em></p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        Jabatan Akauntan Negara Malaysia<br>
        Negeri Sembilan
      </p>
    </div>
  `
});

const getBookingRejectionTemplate = (data: BookingEmailData) => ({
  subject: `Permohonan Kenderaan Tidak Diluluskan - ${data.bookingId}`,
  text: `
Permohonan kenderaan anda tidak dapat diluluskan.

ID Tempahan: ${data.bookingId}
Nama Pemohon: ${data.applicantName}
Destinasi: ${data.destination}
Tarikh Perjalanan: ${data.bookingDate}
Tarikh Pulang: ${data.returnDate}

Sebab: ${data.reason || 'Tiada sebab diberikan'}

${data.adminNotes ? `Catatan: ${data.adminNotes}` : ''}

Anda boleh membuat permohonan baharu pada masa akan datang.

Diproses oleh: ${data.processedBy || 'Admin'}

Jabatan Akauntan Negara Malaysia
Negeri Sembilan
  `,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Permohonan Kenderaan Tidak Diluluskan</h2>
      <p>Permohonan kenderaan anda tidak dapat diluluskan.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Maklumat Permohonan:</h3>
        <p><strong>ID Tempahan:</strong> ${data.bookingId}</p>
        <p><strong>Nama Pemohon:</strong> ${data.applicantName}</p>
        <p><strong>Destinasi:</strong> ${data.destination}</p>
        <p><strong>Tarikh Perjalanan:</strong> ${data.bookingDate}</p>
        <p><strong>Tarikh Pulang:</strong> ${data.returnDate}</p>
      </div>
      
      <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
        <p style="margin: 0;"><strong>Status:</strong> Tidak Diluluskan</p>
      </div>
      
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin-top: 0; color: #dc2626;">Sebab:</h4>
        <p style="margin: 0;">${data.reason || 'Tiada sebab diberikan'}</p>
      </div>
      
      ${data.adminNotes ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top: 0;">Catatan:</h4>
          <p style="margin: 0;">${data.adminNotes}</p>
        </div>
      ` : ''}
      
      <p>Anda boleh membuat permohonan baharu pada masa akan datang.</p>
      
      <p style="color: #6b7280;"><em>Diproses oleh: ${data.processedBy || 'Admin'}</em></p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        Jabatan Akauntan Negara Malaysia<br>
        Negeri Sembilan
      </p>
    </div>
  `
});

// Main email service class
export class EmailService {
  private provider: EmailProvider;
  private fromEmail: string;

  constructor() {
    // Check which email provider to use
    if (process.env.MYGOV_MAIL_API_KEY) {
      this.provider = new MyGovCloudProvider();
    } else if (process.env.SENDGRID_API_KEY) {
      this.provider = new SendGridProvider();
    } else {
      console.warn('No email provider configured. Set SENDGRID_API_KEY or MYGOV_MAIL_API_KEY');
      throw new Error('No email provider configured');
    }

    // Default sender email - use a verified SendGrid sender email
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
  }

  async sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
    const template = getBookingConfirmationTemplate(data);
    return await this.provider.sendEmail({
      to: data.applicantEmail,
      from: this.fromEmail,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  async sendBookingApproval(data: BookingEmailData): Promise<boolean> {
    const template = getBookingApprovalTemplate(data);
    return await this.provider.sendEmail({
      to: data.applicantEmail,
      from: this.fromEmail,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  async sendBookingRejection(data: BookingEmailData): Promise<boolean> {
    const template = getBookingRejectionTemplate(data);
    return await this.provider.sendEmail({
      to: data.applicantEmail,
      from: this.fromEmail,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }
}