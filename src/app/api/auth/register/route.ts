import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { fullName, email, companyName, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // 1. Create auth user with email confirmed
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          company_name: companyName || "",
          role: "client",
        },
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Ensure profile exists (trigger should create it, but fallback if not)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existingProfile) {
      // Trigger may not have fired; create profile manually
      await supabase.from("profiles").insert({
        id: userId,
        email,
        full_name: fullName,
        company_name: companyName || "",
        role: "client",
      });
    }

    // 3. Create entity
    const { data: entity, error: entityError } = await supabase
      .from("entities")
      .insert({
        user_id: userId,
        name: companyName || `${fullName}'s Business`,
        type: "business",
        status: "onboarding",
      })
      .select("id")
      .single();

    if (entityError) {
      console.error("Entity creation error:", entityError);
    }

    const entityId = entity?.id;

    // 4. Create subscription with 14-day trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan: "essential",
      status: "trialing",
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
      entity_limit: 1,
    });

    if (subError) {
      console.error("Subscription creation error:", subError);
    }

    // 5. Log activity
    const { error: activityError } = await supabase
      .from("activities")
      .insert({
        user_id: userId,
        entity_id: entityId || null,
        type: "account_created",
        description: `Account created for ${fullName} (${email}). Company: ${companyName || "N/A"}. 14-day trial started.`,
      });

    if (activityError) {
      console.error("Activity log error:", activityError);
    }

    // 6. Send welcome email
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bookkeeper-ai.vercel.app"}/dashboard`;

    try {
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "BookkeeperAI <onboarding@resend.dev>",
        to: email,
        subject: "Welcome to BookkeeperAI — Your 14-Day Free Trial",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050a18; color: #e2e8f0; padding: 40px 24px; border-radius: 16px;">
            <h1 style="color: #2dd4bf; font-size: 28px; margin-bottom: 8px;">Welcome to BookkeeperAI!</h1>
            <p style="color: #94a3b8; font-size: 16px; margin-bottom: 24px;">Hi ${fullName},</p>
            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
              Your 14-day free trial has started. You now have access to AI-powered bookkeeping
              that saves you time and keeps your finances accurate.
            </p>
            <div style="margin: 32px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2dd4bf, #14b8a6); color: #050a18; font-weight: 600; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 15px;">
                Go to Your Dashboard
              </a>
            </div>
            <div style="background: #0f172a; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px;">Your trial includes:</p>
              <ul style="color: #cbd5e1; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>1 business entity</li>
                <li>AI-powered document processing</li>
                <li>Real-time financial dashboard</li>
                <li>Secure document storage</li>
              </ul>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-top: 32px;">
              Questions? Reply to this email or contact us at accounts@sms360s.com
            </p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="color: #475569; font-size: 12px;">BookkeeperAI by SMS360S LLP</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Welcome email error:", emailError);
    }

    // 7. Notify admin
    try {
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "BookkeeperAI <onboarding@resend.dev>",
        to: "catchjagdish@gmail.com",
        subject: `New Signup: ${fullName} (${email})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New BookkeeperAI Signup</h2>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${companyName || "N/A"}</p>
            <p><strong>Plan:</strong> Essential (14-day trial)</p>
            <p><strong>Date:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
      });
    } catch (adminEmailError) {
      console.error("Admin notification error:", adminEmailError);
    }

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
