import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { analyzeDocumentImage, analyzeDocumentText, type DocumentAnalysis } from "@/lib/ai";

/**
 * POST /api/documents/analyze
 * AI-powered document analysis endpoint.
 * Accepts a document ID, fetches the file, runs Claude AI analysis,
 * and stores the results back to the database.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = await createServiceRoleClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Fetch document record
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update status to processing
    await serviceClient
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    let analysis: DocumentAnalysis;

    const isImage = document.mime_type?.startsWith("image/");

    if (isImage) {
      // Download image from storage and convert to base64
      const storagePath = extractStoragePath(document.file_url);
      const { data: fileData, error: downloadError } = await serviceClient.storage
        .from("documents")
        .download(storagePath);

      if (downloadError || !fileData) {
        await serviceClient
          .from("documents")
          .update({ status: "uploaded", notes: "AI analysis failed: could not download file" })
          .eq("id", documentId);
        return NextResponse.json(
          { error: "Failed to download file for analysis" },
          { status: 500 }
        );
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      analysis = await analyzeDocumentImage(
        base64,
        document.mime_type,
        document.file_name
      );
    } else {
      // For PDFs and other text-based docs, extract text or use filename
      const storagePath = extractStoragePath(document.file_url);
      const { data: fileData } = await serviceClient.storage
        .from("documents")
        .download(storagePath);

      let textContent = `Document: ${document.file_name}\nType: ${document.type}\nSize: ${document.file_size} bytes`;

      if (fileData) {
        try {
          const text = await fileData.text();
          // Only use text content if it appears to be actual text
          if (text && text.length > 10 && !isBinaryContent(text)) {
            textContent = text;
          }
        } catch {
          // Keep default text content
        }
      }

      analysis = await analyzeDocumentText(textContent, document.file_name);
    }

    // Store AI analysis results in document metadata
    const updateData: Record<string, unknown> = {
      status: "reviewed",
      notes: analysis.summary,
      ai_analysis: analysis,
      ai_document_type: analysis.documentType,
      ai_confidence: analysis.confidence,
      ai_vendor: analysis.vendor || null,
      ai_total_amount: analysis.totalAmount || null,
      ai_currency: analysis.currency || "CAD",
      ai_analyzed_at: new Date().toISOString(),
    };

    // Auto-correct document type if AI is confident
    if (analysis.confidence >= 0.8 && analysis.documentType !== "other") {
      updateData.type = analysis.documentType;
    }

    await serviceClient
      .from("documents")
      .update(updateData)
      .eq("id", documentId);

    // Store extracted transactions
    if (analysis.transactions.length > 0) {
      const transactionRecords = analysis.transactions.map((t) => ({
        document_id: documentId,
        entity_id: document.entity_id,
        user_id: user.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        currency: t.currency || "CAD",
        category: t.category,
        type: t.type,
        vendor: t.vendor || null,
        tax_relevant: t.taxRelevant || false,
        ai_confidence: t.confidence,
      }));

      await serviceClient.from("transactions").insert(transactionRecords);
    }

    // Log activity
    await serviceClient.from("activities").insert({
      user_id: user.id,
      entity_id: document.entity_id,
      type: "document_status_changed",
      description: `AI analyzed "${document.file_name}": ${analysis.summary}`,
      metadata: {
        document_id: documentId,
        ai_type: analysis.documentType,
        ai_confidence: analysis.confidence,
        transaction_count: analysis.transactions.length,
      },
    });

    return NextResponse.json({
      analysis,
      transactionCount: analysis.transactions.length,
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Extract the storage path from a Supabase public URL.
 */
function extractStoragePath(publicUrl: string): string {
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
  return match ? decodeURIComponent(match[1]) : publicUrl;
}

/**
 * Check if content appears to be binary (not readable text).
 */
function isBinaryContent(text: string): boolean {
  const nonPrintable = text.slice(0, 500).split("").filter((c) => {
    const code = c.charCodeAt(0);
    return code < 32 && code !== 10 && code !== 13 && code !== 9;
  }).length;
  return nonPrintable > 50;
}
