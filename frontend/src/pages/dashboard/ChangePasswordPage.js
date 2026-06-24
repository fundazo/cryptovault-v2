import React, { useState } from 'react';
import { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const [current_password, setCurrentPassword] = useState('');
  const [new_password, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await userAPI.changePassword({
        current_password,
        new_password,
      });

      toast.success(res.data.message);
      
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(
  err.response?.data?.message ||
  'Failed to change password'
);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="max-w-lg mx-auto">
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">
        Change Password
      </h1>

      <p className="text-slate-400 text-sm mb-6">
        Update your account password to keep your CryptoVault account secure.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Current Password
          </label>

          <input
            type="password"
            placeholder="Enter current password"
            value={current_password}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            New Password
          </label>

          <input
            type="password"
            placeholder="Enter new password"
            value={new_password}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  </div>
);
}