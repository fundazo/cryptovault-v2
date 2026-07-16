import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowDown, FaArrowUp, FaBriefcase, FaHistory, FaPlus, FaWallet } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { userAPI, depositAPI, withdrawalAPI } from '../../utils/api';
import { Card, Badge, Spinner, CryptoIcon, EmptyState } from '../../components/ui';
import {CRYPTOS, getTotalUSD,formatCompactNumber} from '../../utils/crypto';
import { fetchPrices } from '../../utils/prices';


const BalanceCard = ({ crypto, balance, price, change }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-gradient-to-r from-white/6 to-transparent p-3.5 transition-all hover:border-white/15 hover:bg-white/8">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
        <CryptoIcon symbol={crypto.symbol} size="sm"/>
      </div>
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
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/3 px-3 py-3 transition-all hover:bg-white/5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm flex-shrink-0 ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
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
    <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/5 bg-white/3 px-2.5 py-2.5 transition-all hover:bg-white/5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
        <CryptoIcon symbol={crypto.symbol} size="sm"/>
      </div>
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
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6 page-enter">

      {/* Hero card */}
      <div className="mx-auto w-full max-w-6xl rounded-[20px] border border-white/10 bg-[#0f172a] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-blue-400 shadow-lg shadow-blue-500/10">
                <FaWallet className="text-lg" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Welcome back</p>
                <p className="text-lg font-semibold text-white">
                  Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {user?.first_name}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[18px]">
              <div className="w-full max-w-[20rem] sm:max-w-[22rem]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Total balance</p>
                <p className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-white leading-tight">
                  ${formatCompactNumber(total)}
                </p>
              </div>
            </div>

            <div className="mt-4 w-full  rounded-[18px] ">
  <div className="flex flex-row gap-2">
    {[
      { label:'Deposit', icon: FaArrowDown, to:'/dashboard/deposit', color:'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
      { label:'Withdraw', icon: FaArrowUp, to:'/dashboard/withdraw', color:'bg-red-500/10 border-red-500/20 text-red-400' },
      { label:'History', icon: FaHistory, to:'/dashboard/transactions', color:'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    ].map(a => {
      const Icon = a.icon;
      return (
        <Link key={a.label} to={a.to} className="flex-1">
          <div className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center transition-all hover:-translate-y-0.5 ${a.color}`}>
            <span className="flex items-center justify-center text-base"><Icon /></span>
            <span className="whitespace-nowrap text-xs font-semibold">{a.label}</span>
          </div>
        </Link>
      );
    })}
  </div>
</div>
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
            <EmptyState icon={<FaBriefcase className="text-2xl" />} title="No balances yet" description="Make a deposit to get started"
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

        <Card className="p-4 sm:p-5 space-y-2">
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
            : <div className="space-y-2">{transactions.map(tx => <TxRow key={tx.id} tx={tx}/>)}</div>
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
