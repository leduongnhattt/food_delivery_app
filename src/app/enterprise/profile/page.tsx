"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { useToast } from "@/contexts/toast-context";
import { useAccountHeader } from "@/hooks/use-account-header";
import { buildAuthHeader, getAuthToken } from "@/lib/auth-helpers";
import { getServerApiBase } from "@/lib/http-client";
import { User, Camera, Lock, Save } from "lucide-react";
import Image from "next/image";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";
import { cn } from "@/lib/utils";

/** Match admin Edit Enterprise field density. Resets shadcn Input ring/offset so focus is a single ring, not stacked on defaults. */
const profileFieldClass = cn(
  "block h-8 w-full rounded border border-slate-300 bg-gradient-to-b from-slate-100/35 to-white px-2.5 text-[13px] leading-8 text-slate-900",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
  "placeholder:text-slate-400",
  "transition-[box-shadow,border-color] duration-150",
  "ring-0 ring-offset-0",
  "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/35 focus:ring-offset-0",
  "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/35 focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export default function EnterpriseProfile() {
  const [enterpriseName, setEnterpriseName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [openHours, setOpenHours] = useState("");
  const [closeHours, setCloseHours] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { showToast } = useToast();
  const accountHeader = useAccountHeader();

  // Validation functions
  const validateEnterpriseName = (name: string) => {
    // Chỉ cho phép chữ cái, số, khoảng trắng và một số ký tự đặc biệt cơ bản
    const regex = /^[a-zA-ZÀ-ỹ0-9\s&.,()-]+$/;
    return regex.test(name);
  };

  const validatePhoneNumber = (phone: string) => {
    // Chỉ cho phép số và dấu +, -, (), khoảng trắng
    const regex = /^[\d\s+()-]+$/;
    return regex.test(phone);
  };

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  // Get current profile data
  const fetchProfile = useCallback(async () => {
    try {
      const base = getServerApiBase();
      const res = await fetch(`${base}/enterprise/profile`, {
        headers: { ...buildAuthHeader() },
        cache: "no-store",
      });
      if (!res.ok) {
        showToast("Failed to load profile data", "error");
        return;
      }
      const { enterprise } = await res.json();
      setEnterpriseName(enterprise.EnterpriseName || "");
      setEmail(enterprise.account.Email || "");
      setAddress(enterprise.Address || "");
      setPhoneNumber(enterprise.PhoneNumber || "");
      setDescription(enterprise.Description || "");
      setOpenHours(enterprise.OpenHours || "");
      setCloseHours(enterprise.CloseHours || "");
      // Use database avatar as primary source, accountHeader as fallback
      const avatarUrl = enterprise.account.Avatar || accountHeader.avatar || "";
      setAvatar(avatarUrl);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Failed to load profile data", "error");
    }
  }, [accountHeader.avatar, showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Sync avatar with accountHeader like navbar
  useEffect(() => {
    if (accountHeader.avatar) {
      setAvatar(accountHeader.avatar);
    }
  }, [accountHeader.avatar]);

  // Handle enterprise name change with validation
  const handleEnterpriseNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "" || validateEnterpriseName(value)) {
      setEnterpriseName(value);
    }
  };

  // Handle phone number change with validation
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || validatePhoneNumber(value)) {
      setPhoneNumber(value);
    }
  };

  // Handle avatar upload - using same approach as ProfileSummary
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const token = getAuthToken();
      const base = getServerApiBase();
      const res = await fetch(`${base}/auth/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Upload failed');
      }
      
      const json = await res.json();
      if (json?.url) {
        setAvatar(json.url);
        showToast("Avatar updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showToast(error instanceof Error ? error.message : "Failed to upload avatar", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword.trim()) {
      showToast("Current password is required", "error");
      return;
    }

    if (!newPassword.trim()) {
      showToast("New password is required", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    if (currentPassword === newPassword) {
      showToast("New password must be different from current password", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      }) as any;
      
      // Check if response indicates success or error
      if (response.success === false) {
        // Handle API error response
        let errorMessage = "Failed to change password";
        
        if (response.error) {
          if (response.error.includes("Current password is incorrect")) {
            errorMessage = "Current password is incorrect. Please check and try again.";
          } else if (response.error.includes("New password must be different")) {
            errorMessage = "New password must be different from your current password.";
          } else if (response.error.includes("Password must be at least 6 characters")) {
            errorMessage = "Password must be at least 6 characters long.";
          } else if (response.error.includes("User account has no password set")) {
            errorMessage = "Your account doesn't have a password set. Please contact support.";
          } else if (response.error.includes("Current password and new password are required")) {
            errorMessage = "Please fill in all password fields.";
          } else if (response.error.includes("Unauthorized")) {
            errorMessage = "Session expired. Please log in again.";
          } else {
            errorMessage = response.error;
          }
        }
        
        showToast(errorMessage, "error");
        
        // Clear current password field if it's incorrect to force re-entry
        if (response.error?.includes("Current password is incorrect")) {
          setCurrentPassword("");
        }
      } else {
        // Success case
        showToast("Password changed successfully! Please log in again.", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
        
        // Redirect to login after successful password change
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      showToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation
    if (!enterpriseName.trim()) {
      showToast("Enterprise name is required", "error");
      setIsLoading(false);
      return;
    }

    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      showToast("Invalid phone number format", "error");
      setIsLoading(false);
      return;
    }

    const emailTrim = email.trim();
    if (!emailTrim) {
      showToast("Email is required", "error");
      setIsLoading(false);
      return;
    }
    if (!validateEmail(emailTrim)) {
      showToast("Invalid email format", "error");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        EnterpriseName: enterpriseName.trim(),
        Address: address.trim(),
        PhoneNumber: phoneNumber.trim(),
        Email: emailTrim,
        Description: description.trim(),
        OpenHours: openHours,
        CloseHours: closeHours,
        AvatarURL: avatar,
      };

      const base = getServerApiBase();
      const res = await fetch(`${base}/enterprise/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          message?: string | string[];
        };
        const raw = errBody?.message;
        const msg =
          Array.isArray(raw) ? raw[0] : raw || "Failed to update profile";
        showToast(msg, "error");
      } else {
        showToast("Profile updated successfully!", "success");
        setEmail(emailTrim);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-10">
      <EnterprisePageHeader
        title="Enterprise Profile"
        description="Manage your business information"
      />

      <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 pb-6">
        <div className="relative shrink-0">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {avatar ? (
              <Image
                src={avatar}
                alt="Avatar"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-200">
                <User className="h-8 w-8 text-slate-400" />
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-sky-600 p-2 text-white shadow transition-colors hover:bg-sky-700">
            <Camera className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploadingAvatar}
            />
          </label>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-900">{enterpriseName || "Enterprise Name"}</p>
          <p className="text-[13px] text-slate-600">{email}</p>
          <p className="mt-0.5 text-[12px] text-slate-500">Business Account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
              Enterprise Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={enterpriseName}
              onChange={handleEnterpriseNameChange}
              className={profileFieldClass}
              placeholder="Enter enterprise name"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={profileFieldClass}
              placeholder="Email address"
              autoComplete="email"
              maxLength={100}
              required
            />
            <p className="mt-1 text-[12px] text-slate-500">Used for sign-in. Must be unique.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">Business Address</label>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={profileFieldClass}
              placeholder="Enter business address"
              maxLength={200}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">Phone Number</label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              className={profileFieldClass}
              placeholder="Enter phone number"
              maxLength={15}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">Opening Hours</label>
            <Input type="time" value={openHours} onChange={(e) => setOpenHours(e.target.value)} className={profileFieldClass} />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">Closing Hours</label>
            <Input type="time" value={closeHours} onChange={(e) => setCloseHours(e.target.value)} className={profileFieldClass} />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">Business Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                "min-h-[8rem] w-full resize-y rounded border border-slate-300 bg-gradient-to-b from-slate-100/35 to-white px-2.5 py-2 text-[13px] leading-snug text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/35"
              )}
              rows={5}
              placeholder="Describe your business..."
              maxLength={255}
            />
            <p className="mt-1 text-[12px] text-slate-500">{description.length}/255 characters</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-8 shrink-0 rounded-md bg-emerald-600 px-3 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save Profile
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="h-8 shrink-0 rounded-md border border-slate-600 bg-slate-700 px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-slate-600"
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Change Password
          </Button>
        </div>
      </form>

      {showPasswordForm && (
        <div className="space-y-6 border-t border-slate-200 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-slate-900">Change Password</h3>
            <div className="flex items-center text-[12px] text-slate-500">
              <Lock className="mr-1 inline h-4 w-4" />
              Secure password change
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Security Notice:</strong> After changing your password, you will be logged out and need to sign in again with your new password.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">Current Password *</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={profileFieldClass}
                placeholder="Enter your current password"
                required
              />
              <p className="mt-1 text-[12px] text-slate-500">Enter your current password to verify your identity</p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">New Password *</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={profileFieldClass}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
              <p className="mt-1 text-[12px] text-slate-500">Password must be at least 6 characters long</p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">Confirm New Password *</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={profileFieldClass}
                placeholder="Confirm your new password"
                required
                minLength={6}
              />
              {confirmPassword && newPassword && confirmPassword !== newPassword && (
                <p className="mt-1 text-[12px] text-red-600">Passwords do not match</p>
              )}
              {confirmPassword && newPassword && confirmPassword === newPassword && (
                <p className="mt-1 text-[12px] text-emerald-600">Passwords match</p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="h-9 flex-1 rounded-lg bg-sky-600 px-4 text-[13px] font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="h-9 flex-1 rounded-lg border-slate-200 text-[13px] font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
