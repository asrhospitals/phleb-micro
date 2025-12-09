// src/services/emailService.js
const transporter = require('./transporter');

/**
 * Generates the subject and HTML body for a BILL_TEST registration.
 */
function generateEmailContent(data) {
    const { name, username, regType, testDetails, billDetails } = data;
    
    // --- Shared HTML Component for Test Details (Used if testDetails exists) ---
    const testDetailsHtml = testDetails ? `
        <h3>🔬 Scheduled Test Details:</h3>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p><strong>Tests Ordered:</strong> ${testDetails.testname || 'N/A'}</p>
            <p><strong>Registration Date:</strong> ${testDetails.appointmentDate || 'N/A'}</p>
            <p><strong>Location:</strong> ${testDetails.location || 'N/A'}</p>
        </div>
    ` : '';
    
    // --- Shared HTML Component for Billing Details (Used if billDetails exists) ---
    const billDetailsHtml = billDetails ? `
        <h3>💳 Billing Summary:</h3>
        <div style="background-color: #e6f7ff; padding: 15px; border-radius: 4px; margin: 15px 0; border: 1px solid #b3d9ff;">
            <p><strong>Payment Status:</strong> Confirmed</p>
            <p><strong>Total Amount Paid:</strong> ${billDetails.amount || 'N/A'}</p>
            <p><strong>Bill/Transaction ID:</strong> ${billDetails.billId || 'N/A'}</p>
        </div>
        <p>A formal receipt will be provided at the center.</p>
    ` : '';

    // --- Conditional Content Selection ---
    let subject = "LIMS Registration Confirmation";
    let specificContent = ''; // Initialize specific content

    if (regType === 'BILL_TEST') {
        subject = `Test & Payment Confirmed: ${testDetails.testname || 'Your Tests'}`;
        specificContent = `
            <p>Thank you for registering and completing your payment for laboratory services.</p>
            ${testDetailsHtml}
            ${billDetailsHtml}
            <p>Your unique LIMS ID is: <strong>${username}</strong>.</p>
        `;
    } else if (regType === 'PPP_TEST' && testDetails) {
        subject = `PPP Program & Test Confirmation: ${testDetails.testname || 'Your Tests'}`;
        specificContent = `
            <p>Your registration for the **PPP Program** and your test has been confirmed.</p>
            ${testDetailsHtml}
            <p>Your unique UHID ID is: <strong>${username}</strong>.</p>
            <p>We will be in touch shortly with details regarding your PPP enrollment.</p>
        `;
    } else {
        // GENERAL or Fallback
        subject = "Welcome to the LIMS !";
        specificContent = `
            <p>Your general registration has been successfully done.</p>
            <p>Your unique UHID ID is: <strong>${username}</strong>.</p>
        `;
    }
    
    // --- Overall HTML Structure (Button Removed) ---
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #007bff; color: white; padding: 10px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2>${subject}</h2>
            </div>
            <div style="padding: 20px;">
                <p>Dear <strong>${name}</strong>,</p>
                ${specificContent}
                
                <p>Regards,<br>The LIMS Team</p>
            </div>
        </div>
    `;

    return { subject, htmlBody };
}

/**
 * Sends a registration confirmation email with dynamic content.
 */
async function sendRegistrationEmail(data) {
    const { to } = data;
    const { subject, htmlBody } = generateEmailContent(data); 

    const mailOptions = {
        from: '"LIMS Support" <support@yourlims.com>', 
        to: to, 
        subject: subject, 
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        // Log the message ID for tracking purposes
        console.log(`Email sent successfully to ${to}. ID: ${info.messageId}`); 
        return true;
    } catch (error) {
        console.error(`ERROR: Failed to send email to ${to}:`, error.message);
        return false;
    }
}

module.exports = { sendRegistrationEmail };