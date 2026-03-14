/**
 * Authentication utilities for BookkeeperAI.
 * Supports role-based access control: Client, CPA, Admin, Employee.
 *
 * In production, this would integrate with Clerk or NextAuth.js.
 * This module provides the type definitions and helper functions.
 */

export type UserRole = "client" | "cpa" | "admin" | "employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  entityIds?: string[];
  avatarUrl?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: number;
}

export const ROLE_PERMISSIONS = {
  client: {
    dashboard: true,
    documents: true,
    reports: true,
    messages: true,
    billing: true,
    entities: "own" as const,
  },
  cpa: {
    dashboard: true,
    documents: true,
    reports: true,
    messages: true,
    billing: true,
    entities: "assigned" as const,
    clients: true,
    bulkOperations: true,
    whiteLabel: true,
  },
  admin: {
    dashboard: true,
    documents: true,
    reports: true,
    messages: true,
    billing: true,
    entities: "all" as const,
    clients: true,
    team: true,
    workQueue: true,
    analytics: true,
    settings: true,
  },
  employee: {
    dashboard: true,
    documents: true,
    reports: true,
    messages: true,
    entities: "assigned" as const,
    workQueue: true,
  },
} as const;

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "client":
      return "/dashboard";
    case "cpa":
      return "/cpa";
    case "admin":
      return "/admin";
    case "employee":
      return "/admin";
    default:
      return "/dashboard";
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "client":
      return "Business Client";
    case "cpa":
      return "CPA Firm";
    case "admin":
      return "Administrator";
    case "employee":
      return "Team Member";
  }
}
