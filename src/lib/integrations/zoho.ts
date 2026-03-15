/**
 * Zoho Books API integration for BookkeeperAI.
 *
 * Handles OAuth 2.0 flow, journal entries, chart of accounts,
 * and transaction syncing.
 *
 * Requires env vars:
 * - ZOHO_CLIENT_ID
 * - ZOHO_CLIENT_SECRET
 * - ZOHO_REDIRECT_URI
 * - ZOHO_ORGANIZATION_ID
 */

const ZOHO_AUTH_URL = "https://accounts.zoho.com/oauth/v2/auth";
const ZOHO_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";
const ZOHO_API_URL = "https://books.zoho.com/api/v3";

export interface ZohoTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  api_domain: string;
}

export interface ZohoAccount {
  account_id: string;
  account_name: string;
  account_type: string;
  account_code: string;
  is_active: boolean;
}

export interface ZohoJournalEntry {
  journal_date: string;
  reference_number?: string;
  notes?: string;
  line_items: Array<{
    account_id: string;
    debit_or_credit: "debit" | "credit";
    amount: number;
    description?: string;
  }>;
}

/**
 * Generate OAuth authorization URL for Zoho.
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOHO_CLIENT_ID || "",
    redirect_uri: process.env.ZOHO_REDIRECT_URI || "",
    scope: "ZohoBooks.fullaccess.all",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${ZOHO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<ZohoTokens> {
  const response = await fetch(ZOHO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ZOHO_CLIENT_ID || "",
      client_secret: process.env.ZOHO_CLIENT_SECRET || "",
      redirect_uri: process.env.ZOHO_REDIRECT_URI || "",
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Zoho token exchange failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<ZohoTokens> {
  const response = await fetch(ZOHO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ZOHO_CLIENT_ID || "",
      client_secret: process.env.ZOHO_CLIENT_SECRET || "",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Zoho token refresh failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated API request to Zoho Books.
 */
async function zohoRequest(
  accessToken: string,
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: unknown
): Promise<unknown> {
  const orgId = process.env.ZOHO_ORGANIZATION_ID || "";
  const url = `${ZOHO_API_URL}/${endpoint}${endpoint.includes("?") ? "&" : "?"}organization_id=${orgId}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Fetch the chart of accounts from Zoho Books.
 */
export async function getChartOfAccounts(
  accessToken: string
): Promise<ZohoAccount[]> {
  const result = await zohoRequest(
    accessToken,
    "chartofaccounts?filter_by=AccountType.Active"
  ) as { chartofaccounts?: ZohoAccount[] };

  return result.chartofaccounts || [];
}

/**
 * Create a journal entry in Zoho Books.
 */
export async function createJournalEntry(
  accessToken: string,
  entry: ZohoJournalEntry
): Promise<unknown> {
  return zohoRequest(
    accessToken,
    "journals",
    "POST",
    { journal: entry }
  );
}

/**
 * Sync a BookkeeperAI transaction to Zoho Books as a journal entry.
 */
export async function syncTransactionToZoho(
  accessToken: string,
  transaction: {
    date: string;
    description: string;
    amount: number;
    debitAccountId: string;
    creditAccountId: string;
    referenceNumber?: string;
  }
): Promise<unknown> {
  const journal: ZohoJournalEntry = {
    journal_date: transaction.date,
    reference_number: transaction.referenceNumber,
    notes: `BookkeeperAI: ${transaction.description}`,
    line_items: [
      {
        account_id: transaction.debitAccountId,
        debit_or_credit: "debit",
        amount: transaction.amount,
        description: transaction.description,
      },
      {
        account_id: transaction.creditAccountId,
        debit_or_credit: "credit",
        amount: transaction.amount,
        description: transaction.description,
      },
    ],
  };

  return createJournalEntry(accessToken, journal);
}
