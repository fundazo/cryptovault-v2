import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaArrowRight, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

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
    <div className="min-h-screen flex items-center justify-center px-3 py-3 overflow-hidden relative" style={{ background: '#080b14' }}>
      <div className="app-bg"><div className="grid-overlay"/></div>
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"/>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"/>

      <div className="w-full max-w-[22rem] sm:max-w-[24rem] relative z-10">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-2xl mb-3 shadow-glow-blue float-anim">
            <FaShieldAlt className="text-white text-lg" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-500 mt-1 text-sm">Secure sign in to your CryptoVault account</p>
        </div>

        <div className="glass-card p-5 sm:p-6 glow-blue">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Email</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-[#0d1117] px-3.5 py-3">
                <FaEnvelope className="mr-3 text-slate-500" />
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                  className="w-full bg-transparent p-0 text-sm text-slate-100 placeholder:text-slate-500 outline-none" autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Password</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-[#0d1117] px-3.5 py-3">
                <FaLock className="mr-3 text-slate-500" />
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                  className="w-full bg-transparent p-0 pr-8 text-sm text-slate-100 placeholder:text-slate-500 outline-none" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="ml-2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              <span>Sign In</span>
              <FaArrowRight className="text-sm" />
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">No account? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Create one free</Link></p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-4">256-bit SSL encrypted · Your funds are protected</p>
      </div>
    </div>
  );
};

export default LoginPage;
