"use client";
import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  User,
  LogOut,
  Mail,
  ShieldCheck,
  Copy,
  Check,
  Camera,
} from "lucide-react";

export default function SettingsPage() {
  const { user, propertyId, logout } = useAdminStore();
  const [activeTab, setActiveTab] = useState("General");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const tabs = ["General", "Security", "Billing", "Notifications", "Team"];
  const pid = propertyId || process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await adminApi.get("/users/profile");
        if (res.data?.data) {
          const { name, email, avatar } = res.data.data;
          setFormData({
            name: name || "",
            email: email || "",
          });
          // Update avatar in store if it exists
          if (avatar) {
            useAdminStore.setState((state) => ({
              user: { ...state.user, avatar }
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.put("/users/profile", {
        name: formData.name,
        email: formData.email,
      });
      if (res.data.success) {
        toast.success("Profile updated successfully");
        useAdminStore.setState((state) => ({
          user: { ...state.user, name: formData.name, email: formData.email },
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(pid);
      setCopied(true);
      toast.success("Property ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAvatarFile(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await adminApi.post("/users/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Profile photo updated");
        useAdminStore.setState((state) => ({
          user: { ...state.user, avatar: res.data.data.avatar },
        }));
        setAvatarPreview(null);
        setAvatarFile(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to upload photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Settings</h1>
        <p className="text-[#667085] mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex border-b border-[#e5e7eb] mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${
                activeTab === tab
                  ? "text-[#7f56d9] border-[#7f56d9]"
                  : "text-[#667085] border-transparent hover:text-[#101828]"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "General" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-lg font-semibold text-[#101828]">
                Personal Information
              </h2>
              <p className="text-sm text-[#667085] mt-1">
                Update your photo and personal details here.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-[#7f56d9] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.name?.[0] || "A"
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer px-4 py-2 text-sm font-semibold text-[#7f56d9] border border-[#7f56d9] rounded-lg hover:bg-[#f4ebff] transition-colors w-fit">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    Choose photo
                  </label>
                  {avatarFile && (
                    <button
                      onClick={handleUploadAvatar}
                      disabled={isUploadingAvatar}
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#7f56d9] rounded-lg hover:bg-[#6941c6] transition-colors disabled:opacity-50 w-fit"
                    >
                      {isUploadingAvatar ? "Uploading..." : "Upload"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4ebff] text-[#7f56d9] text-sm font-semibold rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {user?.role?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#f9fafb] flex justify-end gap-3 border-t border-[#e5e7eb]">
              <button
                className="px-5 py-2.5 text-sm font-semibold text-[#344054] border border-[#d0d5dd] rounded-lg hover:bg-white transition-colors"
                onClick={() =>
                  setFormData({
                    name: user?.name || "",
                    email: user?.email || "",
                  })
                }
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#7f56d9] rounded-lg hover:bg-[#6941c6] transition-colors disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-lg font-semibold text-[#101828]">
                Property Information
              </h2>
              <p className="text-sm text-[#667085] mt-1">
                Details about your hospitality establishment.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">
                  Property ID
                </label>
                <p className="text-xs text-[#667085] mb-2">
                  Unique identifier for your property.
                </p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-3 bg-[#f2f4f7] rounded-lg text-sm font-mono text-[#344054] border border-[#d0d5dd]">
                    {pid}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#7f56d9] border border-[#7f56d9] rounded-lg hover:bg-[#f4ebff] transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Copy ID"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50/50">
              <h2 className="text-lg font-semibold text-red-900">
                Danger Zone
              </h2>
              <p className="text-sm text-red-600 mt-1">
                Actions that cannot be undone.
              </p>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#101828]">
                  Sign out from all devices
                </h3>
                <p className="text-sm text-[#667085]">
                  This will end your current session.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg font-semibold text-sm shadow-sm hover:bg-red-50 transition-all"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "General" && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
          <p className="text-[#667085]">{activeTab} settings coming soon...</p>
        </div>
      )}
    </div>
  );
}
