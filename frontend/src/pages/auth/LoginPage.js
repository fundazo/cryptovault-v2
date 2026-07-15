import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { token, user } = res.data.data;
      login(user, token);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error('The request took too long. Please try again.');
      } else if (data?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first.');
        navigate(`/verify-email?resend=${encodeURIComponent(form.email)}`);
      } else {
        toast.error(data?.message || 'Invalid credentials');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#080b14' }}>
      {/* Animated BG */}
      <div className="app-bg"><div className="grid-overlay"/></div>

      {/* Floating orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"/>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"/>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl mb-4 shadow-glow-blue float-anim">
            <span className="text-white text-2xl font-bold">⬡</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to CryptoVault</p>
        </div>

        <div className="glass-card p-6 glow-blue">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                  className="input-field pr-11"/>
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>Sign In</Button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">No account? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Create one free</Link></p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">🔒 256-bit SSL encrypted · Your funds are protected</p>
      </div>
    </div>
  );
};

export default LoginPage;
