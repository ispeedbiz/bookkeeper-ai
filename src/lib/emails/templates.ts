import { COMPANY } from "@/lib/constants";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#050a18;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">BookkeeperAI</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#334155;font-size:15px;line-height:1.7;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-align:center;">
              ${COMPANY.name} &mdash; ${COMPANY.tagline}
            </p>
            <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;text-align:center;">
              ${COMPANY.address}
            </p>
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              ${COMPANY.phone.us} | ${COMPANY.email}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="border-radius:8px;background-color:#14b8a6;">
    <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
      ${text}
    </a>
  </td></tr>
</table>`;
}

export function welcomeEmail(
  name: string,
  companyName: string,
  dashboardUrl: string
): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Welcome to BookkeeperAI, ${name}!</h2>
    <p style="margin:0 0 12px;">We're thrilled to have <strong>${companyName}</strong> on board. Your account is all set up and ready to go.</p>
    <p style="margin:0 0 12px;">Here's what you can do next:</p>
    <ul style="margin:0 0 12px;padding-left:20px;">
      <li style="margin-bottom:8px;">Upload your first documents</li>
      <li style="margin-bottom:8px;">Add your business entities</li>
      <li style="margin-bottom:8px;">Explore the AI-powered dashboard</li>
    </ul>
    ${ctaButton("Go to Dashboard", dashboardUrl)}
    <p style="margin:0;">If you need help getting started, just reply to this email or reach out at <a href="mailto:${COMPANY.email}" style="color:#14b8a6;">${COMPANY.email}</a>.</p>
  `);
}

export function trialStartedEmail(
  name: string,
  trialEndDate: string
): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Your 14-Day Trial Has Begun</h2>
    <p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">Your free trial is now active and runs until <strong>${trialEndDate}</strong>. During this time you have full access to all BookkeeperAI features.</p>
    <p style="margin:0 0 12px;">Make the most of your trial:</p>
    <ul style="margin:0 0 12px;padding-left:20px;">
      <li style="margin-bottom:8px;">Upload documents for AI-powered categorization</li>
      <li style="margin-bottom:8px;">Experience 3-day SLA delivery</li>
      <li style="margin-bottom:8px;">Get real-time financial insights</li>
    </ul>
    <p style="margin:0;">No credit card required during the trial. Questions? Contact us at <a href="mailto:${COMPANY.email}" style="color:#14b8a6;">${COMPANY.email}</a>.</p>
  `);
}

export function trialEndingEmail(
  name: string,
  daysLeft: number,
  upgradeUrl: string
): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Your Trial Ends in ${daysLeft} Day${daysLeft === 1 ? "" : "s"}</h2>
    <p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">Your BookkeeperAI trial is ending soon. To keep uninterrupted access to your bookkeeping dashboard, documents, and AI insights, upgrade to a paid plan today.</p>
    <p style="margin:0 0 12px;">All your data and history will be preserved when you upgrade.</p>
    ${ctaButton("Upgrade Now", upgradeUrl)}
    <p style="margin:0;">Need more time? Reply to this email and we'll be happy to help.</p>
  `);
}

export function documentReceivedEmail(
  name: string,
  fileName: string,
  entityName: string
): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Document Received</h2>
    <p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">We've received your document and it's now being processed.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border:1px solid #e2e8f0;border-radius:8px;">
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">File</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${fileName}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;">Entity</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;">${entityName}</td>
      </tr>
    </table>
    <p style="margin:0;">Our team will process this within our 3-business-day SLA. You'll receive another email when the review is complete.</p>
  `);
}

export function documentReviewedEmail(
  name: string,
  fileName: string,
  status: string,
  notes: string
): string {
  const statusColor = status === "approved" ? "#14b8a6" : status === "rejected" ? "#f43f5e" : "#fbbf24";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Document Status Updated</h2>
    <p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">Your document <strong>${fileName}</strong> has been reviewed.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border:1px solid #e2e8f0;border-radius:8px;">
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Status</td>
        <td style="padding:12px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;padding:4px 12px;border-radius:20px;background-color:${statusColor}20;color:${statusColor};">${statusLabel}</span>
        </td>
      </tr>
      ${notes ? `<tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;">Notes</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;">${notes}</td>
      </tr>` : ""}
    </table>
    <p style="margin:0;">Log in to your dashboard to view the full details.</p>
  `);
}

export function subscriptionConfirmedEmail(
  name: string,
  planName: string,
  amount: string
): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Payment Confirmed</h2>
    <p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">Your subscription has been confirmed. Here are the details:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border:1px solid #e2e8f0;border-radius:8px;">
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Plan</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${planName}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;">Amount</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;">${amount}</td>
      </tr>
    </table>
    <p style="margin:0;">Thank you for choosing BookkeeperAI. If you have any billing questions, contact us at <a href="mailto:${COMPANY.email}" style="color:#14b8a6;">${COMPANY.email}</a>.</p>
  `);
}

export function subscriptionCancelledEmail(name: string): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Subscription Cancelled</h2>
    <p style="margin:0 0 12px;">Hi ${name},</p>
    <p style="margin:0 0 12px;">Your BookkeeperAI subscription has been cancelled. You'll continue to have access until the end of your current billing period.</p>
    <p style="margin:0 0 12px;">We're sorry to see you go. If there's anything we could have done better, we'd love to hear your feedback.</p>
    <p style="margin:0;">You can reactivate your subscription at any time from your dashboard. Your data will be preserved for 90 days.</p>
  `);
}

export function adminNewUserEmail(
  userName: string,
  userEmail: string,
  companyName: string
): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">New User Signup</h2>
    <p style="margin:0 0 12px;">A new user has registered on BookkeeperAI:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border:1px solid #e2e8f0;border-radius:8px;">
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Name</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${userName}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Email</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${userEmail}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;">Company</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;">${companyName || "Not provided"}</td>
      </tr>
    </table>
    <p style="margin:0;">Log in to the admin dashboard to review this user.</p>
  `);
}

export function contactFormEmail(
  name: string,
  email: string,
  company: string,
  message: string
): string {
  return layout(`
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">New Contact Form Submission</h2>
    <p style="margin:0 0 12px;">A new message has been received through the website contact form:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border:1px solid #e2e8f0;border-radius:8px;">
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Name</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${name}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Email</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;"><a href="mailto:${email}" style="color:#14b8a6;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">Company</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${company || "Not provided"}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;" colspan="2">
          <strong>Message:</strong><br/><br/>
          ${message.replace(/\n/g, "<br/>")}
        </td>
      </tr>
    </table>
    <p style="margin:0;">Reply directly to <a href="mailto:${email}" style="color:#14b8a6;">${email}</a> to respond.</p>
  `);
}
