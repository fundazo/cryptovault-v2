import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const token = params.get('token');
  const email = params.get('email') || params.get('resend');

  useEffect(() => {
    if (token) {
      authAPI.verifyEmail({ token }).then(res => {
        const { token: t, user } = res.data.data;
        login(user, t);
        toast.success('Email verified! Welcome to CryptoVault.');
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      }).catch(() => toast.error('Invalid or expired link'));
    }
  }, [token]); // eslint-disable-line

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[i] = val.slice(-1); setOtp(n);
    if (val && i < 5) refs.current[i+1]?.focus();
  };
  const handleKeyDown = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i-1]?.focus(); };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    setOtp([...p.split(''), ...Array(6-p.length).fill('')]);
    refs.current[Math.min(p.length,5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const res = await authAPI.verifyEmail({ otp: code });
      const { token: t, user } = res.data.data;
      login(user, t);
      toast.success('Email verified! Welcome aboard!');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Verification failed'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!email) { toast.error('Email not found. Please register again.'); return; }
    setResending(true);
    try {
      await authAPI.resendVerification(email);
      toast.success('Verification email resent!');
      setCountdown(60); setOtp(['','','','','','']);
    } catch { toast.error('Failed to resend'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#080b14' }}>
      <div className="app-bg"><div className="grid-overlay"/></div>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow-blue text-3xl float-anim">📧</div>
          <h1 className="font-display text-2xl font-bold text-white">Check your email</h1>
          {email && <p className="text-slate-500 mt-2 text-sm">We sent a 6-digit code to<br/><span className="text-blue-400 font-medium">{email}</span></p>}
        </div>

        <div className="glass-card p-6 glow-blue">
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input key={i} ref={el => refs.current[i] = el} type="text" inputMode="numeric"
                value={d} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1}
                className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                  ${d ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 bg-white/5 text-white'}
                  focus:border-blue-500 focus:bg-blue-500/10`}
              />
            ))}
          </div>

          <Button onClick={handleVerify} className="w-full mb-4" size="lg" loading={loading} disabled={otp.join('').length !== 6}>
            Verify Email
          </Button>

          <div className="text-center space-y-2">
            {countdown > 0
              ? <p className="text-sm text-slate-500">Resend in <span className="text-white font-semibold tabular-nums">{countdown}s</span></p>
              : <button onClick={handleResend} disabled={resending} className="text-sm text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 transition-colors">
                  {resending ? 'Sending...' : "Didn't get it? Resend code"}
                </button>
            }
          </div>
        </div>

        <p className="text-center text-sm text-slate-600 mt-6">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">← Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
