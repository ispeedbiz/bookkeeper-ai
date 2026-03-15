/**
 * Xero API integration for BookkeeperAI.
 *
 * Handles OAuth 2.0 flow, journal entries, chart of accounts,
 * invoice syncing, and bank reconciliation.
 *
 * Requires env vars:
 * - XERO_CLIENT_ID
 * - XERO_CLIENT_SECRET
 * - XERO_REDIRECT_URI
 */

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_URL = "https://api.xero.com/api.xro/2.0";

export interface XeroTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

export interface XeroAccount {
  AccountID: string;
  Name: string;
  Type: string;
  Code: string;
  Status: string;
  Class: string;
}

export interface XeroJournalEntry {
  Date: string;
  Status: "DRAFT" | "POSTED";
  JournalLines: Array<{
    LineAmount: number;
    AccountCode: string;
    Description?: string;
  }>;
}

/**
 * Generate OAuth authorization URL for Xero.
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.XERO_CLIENT_ID || "",
    redirect_uri: process.env.XERO_REDIRECT_URI || "",
    scope: "openid profile email accounting.transactions accounting.settings accounting.contacts offline_access",
    state,
  });

  return `${XERO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<XeroTokens> {
  const credentials = Buffer.from(
    `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.XERO_REDIRECT_URI || "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Xero token exchange failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<XeroTokens> {
  const credentials = Buffer.from(
    `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Xero token refresh failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated API request to Xero.
 */
async function xeroRequest(
  accessToken: string,
  tenantId: string,
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: unknown
): Promise<unknown> {
  const url = `${XERO_API_URL}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Xero API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Fetch the chart of accounts from Xero.
 */
export async function getChartOfAccounts(
  accessToken: string,
  tenantId: string
): Promise<XeroAccount[]> {
  const result = await xeroRequest(
    accessToken,
    tenantId,
    "Accounts?where=Status%3D%22ACTIVE%22"
  ) as { Accounts?: XeroAccount[] };

  return result.Accounts || [];
}

/**
 * Create a manual journal in Xero.
 */
export async function createManualJournal(
  accessToken: string,
  tenantId: string,
  entry: XeroJournalEntry
): Promise<unknown> {
  return xeroRequest(
    accessToken,
    tenantId,
    "ManualJournals",
    "POST",
    { ManualJournals: [{ Narration: "BookkeeperAI Entry", ...entry }] }
  );
}

/**
 * Get tenant connections (organizations) for a Xero user.
 */
export async function getTenantConnections(accessToken: string): Promise<Array<{
  tenantId: string;
  tenantName: string;
  tenantType: string;
}>> {
  const response = await fetch("https://api.xero.com/connections", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Xero connections failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Sync a BookkeeperAI transaction to Xero as a manual journal.
 */
export async function syncTransactionToXero(
  accessToken: string,
  tenantId: string,
  transaction: {
    date: string;
    description: string;
    amount: number;
    debitAccountCode: string;
    creditAccountCode: string;
  }
): Promise<unknown> {
  const journal: XeroJournalEntry = {
    Date: transaction.date,
    Status: "DRAFT",
    JournalLines: [
      {
        LineAmount: transaction.amount,
        AccountCode: transaction.debitAccountCode,
        Description: transaction.description,
      },
      {
        LineAmount: -transaction.amount,
        AccountCode: transaction.creditAccountCode,
        Description: transaction.description,
      },
    ],
  };

  return createManualJournal(accessToken, tenantId, journal);
}
