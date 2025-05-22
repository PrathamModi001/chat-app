import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'prathammodi001@gmail.com',
    pass: 'nxde pnig zdpl clti' // App password
  }
});

export async function sendPasswordSetupEmail(
  toEmail: string, 
  token: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/set-password?email=${encodeURIComponent(toEmail)}&token=${token}`;
  
  const mailOptions = {
    from: 'prathammodi001@gmail.com',
    to: toEmail,
    subject: 'Set Your Periskope Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Set Your Periskope Password</h2>
        <p>Hello,</p>
        <p>You recently signed up for Periskope. To complete your registration, please set your password by clicking the link below:</p>
        <p style="margin: 24px 0;">
          <a 
            href="${resetUrl}" 
            style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;"
          >
            Set Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link is valid for 24 hours.</p>
        <p>Thanks,<br>The Periskope Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password setup email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending password setup email:', error);
    return { success: false, error };
  }
} 