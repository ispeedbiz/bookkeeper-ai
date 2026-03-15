"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UseRealtimeOptions<T extends Record<string, any> = Record<string, any>> {
  table: string;
  schema?: string;
  event?: PostgresChangeEvent;
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: T) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
  enabled?: boolean;
}

/**
 * Custom hook for Supabase Realtime subscriptions.
 * Automatically subscribes to Postgres changes on a table
 * and cleans up on unmount.
 *
 * Usage:
 *   useRealtimeSubscription({
 *     table: "documents",
 *     filter: `user_id=eq.${userId}`,
 *     onInsert: (doc) => setDocs(prev => [doc, ...prev]),
 *     onUpdate: (doc) => setDocs(prev => prev.map(d => d.id === doc.id ? doc : d)),
 *   });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRealtimeSubscription<T extends Record<string, any>>({
  table,
  schema = "public",
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    const channelConfig: {
      event: PostgresChangeEvent;
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(`realtime-${table}-${filter || "all"}`)
      .on(
        "postgres_changes" as never,
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          onChange?.(payload);

          const newRecord = payload.new as T;
          const oldRecord = payload.old as T;

          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(newRecord);
              break;
            case "UPDATE":
              onUpdate?.(newRecord);
              break;
            case "DELETE":
              onDelete?.(oldRecord);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, event, filter, enabled, onInsert, onUpdate, onDelete, onChange]);
}

/**
 * Subscribe to multiple tables at once.
 */
export function useMultiTableRealtime(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriptions: Array<UseRealtimeOptions<Record<string, any>>>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channels: RealtimeChannel[] = [];

    for (const sub of subscriptions) {
      const channelConfig: {
        event: PostgresChangeEvent;
        schema: string;
        table: string;
        filter?: string;
      } = {
        event: sub.event || "*",
        schema: sub.schema || "public",
        table: sub.table,
      };

      if (sub.filter) {
        channelConfig.filter = sub.filter;
      }

      const channel = supabase
        .channel(`realtime-multi-${sub.table}-${sub.filter || "all"}`)
        .on(
          "postgres_changes" as never,
          channelConfig,
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            sub.onChange?.(payload);
            const newRecord = payload.new as Record<string, any>;
            const oldRecord = payload.old as Record<string, any>;

            switch (payload.eventType) {
              case "INSERT":
                sub.onInsert?.(newRecord);
                break;
              case "UPDATE":
                sub.onUpdate?.(newRecord);
                break;
              case "DELETE":
                sub.onDelete?.(oldRecord);
                break;
            }
          }
        )
        .subscribe();

      channels.push(channel);
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(subscriptions.map((s) => `${s.table}:${s.filter}`))]);
}
