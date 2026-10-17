"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { toast } from "sonner";
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  MapPin,
  Calendar,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  FileText,
  Clock,
  Building,
  Sparkles,
  Loader2,
  Camera,
  Trash2,
  Upload,
  Image as ImageIcon,
  Smartphone,
  Download,
} from "lucide-react";
import { usePwa } from "@/components/pwa-provider";

interface UserProfileData {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  state: string | null;
  zone: string | null;
  part: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProfileStats {
  totalReports: number;
  totalConfirmations: number;
  unreadNotifications: number;
  recentReports: {
    id: string;
    reportId: string;
    status: string;
    submittedAt: string | null;
    createdAt: string;
  }[];
}

export default function ProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useUIStore();
  const { isStandalone, isIosDevice, installApp, isInstallable } = usePwa();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  // Edit details form state
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/profile");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load profile");
      }
      const data = await res.json();
      setProfile(data.user);
      setStats(data.stats);

      setName(data.user.name || "");
      setPhoneNumber(data.user.phoneNumber || "");
      setEmail(data.user.email || "");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Process & crop image client-side to ensure crisp quality & lightweight storage
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 320;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          // Center square crop
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image file"));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image file size should be less than 6MB");
      return;
    }

    try {
      setUploadingPhoto(true);
      const optimizedDataUrl = await processImageFile(file);

      // Save directly to user profile
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: optimizedDataUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile picture");
      }

      setProfile(data.user);
      if (authUser) {
        setAuthUser({
          ...authUser,
          image: data.user.image,
        });
      }

      toast.success("Profile picture updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove profile picture");
      }

      setProfile(data.user);
      if (authUser) {
        setAuthUser({
          ...authUser,
          image: null,
        });
      }

      toast.success("Profile picture removed");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to remove photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    if (!email.trim()) {
      toast.error("Email address cannot be empty");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim() || null,
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfile(data.user);
      // Update store user so navbar & sidebars update immediately
      if (authUser) {
        setAuthUser({
          ...authUser,
          name: data.user.name,
          email: data.user.email,
        });
      }

      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast.success("Password updated successfully! Please remember your new password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const getRoleTheme = (roleName?: string) => {
    switch (roleName) {
      case "ADMIN":
        return {
          banner: "from-purple-700 via-indigo-700 to-slate-900",
          badge: "bg-purple-500/20 text-purple-300 border-purple-400/30",
          accent: "text-purple-400",
        };
      case "STATE_LEADER":
        return {
          banner: "from-blue-700 via-cyan-700 to-slate-900",
          badge: "bg-blue-500/20 text-blue-300 border-blue-400/30",
          accent: "text-blue-400",
        };
      case "ZONE_LEADER":
        return {
          banner: "from-indigo-700 via-blue-700 to-slate-900",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
          accent: "text-indigo-400",
        };
      default:
        return {
          banner: "from-sky-700 via-blue-700 to-slate-900",
          badge: "bg-sky-500/20 text-sky-300 border-sky-400/30",
          accent: "text-sky-400",
        };
    }
  };

  const themeConfig = getRoleTheme(profile?.role);

  const getInitials = (fullName?: string, uname?: string) => {
    const source = fullName?.trim() || uname?.trim() || "User";
    const parts = source.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return source.substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
        {/* Hidden file input for picture upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading your profile...</p>
          </div>
        ) : profile ? (
          <>
            {/* Hero Profile Banner */}
            <div className={`relative rounded-3xl bg-linear-to-r ${themeConfig.banner} p-5 sm:p-10 text-white shadow-xl overflow-hidden border border-white/10`}>
              {/* Background ambient glow */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  {/* Large Avatar with Photo Upload Button */}
                  <div className="relative group/avatar shrink-0">
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt={profile.name || profile.username}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover border-2 border-white/40 shadow-2xl"
                      />
                    ) : (
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-2xl">
                        {getInitials(profile.name, profile.username)}
                      </div>
                    )}

                    {/* Change Photo Camera Overlay Badge */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                      title="Upload or Change Profile Picture"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl sm:text-3xl font-black tracking-tight truncate">
                        {profile.name || profile.username}
                      </h2>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border backdrop-blur-sm ${themeConfig.badge}`}>
                        <Shield className="h-3 w-3" />
                        {profile.role.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 font-semibold flex flex-wrap items-center gap-2">
                      <span>@{profile.username}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Member since {new Date(profile.createdAt).toLocaleDateString([], { month: "short", year: "numeric" })}
                      </span>
                    </p>

                    {/* Jurisdiction pill */}
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/25 text-white/90 border border-white/10 font-bold">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        {[
                          profile.state ? `State: ${profile.state}` : null,
                          profile.zone ? `Zone: ${profile.zone}` : null,
                          profile.part ? `Part: ${profile.part}` : null,
                        ].filter(Boolean).join(" | ") || "Global Jurisdiction"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Note Pill */}
                <div className="self-start md:self-center bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl p-4 max-w-xs text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Role Access Rights</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    Assigned as <span className="font-bold text-white">{profile.role.replace(/_/g, " ")}</span>. Roles are centrally administered and cannot be self-modified.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Picture Management Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name || profile.username}
                      className="h-16 w-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl border border-blue-500/20">
                      {getInitials(profile.name, profile.username)}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Profile Picture
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {profile.image
                      ? "Custom picture is active across your dashboard and search listings."
                      : "Using default system initials. Upload a custom photo to personalize your account."}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, WebP up to 6MB. Automatically cropped to a crisp square.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {profile.image ? "Change Photo" : "Upload Photo"}
                    </>
                  )}
                </button>

                {profile.image && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/40 transition-colors cursor-pointer disabled:opacity-50"
                    title="Remove custom profile picture"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reports Handled</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{stats?.totalReports ?? 0}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirmations</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{stats?.totalConfirmations ?? 0}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Active & Verified
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1 truncate">
                    {new Date(profile.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Form Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Cols: Edit Details Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Personal Information Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                        Personal Information
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        Update your public name, phone number, and contact email.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="mt-6 space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-base sm:text-sm min-h-11 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Phone Number */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-base sm:text-sm min-h-11 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Used for direct calls & team outreach</p>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-base sm:text-sm min-h-11 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Used for system notices & login</p>
                      </div>
                    </div>

                    {/* Role & Username (Read-Only) */}
                    <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-amber-500" />
                          System-Assigned Identifiers (Read-Only)
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-300/40">
                          Role Locked
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={`@${profile.username}`}
                            disabled
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-mono font-bold cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Assigned Role
                          </label>
                          <input
                            type="text"
                            value={profile.role.replace(/_/g, " ")}
                            disabled
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        * In accordance with ministry security policies, candidates and leaders cannot alter their assigned role or username.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Profile Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Password & Security Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-indigo-600" />
                        Change Password
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        Secure your account by updating your login password.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="mt-6 space-y-5">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                        Current Password (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-base sm:text-sm min-h-11 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* New Password */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-base sm:text-sm min-h-11 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                            className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-base sm:text-sm min-h-11 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {savingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <KeyRound className="h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Jurisdiction & Recent Reports */}
              <div className="space-y-6">
                {/* Assigned Jurisdiction Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                        Assigned Jurisdiction
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Your ministry operating region</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500">State</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {profile.state || "All States (Admin)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500">Zone</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {profile.zone || "All Zones"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500">Part / Division</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {profile.part || "General"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                    Jurisdiction regions determine which candidates, reports, and zones you coordinate. To request a jurisdiction transfer, contact the system administrator.
                  </div>
                </div>

                {/* Recent Reports / Activity */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Recent Activity
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">
                      {stats?.recentReports.length ?? 0} Recent
                    </span>
                  </div>

                  {stats?.recentReports && stats.recentReports.length > 0 ? (
                    <div className="space-y-2.5">
                      {stats.recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {report.reportId}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {new Date(report.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </p>
                          </div>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                            {report.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium italic">
                      No recent activity recorded
                    </div>
                  )}
                </div>

                {/* Progressive Web App Status & Install Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      App & Device Status
                    </h4>
                    {isStandalone ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Installed PWA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Web Browser
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isStandalone
                      ? "You are using WCM Outreach in standalone mobile app mode. Offline navigation fallback and asset caching are active."
                      : "Install WCM Outreach on your device home screen for fullscreen access, instant loading, and standalone app experience."}
                  </p>

                  {!isStandalone && (
                    <button
                      type="button"
                      onClick={installApp}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer min-h-10"
                    >
                      <Download className="h-4 w-4" />
                      {isIosDevice ? "How to Install on iPhone" : "Install App to Device"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
