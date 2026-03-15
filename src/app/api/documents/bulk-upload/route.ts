import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
const ALLOWED_EXTENSIONS =
  /\.(pdf|jpg|jpeg|png|gif|webp|heic|txt|csv|xlsx|xls|docx|doc)$/i;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 20;

interface UploadResult {
  fileName: string;
  success: boolean;
  document?: Record<string, unknown>;
  error?: string;
}

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
    const entityId = formData.get("entityId") as string | null;
    const documentType = formData.get("documentType") as string | null;

    if (!entityId) {
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    // Collect all files from formData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed per request` },
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

    // Process each file
    const results: UploadResult[] = [];

    for (const file of files) {
      const result: UploadResult = { fileName: file.name, success: false };

      // Validate file type
      if (
        !ALLOWED_MIME_TYPES.includes(file.type) &&
        !ALLOWED_EXTENSIONS.test(file.name)
      ) {
        result.error =
          "File type not allowed. Please upload PDF, images, text, CSV, or Office documents.";
        results.push(result);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        result.error = "File too large. Maximum size is 25 MB.";
        results.push(result);
        continue;
      }

      try {
        // Upload to Supabase Storage
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
          result.error = "Failed to upload file to storage";
          results.push(result);
          continue;
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
          result.error = "Failed to create document record";
          results.push(result);
          continue;
        }

        // Log activity
        await supabase.from("activities").insert({
          user_id: user.id,
          entity_id: entityId,
          type: "document_uploaded",
          description: `Uploaded "${file.name}" to ${entity.name}`,
        });

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
          }).catch((err) =>
            console.error("AI analysis trigger error:", err)
          );
        } catch (aiTriggerError) {
          console.error("Failed to trigger AI analysis:", aiTriggerError);
        }

        result.success = true;
        result.document = document;
      } catch (fileError) {
        console.error(`Error processing file "${file.name}":`, fileError);
        result.error = "Unexpected error processing file";
      }

      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
        },
      },
      { status: successCount > 0 ? 201 : 400 }
    );
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
