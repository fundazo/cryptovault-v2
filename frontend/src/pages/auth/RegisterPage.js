import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from 'react-icons/fa';
import { authAPI } from '../../utils/api';
import { Button } from '../../components/ui';

const RegisterPage = () => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthInfo = [null,
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-emerald-500' },
  ][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Check your email for the verification code.');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) errors.forEach(e => toast.error(e.message));
      else toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#080b14' }}>
      <div className="app-bg"><div className="grid-overlay"/></div>
      <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"/>
      <div className="fixed bottom-1/3 left-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"/>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-2xl mb-3 shadow-glow-blue float-anim">
            <FaShieldAlt className="text-white text-lg" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
          <p className="text-slate-500 mt-1 text-sm">Join 100,000+ crypto traders</p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400">First name</label>
                <input placeholder="John" value={form.first_name} onChange={set('first_name')} required className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400">Last name</label>
                <input placeholder="Doe" value={form.last_name} onChange={set('last_name')} required className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Email</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-[#0d1117] px-3.5 py-3">
                <FaEnvelope className="mr-3 text-slate-500" />
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required className="w-full bg-transparent p-0 text-sm text-slate-100 placeholder:text-slate-500 outline-none" autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Password</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-[#0d1117] px-3.5 py-3">
                <FaLock className="mr-3 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required className="w-full bg-transparent p-0 pr-8 text-sm text-slate-100 placeholder:text-slate-500 outline-none" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="ml-2 text-slate-500 transition-colors hover:text-slate-300" aria-label="Toggle password visibility">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {form.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthInfo?.color : 'bg-white/10'}`}/>) }
                  </div>
                  <p className="text-xs text-slate-600">Strength: <span className="text-slate-400">{strengthInfo?.label}</span></p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Confirm password</label>
              <div className="flex items-center rounded-xl border border-white/10 bg-[#0d1117] px-3.5 py-3">
                <FaLock className="mr-3 text-slate-500" />
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm_password} onChange={set('confirm_password')} required className="w-full bg-transparent p-0 pr-8 text-sm text-slate-100 placeholder:text-slate-500 outline-none" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="ml-2 text-slate-500 transition-colors hover:text-slate-300" aria-label="Toggle confirm password visibility">
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>Create Account</Button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link></p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-700 mt-4">A verification code will be sent to your email</p>
      </div>
    </div>
  );
};

export default RegisterPage;
