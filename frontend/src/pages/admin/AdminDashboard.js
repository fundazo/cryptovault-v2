import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { Card, StatCard, Spinner, Badge, CryptoIcon } from '../../components/ui';
import { CRYPTOS, getTotalUSD, formatCompactNumber } from '../../utils/crypto';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getDeposits({limit:5,status:'pending'}), adminAPI.getWithdrawals({limit:5,status:'pending'})])
      .then(([s,d,w]) => { setStats(s.data.data); setPendingDeposits(d.data.data); setPendingWithdrawals(w.data.data); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg"/></div>;

  const bal = stats?.balances || {};

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Platform overview and pending actions</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
          <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot"/>
          <span className="text-xs text-emerald-400 font-medium">System Online</span>
        </div>
      </div>

      {/* Stats — 1 col mobile, 2 col sm, 4 col lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Users" value={stats?.users?.total||0} icon="👥" color="blue" subValue={`${stats?.users?.verified||0} verified`}/>
        <StatCard title="Pending Deposits" value={stats?.deposits?.pending||0} icon="↓" color="yellow" subValue={`${stats?.deposits?.total||0} total`}/>
        <StatCard title="Pending Withdrawals" value={stats?.withdrawals?.pending||0} icon="↑" color="red" subValue={`${stats?.withdrawals?.total||0} total`}/>
        <StatCard title="Transactions" value={(parseInt(stats?.deposits?.total||0)+parseInt(stats?.withdrawals?.total||0)).toString()} icon="⇄" color="purple"/>
      </div>

      {/* Holdings */}
      <Card className="p-4 sm:p-5">
        <h3 className="font-display font-semibold text-white mb-3 text-sm sm:text-base">Platform Holdings</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { symbol:'BTC', balance: bal.total_btc, color:'text-orange-400' },
            { symbol:'ETH', balance: bal.total_eth, color:'text-blue-400' },
            { symbol:'USDT', balance: bal.total_usdt, color:'text-emerald-400' },
          ].map(({ symbol, balance, color }) => (
            <div key={symbol} className="text-center p-3 rounded-xl bg-white/3 border border-white/5 overflow-hidden">
              <CryptoIcon symbol={symbol} size="sm"/>
              <p className="text-xs text-slate-500 mt-1.5 mb-0.5">{symbol}</p>
              <p className={`text-sm font-bold font-mono truncate ${color}`}>
                {formatCompactNumber(balance)} {symbol}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending — stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white text-sm sm:text-base">Pending Deposits</h3>
            <Link to="/admin/deposits" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {pendingDeposits.length===0 ? (
            <div className="text-center py-6"><p className="text-slate-600 text-sm"> No pending deposits</p></div>
          ) : (
            <div className="space-y-2">
              {pendingDeposits.map(d => (
                <div key={d.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <CryptoIcon symbol={d.currency} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{d.first_name} {d.last_name}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{parseFloat(d.amount).toFixed(4)} {d.currency}</p>
                  </div>
                  <Link to="/admin/deposits">
                    <button className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/15 transition-all font-medium whitespace-nowrap">Review</button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white text-sm sm:text-base">Pending Withdrawals</h3>
            <Link to="/admin/withdrawals" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {pendingWithdrawals.length===0 ? (
            <div className="text-center py-6"><p className="text-slate-600 text-sm"> No pending withdrawals</p></div>
          ) : (
            <div className="space-y-2">
              {pendingWithdrawals.map(w => (
                <div key={w.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <CryptoIcon symbol={w.currency} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{w.first_name} {w.last_name}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{parseFloat(w.amount).toFixed(4)} {w.currency}</p>
                  </div>
                  <Link to="/admin/withdrawals">
                    <button className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-all font-medium whitespace-nowrap">Review</button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
