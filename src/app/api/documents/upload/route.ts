import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityId = formData.get("entityId") as string | null;
    const documentType = formData.get("documentType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!entityId) {
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    // Verify entity belongs to user
    const { data: entity } = await supabase
      .from("entities")
      .select("id, name")
      .eq("id", entityId)
      .eq("user_id", user.id)
      .single();

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found or unauthorized" },
        { status: 403 }
      );
    }

    // Upload file to Supabase Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${entityId}/${timestamp}_${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(storagePath);

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        entity_id: entityId,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        type: documentType || "other",
        status: "uploaded",
      })
      .select()
      .single();

    if (docError) {
      console.error("Document record error:", docError);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    // Create activity record
    await supabase.from("activities").insert({
      user_id: user.id,
      entity_id: entityId,
      type: "document_uploaded",
      description: `Uploaded "${file.name}" to ${entity.name}`,
    });

    // Send confirmation email via Resend
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      const recipientEmail = profile?.email || user.email;
      const recipientName = profile?.full_name || "there";

      if (recipientEmail) {
        await resend.emails.send({
          from: "BookkeeperAI <support@bookkeeperai.ca>",
          to: recipientEmail,
          subject: "Document Received - BookkeeperAI",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #050a18;">Document Received</h2>
              <p>Hi ${recipientName},</p>
              <p>We received your document <strong>"${file.name}"</strong> for <strong>${entity.name}</strong>.</p>
              <p>Our team will review it shortly. You can track its status in your dashboard.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="color: #6b7280; font-size: 14px;">BookkeeperAI by SMS360S LLP</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      // Log but don't fail the upload if email fails
      console.error("Email notification error:", emailError);
    }

    // Trigger AI analysis in the background (non-blocking)
    try {
      const analyzeUrl = new URL("/api/documents/analyze", request.url);
      fetch(analyzeUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ documentId: document.id }),
      }).catch((err) => console.error("AI analysis trigger error:", err));
    } catch (aiTriggerError) {
      console.error("Failed to trigger AI analysis:", aiTriggerError);
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
