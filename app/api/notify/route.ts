import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { videoId, title, ownerEmail } = await request.json();
    const appBaseUrl = process.env.APP_BASE_URL;
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!appBaseUrl || !smtpEmail || !smtpPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing APP_BASE_URL or SMTP credentials.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    const admins = ['liormedan1@gmail.com', 'medan4u@gmail.com'];
    
    // The link the admins click to approve
    const approveLink = `${appBaseUrl.replace(/\/$/, '')}/admin/approve?videoId=${videoId}`;

    const mailOptions = {
      from: smtpEmail,
      to: admins.join(', '),
      subject: `New Video Upload Pending Approval: ${title}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>סרטון חדש הועלה וממתין לאישור!</h2>
          <p><strong>כותרת:</strong> ${title}</p>
          <p><strong>הועלה על ידי:</strong> ${ownerEmail || 'לא ידוע'}</p>
          <br/>
          <p>לחץ על הכפתור למטה כדי לצפות בסרטון ולאשר אותו (יש להתחבר עם משתמש מנהל):</p>
          <br/>
          <a href="${approveLink}" style="padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">צפייה ואישור הסרטון</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
