import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userAPI } from '../../utils/api';
import { CRYPTOS } from '../../utils/crypto';
import { fetchPrices } from '../../utils/prices';

const NavItem = ({ to, icon, label, badge, onClick, collapsed }) => {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/dashboard' && to !== '/admin' && location.pathname.startsWith(to));

  if (onClick) return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-500 hover:text-white hover:bg-white/5 ${collapsed ? 'justify-center' : ''}`}>
      <span className="text-lg w-5 text-center flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );

  return (
    <Link to={to} title={collapsed ? label : ''} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''}
      ${active ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
      <span className="text-lg w-5 text-center flex-shrink-0">{icon}</span>
      {!collapsed && <><span className="flex-1">{label}</span>{badge > 0 && <span className="bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{badge > 9 ? '9+' : badge}</span>}</>}
    </Link>
   );
};


const PriceTicker = () => {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    fetchPrices()
      .then(setPrices)
      .catch(console.error);
 }, []);

  const COINGECKO_IDS = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
    SOL: 'solana',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    LTC: 'litecoin',
    MATIC: 'polygon',
    LINK: 'chainlink',
    DOT: 'polkadot',
  };

  const tickerData = CRYPTOS.map(c => ({
  ...c,
  price: prices[c.symbol]?.price || 0,
  change: prices[c.symbol]?.change || 0,
}));

  // Duplicate for seamless scrolling
  const items = [...tickerData, ...tickerData];

  return (
    <div className="h-8 overflow-hidden bg-white/3 border-b border-white/5 flex items-center">
      <div className="ticker-track flex items-center gap-6 px-4">
        {items.map((c, i) => {
          const Icon = c.icon;

          return (
            <span
              key={i}
              className="flex items-center gap-1.5 text-xs whitespace-nowrap"
            >
              {c.symbol === 'SHIB' ? (
                <span
                  className="font-bold"
                  style={{ color: c.color }}
                >
                  SHIB
                </span>
              ) : (
                Icon && <Icon size={14} color={c.color} />
              )}

              <span className="text-slate-400 font-medium">
                {c.symbol}
              </span>

              <span className="text-white font-semibold">
                ${c.price?.toLocaleString()}
              </span>

              <span
                className={
                  c.change >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }
              >
                {c.change >= 0 ? '+' : ''}
                {Number(c.change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};


const DashboardLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    userAPI.getNotifications().catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const userNav = [
    { to: '/dashboard',              icon: '⬡', label: 'Overview' },
    { to: '/dashboard/portfolio',    icon: '◎', label: 'Portfolio' },
    { to: '/dashboard/deposit',      icon: '↓', label: 'Deposit' },
    { to: '/dashboard/withdraw',     icon: '↑', label: 'Withdraw' },
    { to: '/dashboard/transactions', icon: '⇄', label: 'History' },
    { to: '/dashboard/profile',      icon: '○', label: 'Profile' },
  ];

  const adminNav = [
    { to: '/admin',              icon: '⬡', label: 'Overview' },
    { to: '/admin/users',        icon: '◉', label: 'Users' },
    { to: '/admin/deposits',     icon: '↓', label: 'Deposits' },
    { to: '/admin/withdrawals',  icon: '↑', label: 'Withdrawals' },
    { to: '/admin/transactions', icon: '⇄', label: 'Transactions' },
    { to: '/admin/wallets',      icon: '◎', label: 'Wallets' },
  ];

  const navItems = isAdmin ? adminNav : userNav;

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-glow-blue">⬡</div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-display font-bold text-white text-lg leading-none">CryptoVault</span>
            {isAdmin && <span className="block text-xs text-purple-400 mt-0.5">Admin Panel</span>}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-white/3 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-600 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <Link to="/change-password">
        Change Password
        </Link>
        <button onClick={handleLogout} className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <span>⎋</span>
          {!collapsed && <span>Sign out</span>}
        </button>
        <button onClick={() => setCollapsed(c => !c)} className={`hidden lg:flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated background */}
      <div className="app-bg"><div className="grid-overlay"/></div>

      {/* Desktop Sidebar — fixed, hidden on mobile */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 border-r border-white/5 fixed inset-y-0 left-0 z-20 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ background: 'rgba(8,11,20,0.97)', backdropFilter: 'blur(20px)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <aside className="relative w-64 flex-shrink-0 border-r border-white/5 shadow-2xl z-10"
            style={{ background: 'rgba(8,11,20,0.99)', backdropFilter: 'blur(20px)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className={`flex flex-col flex-1 min-h-screen min-w-0 transition-all duration-300 relative z-10 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <PriceTicker />

        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/5"
          style={{ background: 'rgba(8,11,20,0.97)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="font-display font-bold text-white">CryptoVault</span>
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full min-w-0 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
