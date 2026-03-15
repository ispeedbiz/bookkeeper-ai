import { createServiceRoleClient } from "@/lib/supabase/server";

export type ActivityType =
  | "account_created"
  | "login"
  | "document_uploaded"
  | "document_status_changed"
  | "subscription_created"
  | "subscription_cancelled"
  | "payment_received"
  | "entity_created"
  | "profile_updated"
  | "message_sent";

export async function logActivity(params: {
  userId: string;
  entityId?: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from("activities").insert({
      user_id: params.userId,
      entity_id: params.entityId || null,
      type: params.type,
      description: params.description,
      metadata: params.metadata || null,
    });
    if (error) {
      console.error("Failed to log activity:", error.message);
    }
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
