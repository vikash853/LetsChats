/**
 * UserProfileModal
 * Edit your own profile: username, bio, avatar URL
 * Accessible from the sidebar top bar
 */
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI, uploadAPI } from "../../services/api";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Input  from "../ui/Input";

const UserProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [form, setForm]     = useState({
    username: user?.username || "",
    bio:      user?.bio      || "",
    avatar:   user?.avatar   || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
    setSaved(false);
  };

  // Upload avatar image file
  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await uploadAPI.avatar(fd);
      setForm((p) => ({ ...p, avatar: data.url }));
      updateUser({ avatar: data.url });
    } catch (err) {
      setError("Failed to upload image. Try a URL instead.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.username.trim()) { setError("Username cannot be empty"); return; }
    setSaving(true);
    setError("");
    try {
      const { data } = await authAPI.updateProfile({
        username: form.username.trim(),
        bio:      form.bio.trim(),
        avatar:   form.avatar.trim(),
      });
      updateUser(data.user);
      setSaved(true);
      setTimeout(onClose, 800);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Edit Profile</h2>
          <button onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar user={{ ...user, avatar: form.avatar }} size="xl" />
              <label className="absolute inset-0 flex items-center justify-center
                bg-black/40 rounded-full opacity-0 group-hover:opacity-100
                cursor-pointer transition-opacity">
                <span className="text-white text-xs font-medium">Change</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarFile} />
              </label>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Click avatar to upload a photo</p>
          </div>

          {/* Or paste avatar URL */}
          <Input
            label="Avatar URL (optional)"
            name="avatar"
            value={form.avatar}
            onChange={handleChange}
            placeholder="https://example.com/photo.jpg"
          />

          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Your username"
            maxLength={20}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Bio <span className="text-slate-400 font-normal">({form.bio.length}/150)</span>
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell people a little about yourself…"
              maxLength={150}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm
                bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                border-slate-200 dark:border-slate-600
                placeholder-slate-400 dark:placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {saved ? "✓ Saved!" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;