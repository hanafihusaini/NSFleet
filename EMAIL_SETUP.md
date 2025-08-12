# Email Notification Setup Guide

## Current Status
✅ Email notification system architecture implemented  
✅ SendGrid API key configured  
❌ Sender email verification required  

## SendGrid Setup Required

### 1. Verify Sender Email
To send emails with SendGrid free plan, you need to verify a sender email:

1. Go to SendGrid Console: https://app.sendgrid.com/
2. Navigate to Settings > Sender Authentication
3. Click "Verify a Single Sender"
4. Enter email details (use your government email address)
5. Verify the email from your inbox

### 2. Update Configuration
After verification, update the FROM_EMAIL environment variable:
```bash
echo "FROM_EMAIL=your-verified-email@domain.gov.my" >> .env
```

## Alternative: MyGovCloud Mail API
When approved by your IT department:

1. Get MyGovCloud Mail API credentials
2. Set environment variable:
```bash
echo "MYGOV_MAIL_API_KEY=your-api-key" >> .env
```
3. The system will automatically switch to MyGovCloud Mail API

## Current Email Templates
- **Booking Confirmation**: Sent when user submits booking
- **Booking Approval**: Sent when admin approves booking  
- **Booking Rejection**: Sent when admin rejects booking

All templates are in Bahasa Malaysia and include:
- Booking ID and applicant details
- Booking dates and destination
- Status and next steps
- Government department branding

## Testing
Once sender is verified, test by:
1. Creating a new booking through the form
2. Check console logs for "Email sent successfully"
3. Admin can approve/reject to test status emails