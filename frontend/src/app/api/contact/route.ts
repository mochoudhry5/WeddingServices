import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    console.log("SMTP Configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER?.slice(0, 3) + "***",
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Send form submission to support
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    // Extract user's name and email from the form submission HTML
    const nameMatch = html.match(
      /From:<\/strong>\s*<span[^>]*>([^<]+)<\/span>/
    );
    const emailMatch = html.match(
      /Email:<\/strong>\s*<span[^>]*>([^<]+)<\/span>/
    );
    
    const userEmail = emailMatch ? emailMatch[1].trim() : null;

    // Send auto-response to user
    const autoResponseHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>We've Received Your Message</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #78716c, #44403c); padding: 2px; border-radius: 8px;">
              <div style="background-color: white; padding: 30px; border-radius: 6px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #44403c; font-size: 24px; margin: 0; padding-bottom: 10px; border-bottom: 2px solid #f3f4f6;">
                    Thank You for Contacting Us
                  </h1>
                </div>

                <!-- Content -->
                <div style="margin-top: 20px; color: #4b5563;">
                  <p>Hi There,</p>
                  
                  <p>This email confirms that we've received your message. Our team will review it and get back to you within 24 hours.</p>
                  
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
                    <h2 style="color: #44403c; font-size: 18px; margin: 0 0 15px 0;">What to Expect</h2>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                      <li style="margin-bottom: 8px;">Our support team reviews all inquiries during business hours</li>
                      <li style="margin-bottom: 8px;">You'll receive a personalized response within 24 hours</li>
                      <li>For urgent matters, please email us directly at support@anyweds.com</li>
                    </ul>
                  </div>

                  <p>We appreciate your patience and look forward to assisting you.</p>
                  
                  <p style="margin-top: 20px;">Best regards,<br>The AnyWeds Team</p>
                </div>

                <!-- Footer -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 14px;">
                  <p style="margin: 0;">This is an automated response to your contact form submission.</p>
                  <p style="margin: 5px 0 0 0;">© 2024 AnyWeds. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    if (userEmail) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: userEmail,
        subject: "We've Received Your Message - AnyWeds Support",
        html: autoResponseHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
