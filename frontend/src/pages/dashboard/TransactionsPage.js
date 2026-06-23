import React, { useState, useEffect } from 'react';
import { userAPI } from '../../utils/api';
import { Card, Badge, Spinner, EmptyState, CryptoIcon } from '../../components/ui';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (type) params.type = type;
    if (currency) params.currency = currency;
    userAPI.getTransactions(params).then(r => {
      setTransactions(r.data.data);
      setPagination(r.data.pagination);
    }).catch(()=>{}).finally(() => setLoading(false));
  }, [type, currency, page]);

  const typeConfig = {
    deposit:    { icon: '↓', label: 'Deposit',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', sign: '+' },
    withdrawal: { icon: '↑', label: 'Withdrawal', color: 'text-red-400',     bg: 'bg-red-500/10',     sign: '-' },
    credit:     { icon: '+', label: 'Credit',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', sign: '+' },
    debit:      { icon: '-', label: 'Debit',      color: 'text-red-400',     bg: 'bg-red-500/10',     sign: '-' },
  };

  const FilterBtn = ({ value, label, active, onClick }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${active ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' : 'bg-white/3 text-slate-500 border-white/5 hover:text-white'}`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Transaction History</h1>
        <p className="text-slate-500 mt-1">Your complete account activity</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-600 mr-1">Type:</span>
            {[{v:'',l:'All'},{v:'deposit',l:'Deposits'},{v:'withdrawal',l:'Withdrawals'},{v:'credit',l:'Credits'},{v:'debit',l:'Debits'}].map(t => (
              <FilterBtn key={t.v} value={t.v} label={t.l} active={type===t.v} onClick={() => { setType(t.v); setPage(1); }}/>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-600 mr-1">Asset:</span>
            {['','BTC','ETH','USDT','BNB','SOL'].map(c => (
              <FilterBtn key={c} label={c||'All'} active={currency===c} onClick={() => { setCurrency(c); setPage(1); }}/>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <Spinner className="py-16" size="lg"/> :
         transactions.length === 0 ? <EmptyState icon="⇄" title="No transactions" description="Adjust filters or make your first transaction"/> : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Type','Asset','Amount','Balance After','Description','Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(tx => {
                    const cfg = typeConfig[tx.type] || { icon:'↔', color:'text-slate-400', bg:'bg-white/5', sign:'' };
                    return (
                      <tr key={tx.id} className="hover:bg-white/2 transition-all">
                        <td className="px-5 py-3.5 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                            <span className="text-sm text-white capitalize">{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2"><CryptoIcon symbol={tx.currency} size="xs"/><span className="text-sm text-white">{tx.currency}</span></div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-semibold font-mono ${cfg.color}`}>{cfg.sign}{parseFloat(tx.amount).toFixed(8)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-slate-500 font-mono">{tx.balance_after ? parseFloat(tx.balance_after).toFixed(6) : '—'}</span>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <span className="text-sm text-slate-600 truncate block">{tx.description || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5 pr-6 text-right">
                          <span className="text-xs text-slate-600">{new Date(tx.created_at).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-white/5">
              {transactions.map(tx => {
                const cfg = typeConfig[tx.type] || { icon:'↔', color:'text-slate-400', bg:'bg-white/5', sign:'' };
                return (
                  <div key={tx.id} className="px-4 py-3.5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white capitalize">{tx.type}</span>
                        <span className={`text-sm font-semibold font-mono ${cfg.color}`}>{cfg.sign}{parseFloat(tx.amount).toFixed(4)} {tx.currency}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-slate-600 truncate">{tx.description || tx.currency}</span>
                        <span className="text-xs text-slate-600 ml-2 flex-shrink-0">{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-sm text-slate-600">Page {page} of {pagination.pages} · {pagination.total} total</p>
                <div className="flex gap-2">
                  <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-slate-400 disabled:opacity-30 hover:text-white border border-white/5 transition-all">← Prev</button>
                  <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-slate-400 disabled:opacity-30 hover:text-white border border-white/5 transition-all">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default TransactionsPage;
