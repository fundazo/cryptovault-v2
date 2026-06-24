import React, { useState } from 'react';
import { getCrypto } from '../../utils/crypto';

export const Button = ({ children, variant='primary', size='md', loading, disabled, className='', ...props }) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary: 'btn-primary focus:ring-blue-500',
    secondary: 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 focus:ring-white/20',
    success: 'bg-emerald-500 hover:bg-emerald-400 text-white focus:ring-emerald-500',
    danger: 'bg-red-500 hover:bg-red-400 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white focus:ring-white/10',
    outline: 'border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 focus:ring-blue-500',
    gold: 'bg-gradient-gold text-white focus:ring-yellow-500',
  };
  const sizes = { xs:'px-2.5 py-1.5 text-xs gap-1', sm:'px-3 py-2 text-sm gap-1.5', md:'px-5 py-2.5 text-sm gap-2', lg:'px-6 py-3 text-base gap-2', xl:'px-8 py-4 text-lg gap-2.5' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled||loading} {...props}>
      {loading && <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
      {children}
    </button>
  );
};

export const Input = ({ label, error, hint, icon, suffix, className='', inputClassName='', ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="block text-sm font-medium text-slate-400">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">{icon}</span>}
      <input className={`input-field ${icon ? 'pl-10' : ''} ${suffix ? 'pr-16' : ''} ${error ? 'border-red-500/50' : ''} ${inputClassName}`} {...props}/>
      {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">{suffix}</span>}
    </div>
    {error && <p className="text-xs text-red-400">⚠ {error}</p>}
    {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
  </div>
);

export const Select = ({ label, error, children, className='', ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="block text-sm font-medium text-slate-400">{label}</label>}
    <select className={`input-field ${error ? 'border-red-500/50' : ''}`} {...props}>{children}</select>
    {error && <p className="text-xs text-red-400">⚠ {error}</p>}
  </div>
);

export const Card = ({ children, className='', glow, ...props }) => (
  <div className={`glass-card ${glow ? 'glow-blue' : ''} ${className}`} {...props}>{children}</div>
);

export const Badge = ({ children, variant='default', size='sm', className='' }) => {
  const variants = {
    default: 'bg-white/5 text-slate-400 border border-white/10',
    pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected',
    success: 'badge-approved', warning: 'badge-pending', error: 'badge-rejected',
    info: 'badge-info', admin: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    user: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };
  const sizes = { xs:'px-1.5 py-0.5 text-xs', sm:'px-2.5 py-1 text-xs', md:'px-3 py-1.5 text-sm' };
  return <span className={`inline-flex items-center rounded-lg font-semibold ${variants[variant]} ${sizes[size]} ${className}`}>{children}</span>;
};

export const Spinner = ({ size='md', className='' }) => {
  const sizes = { sm:'h-5 w-5 border-2', md:'h-8 w-8 border-2', lg:'h-12 w-12 border-2' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-blue-500/20 border-t-blue-500 rounded-full animate-spin`}/>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size='md' }) => {
  if (!isOpen) return null;
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm fade-in"/>
      <div className={`relative w-full ${sizes[size]} glass-card shadow-card page-enter rounded-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5" style={{background:'rgba(17,24,39,0.95)'}}>
            <h3 className="text-base sm:text-lg font-semibold text-white font-display">{title}</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
    <div className="text-3xl mb-2 opacity-50">{icon||'📭'}</div>
    <h3 className="text-sm font-semibold text-slate-300 mb-1">{title}</h3>
    {description && <p className="text-xs text-slate-600 mb-3 max-w-xs">{description}</p>}
    {action}
  </div>
);

export const CryptoIcon = ({ symbol, size = 'md' }) => {
  const crypto = getCrypto(symbol);
  const Icon = crypto.icon;

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  return (
    <div
      className="flex items-center justify-center"
      title={crypto.name || symbol}
    >
      {symbol === 'SHIB' ? (
        <span
          className="font-bold text-xs"
          style={{ color: crypto.color }}
        >
          SHIB
        </span>
      ) : (
        Icon && <Icon size={iconSizes[size]} color={crypto.color} />
      )}
    </div>
  );
};
export const CopyButton = ({ text, className='' }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <button onClick={copy} className={`text-slate-500 hover:text-blue-400 transition-colors p-1 rounded flex-shrink-0 ${className}`} title="Copy">
      {copied
        ? <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      }
    </button>
  );
};

export const ChangeIndicator = ({ value }) => (
  <span className={`text-xs font-semibold ${value>=0 ? 'text-emerald-400' : 'text-red-400'}`}>
    {value>=0?'↑':'↓'} {value>=0?'+':''}{value?.toFixed(2)}%
  </span>
);

export const StatCard = ({ title, value, icon, subValue, color='blue', trend }) => {
  const colors = {
    blue:'from-blue-500/10 to-blue-600/5 border-blue-500/10',
    green:'from-emerald-500/10 to-emerald-600/5 border-emerald-500/10',
    yellow:'from-yellow-500/10 to-yellow-600/5 border-yellow-500/10',
    red:'from-red-500/10 to-red-600/5 border-red-500/10',
    purple:'from-purple-500/10 to-purple-600/5 border-purple-500/10',
  };
  const iconBg = {
    blue:'bg-blue-500/15 text-blue-400', green:'bg-emerald-500/15 text-emerald-400',
    yellow:'bg-yellow-500/15 text-yellow-400', red:'bg-red-500/15 text-red-400',
    purple:'bg-purple-500/15 text-purple-400',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-3 sm:p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg ${iconBg[color]}`}>{icon}</div>
        {trend !== undefined && <ChangeIndicator value={trend}/>}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white font-display mt-1 sm:mt-2">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{title}</p>
      {subValue && <p className="text-xs text-slate-600 mt-0.5 truncate">{subValue}</p>}
    </div>
  );
};

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
    {tabs.map(tab => (
      <button key={tab.value} onClick={()=>onChange(tab.value)}
        className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${active===tab.value ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        {tab.label}
      </button>
    ))}
  </div>
);

export default {};
