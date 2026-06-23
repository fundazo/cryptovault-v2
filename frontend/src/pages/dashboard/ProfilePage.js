import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, Badge } from '../../components/ui';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({ first_name: user?.first_name||'', last_name: user?.last_name||'', phone: user?.phone||'' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pLoading, setPLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault(); setPLoading(true);
    try { await userAPI.updateProfile(profile); await refreshUser(); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setPLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm) { toast.error('Passwords do not match'); return; }
    if (pwd.new_password.length < 8) { toast.error('Min. 8 characters'); return; }
    setPwdLoading(true);
    try { await userAPI.changePassword({ current_password: pwd.current_password, new_password: pwd.new_password }); toast.success('Password changed!'); setPwd({ current_password:'', new_password:'', confirm:'' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPwdLoading(false); }
  };

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account information</p>
      </div>

      {/* Avatar card */}
      <div className="rounded-2xl p-5 border border-white/5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-display text-2xl font-bold shadow-glow-blue flex-shrink-0">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white">{user?.first_name} {user?.last_name}</h2>
          <p className="text-slate-500 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={user?.role==='admin'?'admin':'user'}>{user?.role}</Badge>
            <Badge variant={user?.is_verified?'approved':'warning'}>{user?.is_verified?'✓ Verified':'Unverified'}</Badge>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-white mb-5">Personal Information</h3>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" value={profile.first_name} onChange={e=>setProfile(f=>({...f,first_name:e.target.value}))} required/>
            <Input label="Last name" value={profile.last_name} onChange={e=>setProfile(f=>({...f,last_name:e.target.value}))} required/>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Email address</label>
            <input className="input-field opacity-50 cursor-not-allowed" value={user?.email} disabled/>
            <p className="text-xs text-slate-600">Email cannot be changed</p>
          </div>
          <Input label="Phone (optional)" type="tel" placeholder="+1 555 000 0000" value={profile.phone} onChange={e=>setProfile(f=>({...f,phone:e.target.value}))}/>
          <div className="flex justify-end"><Button type="submit" loading={pLoading}>Save Changes</Button></div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-white mb-5">Change Password</h3>
        <form onSubmit={handlePassword} className="space-y-4">
          <Input label="Current password" type="password" placeholder="••••••••" value={pwd.current_password} onChange={e=>setPwd(f=>({...f,current_password:e.target.value}))} required/>
          <Input label="New password" type="password" placeholder="Min. 8 characters" value={pwd.new_password} onChange={e=>setPwd(f=>({...f,new_password:e.target.value}))} required/>
          <Input label="Confirm new password" type="password" placeholder="Repeat new password" value={pwd.confirm} onChange={e=>setPwd(f=>({...f,confirm:e.target.value}))} required/>
          <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pwdLoading}>Update Password</Button></div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-white mb-4">Account Details</h3>
        <div className="space-y-2">
          {[
            { label:'Account ID', value: user?.id?.slice(0,8)+'...', mono:true },
            { label:'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en',{year:'numeric',month:'long',day:'numeric'}) : '—' },
            { label:'Account Status', badge:'approved', badgeText:'Active' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
              <span className="text-sm text-slate-500">{item.label}</span>
              {item.badge ? <Badge variant={item.badge}>{item.badgeText}</Badge>
                : <span className={`text-sm text-white ${item.mono ? 'font-mono text-xs' : ''}`}>{item.value}</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
