import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/emails/send";
import { contactFormEmail } from "@/lib/emails/templates";
import { COMPANY } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Send notification email to admin
    await sendEmail({
      to: COMPANY.email,
      subject: `New Contact Form Submission from ${name}`,
      html: contactFormEmail(name, email, company || "", message),
    });

    // Send confirmation email to submitter
    await sendEmail({
      to: email,
      subject: "We received your message - BookkeeperAI",
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background-color:#050a18;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">BookkeeperAI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#334155;font-size:15px;line-height:1.7;">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Thank You, ${name}!</h2>
            <p style="margin:0 0 12px;">We've received your message and our team will get back to you within 24 hours.</p>
            <p style="margin:0 0 12px;">In the meantime, feel free to explore our website or reach out directly:</p>
            <ul style="margin:0 0 12px;padding-left:20px;">
              <li style="margin-bottom:8px;">Phone: ${COMPANY.phone.us}</li>
              <li style="margin-bottom:8px;">Email: <a href="mailto:${COMPANY.email}" style="color:#14b8a6;">${COMPANY.email}</a></li>
            </ul>
            <p style="margin:0;">We look forward to speaking with you!</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              ${COMPANY.name} | ${COMPANY.address} | ${COMPANY.phone.us}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
