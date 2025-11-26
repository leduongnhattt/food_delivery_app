"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { useToast } from "@/contexts/toast-context";
import { useAccountHeader } from "@/hooks/use-account-header";
import { buildAuthHeader } from "@/lib/auth-helpers";
import { User, Camera, Lock, Save } from "lucide-react";
import Image from "next/image";

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

  // Get current profile data
  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get<{ enterprise: any }>(
        "/enterprise/profile"
      ) as any;

      if (response.success === false) {
        showToast(response.error || "Failed to load profile data", "error");
        return;
      }

      const { enterprise } = response;
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
      
      const res = await fetch('/api/enterprise/avatar', {
        method: 'POST',
        headers: {
          ...buildAuthHeader()
        },
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

    try {
      const payload = {
        EnterpriseName: enterpriseName.trim(),
        Address: address.trim(),
        PhoneNumber: phoneNumber.trim(),
        Email: email,
        Description: description.trim(),
        OpenHours: openHours,
        CloseHours: closeHours,
        AvatarURL: avatar,
      };

      const response = await apiClient.put("/enterprise/profile", payload) as any;
      
      if (response.success === false) {
        showToast(response.error || "Failed to update profile", "error");
      } else {
        showToast("Profile updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h1 className="text-2xl font-bold">Enterprise Profile</h1>
                <p className="text-purple-100 mt-1">Manage your business information</p>
              </div>
              <User className="h-8 w-8 text-white/80" />
            </div>
          </div>

          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-purple-500 text-white p-2 rounded-full cursor-pointer hover:bg-purple-600 transition-colors shadow-lg">
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{enterpriseName || "Enterprise Name"}</h3>
                <p className="text-gray-600">{email}</p>
                <p className="text-sm text-gray-500 mt-1">Business Account</p>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enterprise Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enterprise Name *
                  </label>
                  <Input
                    type="text"
                    value={enterpriseName}
                    onChange={handleEnterpriseNameChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter enterprise name"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Email address"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter business address"
                    maxLength={200}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    maxLength={15}
                  />
                </div>

                {/* Open Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Hours
                  </label>
                  <Input
                    type="time"
                    value={openHours}
                    onChange={(e) => setOpenHours(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Close Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Hours
                  </label>
                  <Input
                    type="time"
                    value={closeHours}
                    onChange={(e) => setCloseHours(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none"
                  placeholder="Describe your business..."
                  maxLength={255}
                />
                <p className="text-sm text-gray-500 mt-1">{description.length}/255 characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </form>

            {/* Password Change Form */}
            {showPasswordForm && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                  <div className="text-sm text-gray-500">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Secure password change
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password *
                    </label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your current password"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your current password to verify your identity
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm your new password"
                      required
                      minLength={6}
                    />
                    {confirmPassword && newPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {confirmPassword && newPassword && confirmPassword === newPassword && (
                      <p className="text-xs text-green-500 mt-1">Passwords match</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
