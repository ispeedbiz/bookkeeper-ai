"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  User,
  Lock,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
}

export default function SettingsPage() {
  const supabase = createClient();

  // Profile state
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, company_name")
        .eq("id", user.id)
        .single();

      setProfile({
        full_name: data?.full_name || "",
        email: user.email || "",
        phone: data?.phone || "",
        company_name: data?.company_name || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showToast("error", "You must be logged in to update your profile.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          company_name: profile.company_name,
        })
        .eq("id", user.id);

      if (error) {
        showToast("error", error.message);
      } else {
        showToast("success", "Profile updated successfully.");
      }
    } catch {
      showToast("error", "Failed to update profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      showToast("error", "Password must be at least 8 characters long.");
      return;
    }

    setPasswordSaving(true);

    try {
      // Verify current password by attempting sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });

      if (signInError) {
        showToast("error", "Current password is incorrect.");
        setPasswordSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showToast("error", error.message);
      } else {
        showToast("success", "Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      showToast("error", "Failed to change password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Sign out and note: actual account deletion requires admin/service role
      // In production, this would call a server-side endpoint
      await supabase.auth.signOut();
      window.location.href = "/login?deleted=true";
    } catch {
      showToast("error", "Failed to delete account. Please contact support.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Settings" />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            <Settings className="mr-2 inline h-6 w-6 text-teal-400" />
            Settings
          </h1>
          <p className="mt-1 text-slate-400">
            Manage your profile, security, and account preferences.
          </p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 ${
              toast.type === "success"
                ? "border-teal-400/30 bg-teal-500/10"
                : "border-coral-400/30 bg-coral-400/10"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-teal-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-coral-400" />
            )}
            <p
              className={`text-sm ${
                toast.type === "success" ? "text-teal-300" : "text-coral-300"
              }`}
            >
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className={`ml-auto ${
                toast.type === "success"
                  ? "text-teal-400 hover:text-teal-300"
                  : "text-coral-400 hover:text-coral-300"
              }`}
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {profileLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        ) : (
          <div className="max-w-2xl space-y-8">
            {/* Profile Section */}
            <div className="glass-card rounded-xl p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-teal-500/10 p-2">
                  <User className="h-5 w-5 text-teal-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Profile Information
                </h2>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-white outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-lg border border-navy-700 bg-navy-800/50 px-4 py-2.5 text-slate-400 outline-none cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Email cannot be changed. Contact support if you need to
                    update it.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-white outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={profile.company_name}
                    onChange={(e) =>
                      setProfile({ ...profile, company_name: e.target.value })
                    }
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-white outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
                    placeholder="Your company name"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex items-center gap-2 rounded-lg bg-teal-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Section */}
            <div className="glass-card rounded-xl p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-teal-500/10 p-2">
                  <Lock className="h-5 w-5 text-teal-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Change Password
                </h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 pr-10 text-white outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 pr-10 text-white outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 pr-10 text-white outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20"
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-coral-400">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={
                      passwordSaving ||
                      !currentPassword ||
                      !newPassword ||
                      newPassword !== confirmPassword
                    }
                    className="flex items-center gap-2 rounded-lg bg-teal-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-50"
                  >
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    Change Password
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-coral-400/30 bg-coral-400/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-coral-400/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-coral-400" />
                </div>
                <h2 className="text-lg font-semibold text-coral-400">
                  Danger Zone
                </h2>
              </div>
              <p className="mb-4 text-sm text-slate-400">
                Once you delete your account, all of your data will be
                permanently removed. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 rounded-lg border border-coral-400/30 bg-coral-400/10 px-4 py-2.5 text-sm font-semibold text-coral-400 transition-colors hover:bg-coral-400/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-navy-700/50 bg-navy-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-coral-400/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-coral-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Delete Account
                </h3>
              </div>
              <p className="mb-4 text-sm text-slate-400">
                This will permanently delete your account, all entities,
                documents, and billing data. This action is irreversible.
              </p>
              <p className="mb-3 text-sm text-slate-300">
                Type <span className="font-mono font-bold text-coral-400">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mb-4 w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-white outline-none transition-colors focus:border-coral-400/50"
                placeholder="Type DELETE"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-coral-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-400 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
