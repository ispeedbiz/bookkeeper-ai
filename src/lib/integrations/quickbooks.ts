/**
 * QuickBooks Online API integration for BookkeeperAI.
 *
 * Handles OAuth 2.0 flow, journal entries, chart of accounts,
 * invoice syncing, and expense tracking.
 *
 * Requires env vars:
 * - QUICKBOOKS_CLIENT_ID
 * - QUICKBOOKS_CLIENT_SECRET
 * - QUICKBOOKS_REDIRECT_URI
 * - QUICKBOOKS_ENVIRONMENT ("sandbox" | "production")
 */

const QBO_BASE_URL = process.env.QUICKBOOKS_ENVIRONMENT === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";

const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export interface QBOTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  x_refresh_token_expires_in: number;
}

export interface QBOAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType: string;
  CurrentBalance: number;
  Active: boolean;
}

export interface QBOJournalEntry {
  TxnDate: string;
  Line: Array<{
    Amount: number;
    Description?: string;
    DetailType: "JournalEntryLineDetail";
    JournalEntryLineDetail: {
      PostingType: "Debit" | "Credit";
      AccountRef: { value: string; name?: string };
    };
  }>;
}

/**
 * Generate OAuth authorization URL for QuickBooks.
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QUICKBOOKS_CLIENT_ID || "",
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI || "",
    state,
  });

  return `${QBO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<QBOTokens> {
  const credentials = Buffer.from(
    `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI || "",
    }),
  });

  if (!response.ok) {
    throw new Error(`QBO token exchange failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<QBOTokens> {
  const credentials = Buffer.from(
    `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`QBO token refresh failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated API request to QuickBooks.
 */
async function qboRequest(
  accessToken: string,
  realmId: string,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<unknown> {
  const url = `${QBO_BASE_URL}/v3/company/${realmId}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QBO API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Fetch the chart of accounts from QuickBooks.
 */
export async function getChartOfAccounts(
  accessToken: string,
  realmId: string
): Promise<QBOAccount[]> {
  const result = await qboRequest(
    accessToken,
    realmId,
    "query?query=SELECT * FROM Account WHERE Active = true ORDERBY Name&minorversion=65"
  ) as { QueryResponse?: { Account?: QBOAccount[] } };

  return result.QueryResponse?.Account || [];
}

/**
 * Create a journal entry in QuickBooks.
 */
export async function createJournalEntry(
  accessToken: string,
  realmId: string,
  entry: QBOJournalEntry
): Promise<unknown> {
  return qboRequest(
    accessToken,
    realmId,
    "journalentry?minorversion=65",
    "POST",
    entry
  );
}

/**
 * Fetch recent transactions from QuickBooks.
 */
export async function getRecentTransactions(
  accessToken: string,
  realmId: string,
  startDate: string,
  endDate: string
): Promise<unknown> {
  const query = `SELECT * FROM JournalEntry WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 100`;
  return qboRequest(
    accessToken,
    realmId,
    `query?query=${encodeURIComponent(query)}&minorversion=65`
  );
}

/**
 * Sync a BookkeeperAI transaction to QuickBooks as a journal entry.
 */
export async function syncTransactionToQBO(
  accessToken: string,
  realmId: string,
  transaction: {
    date: string;
    description: string;
    amount: number;
    debitAccountId: string;
    creditAccountId: string;
  }
): Promise<unknown> {
  const journalEntry: QBOJournalEntry = {
    TxnDate: transaction.date,
    Line: [
      {
        Amount: transaction.amount,
        Description: transaction.description,
        DetailType: "JournalEntryLineDetail",
        JournalEntryLineDetail: {
          PostingType: "Debit",
          AccountRef: { value: transaction.debitAccountId },
        },
      },
      {
        Amount: transaction.amount,
        Description: transaction.description,
        DetailType: "JournalEntryLineDetail",
        JournalEntryLineDetail: {
          PostingType: "Credit",
          AccountRef: { value: transaction.creditAccountId },
        },
      },
    ],
  };

  return createJournalEntry(accessToken, realmId, journalEntry);
}
