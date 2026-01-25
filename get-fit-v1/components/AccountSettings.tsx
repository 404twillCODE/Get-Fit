"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

const AccountSettings = ({ onClose }: { onClose: () => void }) => {
  const { user, updateEmail, updatePassword, inviteUser } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "password" | "invite">("email");

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      setStatus("Please enter a new email address.");
      return;
    }
    setIsSaving(true);
    setStatus("");
    const error = await updateEmail(newEmail);
    if (error) {
      setStatus(error);
    } else {
      setStatus("Email update link sent! Check your new email to confirm.");
      setNewEmail("");
    }
    setIsSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      setStatus("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("Password must be at least 6 characters.");
      return;
    }
    setIsSaving(true);
    setStatus("");
    const error = await updatePassword(newPassword);
    if (error) {
      setStatus(error);
    } else {
      setStatus("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsSaving(false);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      setStatus("Please enter an email address.");
      return;
    }
    setIsSaving(true);
    setStatus("");
    const error = await inviteUser(inviteEmail);
    if (error) {
      setStatus(error);
    } else {
      setStatus(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 border border-white/20 max-w-md sm:max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto -mt-8"
      >
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">⚙️</div>
          <h3 className="text-xl font-bold mb-2">Account Settings</h3>
          <p className="text-white/60 text-sm">
            Manage your account settings
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab("email");
              setStatus("");
            }}
            className={`flex-1 py-2 rounded-xl text-sm border ${
              activeTab === "email"
                ? "bg-white text-[#0a0a0a] border-white"
                : "bg-white/5 border-white/10 text-white/70"
            }`}
          >
            Change Email
          </button>
          <button
            onClick={() => {
              setActiveTab("password");
              setStatus("");
            }}
            className={`flex-1 py-2 rounded-xl text-sm border ${
              activeTab === "password"
                ? "bg-white text-[#0a0a0a] border-white"
                : "bg-white/5 border-white/10 text-white/70"
            }`}
          >
            Change Password
          </button>
          <button
            onClick={() => {
              setActiveTab("invite");
              setStatus("");
            }}
            className={`flex-1 py-2 rounded-xl text-sm border ${
              activeTab === "invite"
                ? "bg-white text-[#0a0a0a] border-white"
                : "bg-white/5 border-white/10 text-white/70"
            }`}
          >
            Invite User
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {activeTab === "email" && (
            <>
              <div>
                <label className="text-sm text-white/70 mb-2 block">Current Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-2 block">New Email</label>
                <input
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
                />
              </div>
              <button
                onClick={handleUpdateEmail}
                disabled={isSaving}
                className="w-full py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Sending..." : "Update Email"}
              </button>
            </>
          )}

          {activeTab === "password" && (
            <>
              <div>
                <label className="text-sm text-white/70 mb-2 block">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-2 block">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
                />
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={isSaving}
                className="w-full py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Updating..." : "Update Password"}
              </button>
            </>
          )}

          {activeTab === "invite" && (
            <>
              <div>
                <label className="text-sm text-white/70 mb-2 block">Invite Email</label>
                <input
                  type="email"
                  placeholder="Enter email to invite"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
                />
              </div>
              <p className="text-xs text-white/50">
                Send a magic link invitation to create an account
              </p>
              <button
                onClick={handleInviteUser}
                disabled={isSaving}
                className="w-full py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Sending..." : "Send Invitation"}
              </button>
            </>
          )}
        </div>

        {status && (
          <div className={`mb-4 text-sm ${status.includes("successfully") || status.includes("sent") || status.includes("Check") ? "text-green-400" : "text-red-400"}`}>
            {status}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors text-sm"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

export default AccountSettings;
