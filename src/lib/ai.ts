/**
 * AI document processing using Anthropic Claude API.
 * Handles OCR, document classification, and transaction extraction.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  type: "debit" | "credit";
  vendor?: string;
  taxRelevant?: boolean;
  confidence: number;
}

export interface DocumentAnalysis {
  documentType: "invoice" | "receipt" | "bank_statement" | "tax_form" | "payroll" | "other";
  summary: string;
  vendor?: string;
  totalAmount?: number;
  currency?: string;
  documentDate?: string;
  dueDate?: string;
  invoiceNumber?: string;
  transactions: ExtractedTransaction[];
  taxCategories: string[];
  confidence: number;
  rawText: string;
}

const SYSTEM_PROMPT = `You are a professional bookkeeping AI assistant for BookkeeperAI, a Canadian bookkeeping service. Your job is to analyze financial documents and extract structured data.

You must respond with valid JSON only — no markdown, no explanation outside JSON.

For each document, extract:
1. Document type (invoice, receipt, bank_statement, tax_form, payroll, other)
2. Key metadata (vendor, date, amounts, invoice numbers)
3. Individual transactions with categories
4. Tax relevance flags

Use standard Canadian accounting categories:
- Revenue, Cost of Goods Sold, Operating Expenses, Payroll, Rent & Utilities,
  Office Supplies, Professional Fees, Insurance, Travel & Meals,
  Advertising & Marketing, Bank Fees, Interest, Taxes, Capital Assets, Other

Currency should default to CAD unless clearly stated otherwise.
Confidence scores should be 0.0-1.0 based on clarity of the data.`;

/**
 * Analyze a document image using Claude's vision capabilities.
 */
export async function analyzeDocumentImage(
  imageBase64: string,
  mimeType: string,
  fileName: string
): Promise<DocumentAnalysis> {
  const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Analyze this financial document (filename: "${fileName}"). Extract all text, transactions, and metadata. Respond with JSON matching this schema:
{
  "documentType": "invoice|receipt|bank_statement|tax_form|payroll|other",
  "summary": "Brief description of the document",
  "vendor": "Vendor/company name if applicable",
  "totalAmount": 0.00,
  "currency": "CAD",
  "documentDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or null",
  "invoiceNumber": "string or null",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Transaction description",
      "amount": 0.00,
      "currency": "CAD",
      "category": "Accounting category",
      "type": "debit|credit",
      "vendor": "Vendor name",
      "taxRelevant": true,
      "confidence": 0.95
    }
  ],
  "taxCategories": ["list of relevant tax categories"],
  "confidence": 0.95,
  "rawText": "All extracted text from the document"
}`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  try {
    const parsed = JSON.parse(textContent.text);
    return parsed as DocumentAnalysis;
  } catch {
    // If JSON parsing fails, return a basic analysis
    return {
      documentType: "other",
      summary: "Document could not be fully analyzed",
      transactions: [],
      taxCategories: [],
      confidence: 0.1,
      rawText: textContent.text,
    };
  }
}

/**
 * Analyze a PDF or text-based document using Claude.
 */
export async function analyzeDocumentText(
  text: string,
  fileName: string
): Promise<DocumentAnalysis> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze this financial document text (filename: "${fileName}"). Extract all transactions and metadata. Respond with JSON matching this schema:
{
  "documentType": "invoice|receipt|bank_statement|tax_form|payroll|other",
  "summary": "Brief description of the document",
  "vendor": "Vendor/company name if applicable",
  "totalAmount": 0.00,
  "currency": "CAD",
  "documentDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or null",
  "invoiceNumber": "string or null",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Transaction description",
      "amount": 0.00,
      "currency": "CAD",
      "category": "Accounting category",
      "type": "debit|credit",
      "vendor": "Vendor name",
      "taxRelevant": true,
      "confidence": 0.95
    }
  ],
  "taxCategories": ["list of relevant tax categories"],
  "confidence": 0.95,
  "rawText": "Original text preserved"
}

Document text:
${text}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  try {
    const parsed = JSON.parse(textContent.text);
    return parsed as DocumentAnalysis;
  } catch {
    return {
      documentType: "other",
      summary: "Document could not be fully analyzed",
      transactions: [],
      taxCategories: [],
      confidence: 0.1,
      rawText: text,
    };
  }
}

/**
 * Categorize a single transaction using AI.
 */
export async function categorizeTransaction(
  description: string,
  amount: number,
  vendor?: string
): Promise<{ category: string; taxRelevant: boolean; confidence: number }> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: "You are a Canadian bookkeeping categorization engine. Respond with JSON only: {\"category\": \"...\", \"taxRelevant\": true/false, \"confidence\": 0.0-1.0}",
    messages: [
      {
        role: "user",
        content: `Categorize this transaction:
Description: ${description}
Amount: $${amount.toFixed(2)}
${vendor ? `Vendor: ${vendor}` : ""}

Use one of: Revenue, Cost of Goods Sold, Operating Expenses, Payroll, Rent & Utilities, Office Supplies, Professional Fees, Insurance, Travel & Meals, Advertising & Marketing, Bank Fees, Interest, Taxes, Capital Assets, Other`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return { category: "Other", taxRelevant: false, confidence: 0.1 };
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return { category: "Other", taxRelevant: false, confidence: 0.1 };
  }
}
