import React, { useState } from 'react';
import { userAPI } from '../../utils/api';
import { Button, Card, Input } from '../../components/ui';
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
    <div className="max-w-lg mx-auto page-enter">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-white">
            Change Password
          </h1>

          <p className="text-slate-500 mt-1">
            Update your account password to keep your CryptoVault account secure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={current_password}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={new_password}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-3">
            <p className="text-xs text-yellow-400">
              ⚠ After changing your password, use the new password the next time you log in.
            </p>
          </div>

          <Button type="submit" loading={loading}>
            Change Password
          </Button>
        </form>
      </Card>
    </div>
  );
}