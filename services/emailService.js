const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send trip itinerary email with PDF attachment
exports.sendTripEmail = async (userData, tripName, pdfBuffer) => {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #db0589;">Your Trip to ${tripName}</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <p>Hello ${userData.displayName || userData.username || userData.email},</p>
          
          <p>Attached is your travel itinerary for <strong>${tripName}</strong> from Alcove. This PDF contains all the details of your planned activities for this trip.</p>
          
          <p>You can print this document or save it for offline access during your travels.</p>
          
          <p>Happy travels!</p>
          
          <p style="margin-top: 30px;">The Alcove Team</p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
          <p>This is an automated email from Alcove - Your Smart Travel Companion</p>
        </div>
      </div>
    `;
    
    // Convert HTML to text for email clients that don't support HTML
    const emailText = htmlToText.convert(emailHtml, {
      wordwrap: 130
    });
    
    // Send email with PDF attachment
    const info = await transporter.sendMail({
      from: `"Alcove Travel" <${process.env.EMAIL_FROM}>`,
      to: userData.email,
      subject: `Your Trip to ${tripName} - Travel Itinerary`,
      text: emailText,
      html: emailHtml,
      attachments: [
        {
          filename: `alcove_trip_${tripName.replace(/\s+/g, '_').toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send trip email');
  }
};