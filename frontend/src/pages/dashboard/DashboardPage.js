import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, depositAPI, withdrawalAPI } from '../../utils/api';
import { Card, Badge, Spinner, CryptoIcon, EmptyState } from '../../components/ui';
import {CRYPTOS, getTotalUSD,formatCompactNumber} from '../../utils/crypto';
import { fetchPrices } from '../../utils/prices';


const BalanceCard = ({ crypto, balance, price, change }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all">
      <CryptoIcon symbol={crypto.symbol} size="sm"/>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{crypto.name}</p>
        <p className="text-xs text-slate-500 font-mono truncate">
        {Number(balance).toLocaleString()} {crypto.symbol}
      </p>
      </div>
      <div className="text-right flex-shrink-0">
      <p className="text-sm font-semibold text-white">
      ${formatCompactNumber((balance || 0) * (price || 0))}
      </p>
   <p className={`text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{change >= 0 ? '+' : ''}{Number(change || 0).toFixed(2)}%</p>
      </div>
    </div>
  );
};

const TxRow = ({ tx }) => {
  const isPositive = tx.type === 'deposit' || tx.type === 'credit';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {isPositive ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
        <p className="text-xs text-slate-600 truncate">{new Date(tx.created_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : '-'}{parseFloat(tx.amount).toFixed(4)} {tx.currency}
        </p>
      </div>
    </div>
  );
};

const MarketRow = ({ crypto, priceData }) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3 py-2.5 border-b border-white/5 last:border-0">
      <CryptoIcon symbol={crypto.symbol} size="sm"/>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{crypto.symbol}</p>
        <p className="text-xs text-slate-600 hidden sm:block">{crypto.name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white">${priceData?.price?.toLocaleString()}</p>
        <p className={`text-xs font-medium ${priceData?.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
  {priceData?.change >= 0 ? '+' : ''}
  {Number(priceData?.change || 0).toFixed(2)}%
</p>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userAPI.getBalances(),
      userAPI.getTransactions({ limit: 6 }),
      depositAPI.getUserDeposits({ limit: 3 }),
      withdrawalAPI.getUserWithdrawals({ limit: 3 }),
    ]).then(([b, t, d, w]) => {
      setBalances(b.data.data);
      setTransactions(t.data.data);
      setDeposits(d.data.data);
      setWithdrawals(w.data.data);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const [prices, setPrices] = useState({});

useEffect(() => {
  fetchPrices()
    .then(setPrices)
    .catch(console.error);
}, []);
 

const total = getTotalUSD(balances, prices);
  const nonZero = CRYPTOS.filter(c => parseFloat(balances?.[`${c.symbol.toLowerCase()}_balance`]||0) > 0);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg"/></div>;

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">

      {/* Hero card */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1d3a 0%, #0d1117 50%, #1a0a2e 100%)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"/>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm">
                Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {user?.first_name} 👋
              </p>
            </div>
            <Link to="/dashboard/deposit">
              <button className="btn-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold flex-shrink-0">+ Deposit</button>
            </Link>
          </div>

          <div>
            <p className="text-slate-400 text-xs mb-1">Total Balance</p>
            <p className="font-display text-2xl sm:text-4xl font-bold text-white">
            ${formatCompactNumber(total)}
            </p>
            <p className="text-emerald-400 text-xs sm:text-sm mt-1 font-medium">↑ Portfolio value</p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6">
            {[
              { label:'Deposit',  icon:'↓', to:'/dashboard/deposit',      color:'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
              { label:'Withdraw', icon:'↑', to:'/dashboard/withdraw',     color:'bg-red-500/10 border-red-500/20 text-red-400' },
              { label:'History',  icon:'⇄', to:'/dashboard/transactions', color:'bg-blue-500/10 border-blue-500/20 text-blue-400' },
            ].map(a => (
              <Link key={a.label} to={a.to}>
                <div className={`rounded-xl border p-2.5 sm:p-3 flex flex-col items-center gap-1 transition-all cursor-pointer ${a.color}`}>
                  <span className="text-lg sm:text-xl">{a.icon}</span>
                  <span className="text-xs font-semibold">{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Balances + Market — stacked mobile, side by side desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white text-sm sm:text-base">Wallet Balances</h3>
            <Link to="/dashboard/portfolio" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {nonZero.length === 0 ? (
            <EmptyState icon="💼" title="No balances yet" description="Make a deposit to get started"
              action={<Link to="/dashboard/deposit"><button className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">Deposit Now</button></Link>}/>
          ) : (
            <div className="space-y-2">
              {nonZero.slice(0,6).map(c => (
                <BalanceCard
                 key={c.symbol}
                 crypto={c}
                 balance={balances[`${c.symbol.toLowerCase()}_balance`] || 0}
                 price={prices?.[c.symbol]?.price || 0}
                 change={prices?.[c.symbol]?.change || 0}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white text-sm sm:text-base">Market</h3>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse-dot"/>Live
            </span>
          </div>
          {CRYPTOS.slice(0,8).map(c => (
  <MarketRow
    key={c.symbol}
    crypto={c}
    priceData={prices?.[c.symbol]}
  />
))}
        </Card>
      </div>

      {/* Activity + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white text-sm sm:text-base">Recent Activity</h3>
            <Link to="/dashboard/transactions" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {transactions.length === 0
            ? <EmptyState icon="⇄" title="No activity yet"/>
            : <div>{transactions.map(tx => <TxRow key={tx.id} tx={tx}/>)}</div>
          }
        </Card>

        <Card className="p-4 sm:p-5">
          <h3 className="font-display font-semibold text-white text-sm sm:text-base mb-3">Pending Requests</h3>
          <div className="space-y-2">
            {[
              ...deposits.filter(d=>d.status==='pending').map(d=>({...d,reqType:'deposit'})),
              ...withdrawals.filter(w=>w.status==='pending').map(w=>({...w,reqType:'withdrawal'}))
            ].slice(0,4).map(r => (
              <div key={r.id} className="flex items-center gap-2 sm:gap-3 p-2.5 rounded-xl bg-white/3 border border-white/5">
                <CryptoIcon symbol={r.currency} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white capitalize">{r.reqType}</p>
                  <p className="text-xs text-slate-500 truncate">{parseFloat(r.amount).toFixed(4)} {r.currency}</p>
                </div>
                <Badge variant="pending">Pending</Badge>
              </div>
            ))}
            {deposits.filter(d=>d.status==='pending').length===0 && withdrawals.filter(w=>w.status==='pending').length===0 && (
              <EmptyState icon="" title="No pending requests"/>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
