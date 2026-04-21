"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/toast-context";
import { useAccountHeader } from "@/hooks/use-account-header";
import { buildAuthHeader, getAuthToken } from "@/lib/auth-helpers";
import { getServerApiBase } from "@/lib/http-client";
import { User, Camera, Save } from "lucide-react";
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
        </div>
      </form>
    </div>
  );
}
