"use client";
import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { adminApi, getProperties, updateTeamMember } from "@/lib/api";
import toast from "react-hot-toast";
import {
  User,
  LogOut,
  Mail,
  ShieldCheck,
  Copy,
  Check,
  Camera,
  Eye,
  EyeOff,
  Users,
  Trash2,
  UserPlus,
  X,
  Pencil,
} from "lucide-react";
import FeedbackList from "@/components/admin/FeedbackList";

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

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Team management state
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    propertyId: "",
  });

  const [properties, setProperties] = useState([]);

  const fetchTeamMembers = async () => {
    setIsLoadingTeam(true);
    try {
      const res = await adminApi.get("/users/team");
      if (res.data?.data) {
        setTeamMembers(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleCreateTeamMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error("Please fill in all fields");
      return;
    }

    const payload = {
      name: newMember.name,
      email: newMember.email,
      password: newMember.password,
      role: newMember.role,
    };

    if (newMember.role !== "super_admin" && newMember.propertyId) {
      payload.propertyId = newMember.propertyId;
    }

    try {
      const res = await adminApi.post("/users/team", payload);
      if (res.data.success) {
        toast.success("Team member added successfully");
        setShowAddMember(false);
        setNewMember({
          name: "",
          email: "",
          password: "",
          role: "staff",
          propertyId: "",
        });
        fetchTeamMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add team member");
    }
  };

  const handleDeleteTeamMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const res = await adminApi.delete(`/users/team/${userId}`);
      if (res.data.success) {
        toast.success("Team member removed");
        fetchTeamMembers();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to remove team member",
      );
    }
  };

  const handleEditTeamMember = async () => {
    if (!editingMember) return;

    const payload = {
      name: editingMember.name,
      role: editingMember.role,
    };

    if (editingMember.role !== "super_admin" && editingMember.propertyId) {
      payload.propertyId = editingMember.propertyId;
    }

    try {
      const res = await updateTeamMember(editingMember._id, payload);
      if (res.data.success) {
        toast.success("Team member updated successfully");
        setShowEditMember(false);
        setEditingMember(null);
        fetchTeamMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update team member");
    }
  };

  const canManageTeam =
    user?.permissions?.canManageTeam || user?.role === "super_admin";

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleUpdatePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await adminApi.put("/users/profile/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (res.data.success) {
        toast.success("Password updated successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const allTabs = ['General', 'Security', 'Billing', 'Notifications', 'Team', 'Feedback'];
  const tabs = allTabs.filter(tab => tab !== 'Feedback' || user?.role === 'super_admin');
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
              user: { ...state.user, avatar },
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "Team") {
      fetchTeamMembers();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await getProperties();
        if (res.data?.data) {
          setProperties(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      }
    };
    if (user?.role === "super_admin") {
      fetchProperties();
    }
  }, [user?.role]);

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

      {activeTab === "Security" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-lg font-semibold text-[#101828]">
                Change Password
              </h2>
              <p className="text-sm text-[#667085] mt-1">
                Update your password to keep your account secure.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2.5 pr-10 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085]"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2.5 pr-10 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085]"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#667085] mt-1">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2.5 pr-10 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085]"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#f9fafb] flex justify-end gap-3 border-t border-[#e5e7eb]">
              <button
                onClick={() =>
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }
                className="px-5 py-2.5 text-sm font-semibold text-[#344054] border border-[#d0d5dd] rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isChangingPassword}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#7f56d9] rounded-lg hover:bg-[#6941c6] transition-colors disabled:opacity-50"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Team" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#101828]">
                  Team Members
                </h2>
                <p className="text-sm text-[#667085] mt-1">
                  Manage your team and their access levels.
                </p>
              </div>
              {canManageTeam && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#7f56d9] rounded-lg hover:bg-[#6941c6] transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              )}
            </div>

            {isLoadingTeam ? (
              <div className="p-12 text-center text-[#667085]">Loading...</div>
            ) : teamMembers.length === 0 ? (
              <div className="p-12 text-center text-[#667085]">
                No team members found.
              </div>
            ) : (
              <div className="divide-y divide-[#e5e7eb]">
                {teamMembers.map((member) => (
                  <div
                    key={member._id}
                    className="p-4 flex items-center justify-between hover:bg-[#f9fafb]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#7f56d9] flex items-center justify-center text-white font-bold overflow-hidden">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.name?.[0] || "A"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#101828]">
                          {member.name}
                        </p>
                        <p className="text-xs text-[#667085]">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg ${
                          member.role === "super_admin"
                            ? "bg-purple-100 text-purple-700"
                            : member.role === "property_admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {member.role?.replace(/_/g, " ")}
                      </span>
                      {canManageTeam && member._id !== user?.id && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setShowEditMember(true);
                            }}
                            className="p-2 text-[#7f56d9] hover:bg-[#f4ebff] rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeamMember(member._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showAddMember && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#101828]">
                    Add Team Member
                  </h3>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="text-[#667085] hover:text-[#101828]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) =>
                        setNewMember({ ...newMember, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) =>
                        setNewMember({ ...newMember, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newMember.password}
                      onChange={(e) =>
                        setNewMember({ ...newMember, password: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">
                      Role
                    </label>
                    <select
                      value={newMember.role}
                      onChange={(e) =>
                        setNewMember({ ...newMember, role: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                    >
                      <option value="staff">Staff</option>
                      {user?.role === "super_admin" && (
                        <>
                          <option value="property_admin">Property Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-[#344054] border border-[#d0d5dd] rounded-lg hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTeamMember}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#7f56d9] rounded-lg hover:bg-[#6941c6] transition-colors"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEditMember && editingMember && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#101828]">
                    Edit Team Member
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditMember(false);
                      setEditingMember(null);
                    }}
                    className="text-[#667085] hover:text-[#101828]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingMember.name || ""}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingMember.email || ""}
                      disabled
                      className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm bg-[#f9fafb] text-[#667085]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">
                      Role
                    </label>
                    <select
                      value={editingMember.role || "staff"}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          role: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-[#d0d5dd] rounded-lg text-sm focus:ring-4 focus:ring-[#f4ebff] focus:border-[#7f56d9] outline-none transition-all"
                    >
                      <option value="staff">Staff</option>
                      {user?.role === "super_admin" && (
                        <>
                          <option value="property_admin">Property Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditMember(false);
                      setEditingMember(null);
                    }}
                    className="px-5 py-2.5 text-sm font-semibold text-[#344054] border border-[#d0d5dd] rounded-lg hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditTeamMember}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#7f56d9] rounded-lg hover:bg-[#6941c6] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Feedback" && user?.role === "super_admin" && (
          <FeedbackList />
        )}

        {activeTab !== "General" &&
        activeTab !== "Security" &&
        activeTab !== "Team" &&
        activeTab !== "Feedback" && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
            <p className="text-[#667085]">
              {activeTab} settings coming soon...
            </p>
          </div>
        )}
    </div>
  );
}
