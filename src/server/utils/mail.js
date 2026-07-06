import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('\n==================================================');
    console.log('✉️  MOCK EMAIL DISPATCHED (No SMTP credentials configured)');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:\n${text}`);
    if (html) {
      console.log(`HTML snippet:\n${html.substring(0, 300)}...`);
    }
    console.log('==================================================\n');
    return { mock: true, message: 'Mock email logged to console' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"ProFlow Workspace" <${user}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✉️ Email successfully dispatched to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error('❌ Failed to dispatch email via Nodemailer:', error);
    throw error;
  }
};
