import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Input, Spinner, CryptoIcon, CopyButton } from '../../components/ui';
import { CRYPTOS } from '../../utils/crypto';

export const AdminWalletsPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ currency: 'BTC', address: '', label: '', network: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const res = await adminAPI.getWalletAddresses(); setAddresses(res.data.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await adminAPI.upsertWalletAddress(form); toast.success(`${form.currency} address updated`); setForm(f=>({...f,address:'',label:'',network:''})); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const activeFor = (symbol) => addresses.find(a => a.currency === symbol && a.is_active);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Wallet Addresses</h1>
        <p className="text-slate-500 mt-1">Set deposit addresses for each cryptocurrency</p>
      </div>

      {/* Current active addresses */}
      <div className="grid sm:grid-cols-3 gap-4">
  {CRYPTOS.map(c => {
    const active = activeFor(c.symbol);

    return (
      <Card key={c.symbol} className={`p-5 ${!active ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-3 mb-3">
          <CryptoIcon symbol={c.symbol} size="sm" />
          <div>
            <p className="font-semibold text-white text-sm">
              {c.symbol}
            </p>
            <Badge
              variant={active ? 'approved' : 'rejected'}
              size="xs"
            >
              {active ? 'Active' : 'Not Set'}
            </Badge>
          </div>
        </div>

        {active ? (
          <>
            <p className="text-xs text-slate-600 mb-1">
              {active.label} {active.network && `· ${active.network}`}
            </p>

            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/5">
              <code className="text-xs text-blue-400 flex-1 break-all font-mono">
                {active.address}
              </code>
              <CopyButton text={active.address} />
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-600">
            No address configured
          </p>
        )}
      </Card>
    );
  })}
</div>

      {/* Update form */}
      <Card className="p-6">
        <h3 className="font-display font-semibold text-white mb-5">Update Wallet Address</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Select cryptocurrency</label>
            <div className="grid grid-cols-5 gap-2">
                {CRYPTOS.map(c => (
                <button key={c.symbol} type="button" onClick={()=>setForm(f=>({...f,currency:c.symbol}))}
                  className={`rounded-xl border p-2 flex flex-col items-center gap-1 transition-all
                    ${form.currency===c.symbol ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5 bg-white/3 hover:border-white/15'}`}>
                  <CryptoIcon symbol={c.symbol} size="xs"/>
                  <span className="text-xs font-semibold text-white">{c.symbol}</span>
                </button>
              ))}
            </div>
          </div>
          <Input label={`${form.currency} Wallet Address`} placeholder={`Enter ${form.currency} deposit address`} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} required/>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Label (optional)" placeholder="e.g. Main Wallet" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}/>
            <Input label="Network (optional)" placeholder="e.g. ERC20, TRC20" value={form.network} onChange={e=>setForm(f=>({...f,network:e.target.value}))}/>
          </div>
          <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-3">
            <p className="text-xs text-yellow-400">⚠ Setting a new address will deactivate the previous one for {form.currency}.</p>
          </div>
          <Button type="submit" loading={saving}>Save Address</Button>
        </form>
      </Card>

      {/* All addresses history */}
      {!loading && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-white mb-4">Address History ({addresses.length})</h3>
          <div className="space-y-2">
            {addresses.map(a => (
              <div key={a.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${a.is_active ? 'border-blue-500/15 bg-blue-500/5' : 'border-white/5 bg-white/2 opacity-50'}`}>
                <CryptoIcon symbol={a.currency} size="sm"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{a.label || a.currency}</span>
                    {a.network && <span className="text-xs text-slate-600">· {a.network}</span>}
                    {a.is_active && <Badge variant="approved" size="xs">Active</Badge>}
                  </div>
                  <code className="text-xs text-slate-500 font-mono break-all">{a.address}</code>
                </div>
                <CopyButton text={a.address}/>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export const AdminAllTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    setLoading(true);
    adminAPI.getTransactions({ page, limit: 30 }).then(r => { setTransactions(r.data.data); setPagination(r.data.pagination); }).catch(()=>{}).finally(()=>setLoading(false));
  }, [page]);

  const typeColors = { deposit:'text-emerald-400', withdrawal:'text-red-400', credit:'text-emerald-400', debit:'text-red-400' };
  const typeSigns = { deposit:'+', withdrawal:'-', credit:'+', debit:'-' };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">All Transactions</h1>
        <p className="text-slate-500 mt-1">Complete platform ledger · {pagination.total} records</p>
      </div>

      <Card className="overflow-hidden">
        {loading ? <Spinner className="py-16" size="lg"/> : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-600">No transactions yet</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['User','Type','Asset','Amount','Description','Date'].map(h=>(
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/2 transition-all">
                      <td className="px-4 py-3.5 pl-6">
                        <p className="text-sm font-medium text-white">{tx.first_name} {tx.last_name}</p>
                        <p className="text-xs text-slate-600">{tx.email}</p>
                      </td>
                      <td className="px-4 py-3.5"><span className={`text-sm font-medium capitalize ${typeColors[tx.type]||'text-slate-400'}`}>{tx.type}</span></td>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-1.5"><CryptoIcon symbol={tx.currency} size="xs"/><span className="text-sm text-white">{tx.currency}</span></div></td>
                      <td className="px-4 py-3.5"><span className={`text-sm font-semibold font-mono ${typeColors[tx.type]||'text-slate-400'}`}>{typeSigns[tx.type]||''}{parseFloat(tx.amount).toFixed(6)}</span></td>
                      <td className="px-4 py-3.5 max-w-xs"><span className="text-xs text-slate-600 truncate block">{tx.description||'—'}</span></td>
                      <td className="px-4 py-3.5 pr-6 text-xs text-slate-600">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-sm text-slate-600">Page {page} of {pagination.pages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page>=pagination.pages} onClick={()=>setPage(p=>p+1)}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
