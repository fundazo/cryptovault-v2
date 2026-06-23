import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { withdrawalAPI, userAPI } from '../../utils/api';
import { Button, Card, Badge, CryptoIcon, EmptyState, Spinner } from '../../components/ui';
import { CRYPTOS, formatCompactNumber } from '../../utils/crypto';

const WithdrawPage = () => {
  const [form, setForm] = useState({ currency: 'BTC', amount: '', destination_address: '' });
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({});
  const [withdrawals, setWithdrawals] = useState([]);
  const [wLoading, setWLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [b, w] = await Promise.all([userAPI.getBalances(), withdrawalAPI.getUserWithdrawals()]);
      setBalances(b.data.data); setWithdrawals(w.data.data);
    } catch {} finally { setWLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const currentBalance = parseFloat(balances[`${form.currency.toLowerCase()}_balance`] || 0);
  const selectedCrypto = CRYPTOS.find(c => c.symbol === form.currency);
  const amountNum = parseFloat(form.amount) || 0;
  const insufficient = amountNum > currentBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (insufficient || amountNum <= 0) { toast.error('Invalid amount'); return; }
    setLoading(true);
    try {
      await withdrawalAPI.createWithdrawal({ ...form, amount: amountNum });
      toast.success('Withdrawal requested! Awaiting admin approval.');
      setSuccess(true);
      setForm(f => ({ ...f, amount: '', destination_address: '' }));
      await loadData();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Withdraw</h1>
        <p className="text-slate-500 mt-1">Send crypto to your external wallet</p>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-400">Withdrawal Requested</p>
            <p className="text-sm text-slate-400">Admin will process your request. You'll be notified via email.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6">
          <h3 className="font-display font-semibold text-white mb-5">New Withdrawal</h3>

          {/* Currency selector */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-5">
            {CRYPTOS.slice(0,10).map(c => {
              const bal = parseFloat(balances[`${c.symbol.toLowerCase()}_balance`] || 0);
              return (
                <button key={c.symbol} onClick={() => setForm(f=>({...f,currency:c.symbol,amount:''}))}
                  className={`rounded-xl border p-2.5 flex flex-col items-center gap-1 transition-all
                    ${form.currency === c.symbol ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5 bg-white/3 hover:border-white/15'}`}>
                  <CryptoIcon symbol={c.symbol} size="sm"/>
                  <span className="text-xs font-semibold text-white">{c.symbol}</span>
                  <span className="text-xs text-slate-600 font-mono truncate w-full text-center">{formatCompactNumber(bal)} {c.symbol}</span>
                </button>
              );
            })}
          </div>

          {/* Balance display */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 mb-5">
            <CryptoIcon symbol={form.currency} size="sm"/>
            <div className="flex-1">
              <p className="text-xs text-slate-500">Available {form.currency} Balance</p>
              <p className="text-sm font-semibold text-white font-mono">{formatCompactNumber(currentBalance)} {selectedCrypto?.symbol}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-400">Amount</label>
                <button type="button" onClick={() => setForm(f=>({...f,amount:currentBalance.toFixed(8)}))}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">Use Max</button>
              </div>
              <div className="relative">
                <input type="number" step="any" placeholder="0.00" value={form.amount}
                  onChange={e => setForm(f=>({...f,amount:e.target.value}))} required
                  className={`input-field font-mono pr-16 ${insufficient ? 'border-red-500/50' : ''}`}/>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">{form.currency}</span>
              </div>
              {insufficient && <p className="text-xs text-red-400">⚠ Insufficient balance</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Destination Address</label>
              <textarea className="input-field resize-none font-mono" rows={2}
                placeholder={`Enter your ${form.currency} wallet address...`} value={form.destination_address}
                onChange={e => setForm(f=>({...f,destination_address:e.target.value}))} required/>
            </div>

            <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-3.5">
              <p className="text-xs font-semibold text-yellow-400 mb-1">⚠ Important Notice</p>
              <p className="text-xs text-slate-500">Double-check the address before submitting. Crypto transactions are irreversible. Withdrawals require admin approval before processing.</p>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!form.amount || !form.destination_address || insufficient}>
              Request Withdrawal
            </Button>
          </form>
        </Card>

        {/* History */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-display font-semibold text-white mb-4">Withdrawal History</h3>
          {wLoading ? <Spinner className="py-8"/> : withdrawals.length === 0 ? <EmptyState icon="↑" title="No withdrawals yet"/> : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {withdrawals.map(w => (
                <div key={w.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <CryptoIcon symbol={w.currency} size="xs"/>
                      <span className="text-sm font-semibold text-white">{Number(w.amount).toLocaleString()} {w.currency}</span>
                    </div>
                    <Badge variant={w.status}>{w.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-mono truncate">To: {w.destination_address.slice(0,22)}...</p>
                  {w.txid && <p className="text-xs text-emerald-400 font-mono truncate mt-1">TXID: {w.txid.slice(0,22)}...</p>}
                  {w.admin_note && <p className="text-xs text-yellow-400 mt-1.5 bg-yellow-500/8 rounded p-1.5">📝 {w.admin_note}</p>}
                  <p className="text-xs text-slate-700 mt-1">{new Date(w.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WithdrawPage;
