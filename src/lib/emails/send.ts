import { resend } from "@/lib/resend";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "BookkeeperAI <onboarding@resend.dev>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("Failed to send email:", error);
    }
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
