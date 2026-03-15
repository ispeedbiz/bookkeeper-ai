"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Bot,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  content: string;
  sender: "user" | "system" | "admin";
  created_at: string;
  read: boolean;
}

export default function MessagesPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("messages").insert({
        user_id: user.id,
        content: newMessage.trim(),
        sender: "user",
        read: false,
      });

      if (error) throw error;
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Messages" />

      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            <MessageSquare className="mr-2 inline h-6 w-6 text-teal-400" />
            Messages
          </h1>
          <p className="mt-1 text-slate-400">
            Communicate with your bookkeeping team.
          </p>
        </div>

        <div className="glass-card flex h-[calc(100vh-220px)] flex-col rounded-xl">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageSquare className="h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-lg font-semibold text-white">
                  No messages yet
                </h3>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  Send a message to your bookkeeping team. They&apos;ll respond
                  during business hours (Mon-Fri, 9am-6pm EST).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.sender === "user"
                          ? "bg-teal-500/10"
                          : msg.sender === "admin"
                            ? "bg-gold-400/10"
                            : "bg-cyan-400/10"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <User className="h-4 w-4 text-teal-400" />
                      ) : (
                        <Bot className="h-4 w-4 text-gold-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        msg.sender === "user"
                          ? "bg-teal-500/10 text-teal-100"
                          : "bg-navy-800 text-slate-200"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {new Date(msg.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-navy-700/50 p-4">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 font-medium text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
