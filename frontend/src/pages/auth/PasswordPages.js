import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../utils/api';
import { Button, Input } from '../../components/ui';

const AuthShell = ({ icon, title, subtitle, children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#080b14' }}>
    <div className="app-bg"><div className="grid-overlay"/></div>
    <div className="w-full max-w-sm relative z-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl mb-4 shadow-glow-blue text-2xl">{icon}</div>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
      </div>
      <div className="glass-card p-6 glow-blue">{children}</div>
    </div>
  </div>
);

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch { toast.error('Failed to send reset email'); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell icon="🔑" title="Forgot password" subtitle="We'll send you a secure reset link">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="text-4xl">📬</div>
          <p className="text-slate-400 text-sm">If <span className="text-white font-medium">{email}</span> is registered, a reset link has been sent. Check your spam folder too.</p>
          <Link to="/login"><Button variant="secondary" className="w-full">← Back to login</Button></Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" size="lg" loading={loading}>Send Reset Link</Button>
          <div className="text-center"><Link to="/login" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">← Back to login</Link></div>
        </form>
      )}
    </AuthShell>
  );
};

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      toast.success('Password reset! You can now log in.');
      navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  if (!token) return (
    <AuthShell icon="⚠" title="Invalid link" subtitle="This link is invalid or expired">
      <div className="text-center space-y-4">
        <p className="text-slate-500 text-sm">Please request a new password reset link.</p>
        <Link to="/forgot-password"><Button variant="outline" className="w-full">Request New Link</Button></Link>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell icon="🛡" title="New password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="New password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        <Input label="Confirm password" type="password" placeholder="Repeat new password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
        <Button type="submit" className="w-full" size="lg" loading={loading}>Reset Password</Button>
      </form>
    </AuthShell>
  );
};
