import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, ShieldCheck, Lock, LogOut, Check, 
  AlertCircle, Calendar, Shield, Save, Loader2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    mobile: user?.mobile || '',
    current_password: '',
    new_password: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg('');
    if (successMsg) setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setSaving(true);
      const payload = {
        full_name: formData.full_name.trim(),
        mobile: formData.mobile.trim(),
      };
      if (formData.new_password) {
        if (!formData.current_password) {
          setErrorMsg('Current password is required to set a new password.');
          setSaving(false);
          return;
        }
        payload.current_password = formData.current_password;
        payload.new_password = formData.new_password;
      }

      await updateProfile(payload);
      setSuccessMsg('Profile updated successfully!');
      setFormData((prev) => ({ ...prev, current_password: '', new_password: '' }));
    } catch (err) {
      console.error("Profile update error:", err);
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === 'string'
          ? detail
          : 'Unable to update profile. Please verify credentials.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-wider font-semibold text-teal-600">
          Account Settings
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
          User Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your contact information, credentials, and municipal account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: User Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-navy-900 to-teal-700 text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md">
              {user?.full_name?.charAt(0) || 'U'}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-navy-950">{user?.full_name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>

            <div className="pt-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                user?.role === 'admin'
                  ? 'bg-navy-100 text-navy-800 border border-navy-200'
                  : 'bg-teal-50 text-teal-800 border border-teal-200'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="capitalize">{user?.role} Account</span>
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 text-left text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '2026'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Resident / Officer</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Edit Profile Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-navy-950 pb-2 border-b border-slate-100">
              Update Profile Information
            </h3>

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address (Immutable)</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mobile Number</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  Change Password (Optional)
                </span>

                <div className="space-y-1">
                  <label className="text-slate-600">Current Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="password"
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleChange}
                      placeholder="Required if setting a new password"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600">New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="password"
                      name="new_password"
                      minLength={6}
                      value={formData.new_password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProfilePage;
