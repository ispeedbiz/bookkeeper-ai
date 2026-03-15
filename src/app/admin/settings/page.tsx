"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Save,
  Globe,
  Mail,
  CreditCard,
  Database,
  Bell,
  Shield,
} from "lucide-react";

interface SettingSection {
  title: string;
  icon: typeof Globe;
  fields: { label: string; value: string; type: string; disabled?: boolean }[];
}

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);

  const sections: SettingSection[] = [
    {
      title: "General",
      icon: Globe,
      fields: [
        { label: "App Name", value: "BookkeeperAI", type: "text" },
        { label: "App URL", value: "https://bookkeeperai.ca", type: "url" },
        { label: "Support Email", value: "support@bookkeeperai.ca", type: "email" },
        { label: "Company", value: "SMS360S LLP", type: "text" },
      ],
    },
    {
      title: "Email (Resend)",
      icon: Mail,
      fields: [
        { label: "From Email", value: "BookkeeperAI <onboarding@resend.dev>", type: "text" },
        { label: "API Key Status", value: "Connected", type: "text", disabled: true },
        { label: "Admin Notification", value: "catchjagdish@gmail.com", type: "email" },
      ],
    },
    {
      title: "Stripe Billing",
      icon: CreditCard,
      fields: [
        { label: "Mode", value: "Test", type: "text", disabled: true },
        { label: "Secret Key", value: "Connected", type: "text", disabled: true },
        { label: "Webhook", value: "Connected", type: "text", disabled: true },
        { label: "Trial Period", value: "14 days", type: "text" },
      ],
    },
    {
      title: "Database (Supabase)",
      icon: Database,
      fields: [
        { label: "Status", value: "Connected", type: "text", disabled: true },
        { label: "Region", value: "us-east-1", type: "text", disabled: true },
        { label: "RLS Enabled", value: "Yes - All tables", type: "text", disabled: true },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      fields: [
        { label: "New Signup Alerts", value: "enabled", type: "text" },
        { label: "Payment Alerts", value: "enabled", type: "text" },
        { label: "Error Alerts", value: "enabled", type: "text" },
        { label: "Tawk.to Chat", value: "Enabled", type: "text", disabled: true },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      fields: [
        { label: "Password Policy", value: "8+ chars, upper, lower, number, special", type: "text", disabled: true },
        { label: "Rate Limiting", value: "5 registrations / 15 min / IP", type: "text", disabled: true },
        { label: "File Upload Limit", value: "25 MB", type: "text" },
        { label: "Allowed File Types", value: "PDF, Images, Text, CSV, Office", type: "text", disabled: true },
      ],
    },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Settings" />
      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
            <p className="mt-1 text-slate-400">
              Configure platform-wide settings. Sensitive values are managed via environment variables.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-medium text-navy-950 hover:bg-teal-300 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="glass-card rounded-xl p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Icon className="h-5 w-5 text-teal-400" />
                  {section.title}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.label}>
                      <label className="block text-xs text-slate-500 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        defaultValue={field.value}
                        disabled={field.disabled}
                        className={`w-full rounded-lg border border-navy-600 bg-navy-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-teal-400/50 ${
                          field.disabled ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
