import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { depositAPI } from '../../utils/api';
import { Button, Card, Badge, CryptoIcon, CopyButton, EmptyState, Spinner } from '../../components/ui';
import { CRYPTOS } from '../../utils/crypto';

const DepositPage = () => {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState('BTC');
  const [wallets, setWallets] = useState([]);
  const [form, setForm] = useState({ amount: '', txid: '' });
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [dLoading, setDLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const loadDeposits = () => depositAPI.getUserDeposits().then(r => setDeposits(r.data.data)).catch(()=>{}).finally(()=>setDLoading(false));

  useEffect(() => {
    depositAPI.getWalletAddresses().then(r => setWallets(r.data.data));
    loadDeposits();
  }, []);

  const wallet = wallets.find(w => w.currency === selected);
  const availableCryptos = CRYPTOS.filter(c => wallets.some(w => w.currency === c.symbol));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.txid) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      await depositAPI.createDeposit({ currency: selected, amount: parseFloat(form.amount), txid: form.txid.trim(), wallet_address_id: wallet.id });
      toast.success('Deposit submitted! Awaiting admin review.');
      setSuccess(true); setStep(3);
      setForm({ amount: '', txid: '' });
      await loadDeposits();
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Deposit</h1>
        <p className="text-slate-500 mt-1">Send crypto and submit your transaction hash</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[{n:1,label:'Select'},{n:2,label:'Submit'},{n:3,label:'Done'}].map((s,i,arr) => (
          <React.Fragment key={s.n}>
            <div className={`flex items-center gap-2 ${step >= s.n ? 'text-white' : 'text-slate-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s.n ? 'bg-emerald-500 text-white' : step === s.n ? 'bg-gradient-primary text-white' : 'bg-white/5 text-slate-600'}`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < arr.length-1 && <div className={`flex-1 h-px transition-all ${step > s.n ? 'bg-emerald-500/50' : 'bg-white/5'}`}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">

          {/* Step 1 */}
          {step === 1 && (
            <Card className="p-6 space-y-5">
              <h3 className="font-display font-semibold text-white">Choose cryptocurrency</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {CRYPTOS.map(c => {
                  const avail = wallets.some(w => w.currency === c.symbol);
                  return (
                    <button key={c.symbol} onClick={() => avail && setSelected(c.symbol)} disabled={!avail}
                      className={`rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all text-center
                        ${selected === c.symbol ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5 bg-white/3 hover:border-white/15'}
                        ${!avail ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <CryptoIcon symbol={c.symbol} size="sm" />
                      <span className="text-xs font-semibold text-white">{c.symbol}</span>
                    </button>
                  );
                })}
              </div>

              {wallet ? (
                <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 space-y-3">
                  <p className="text-sm text-slate-400 font-medium">Send {selected} to this address:</p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 border border-white/5">
                    <code className="text-blue-400 text-xs flex-1 break-all font-mono">{wallet.address}</code>
                    <CopyButton text={wallet.address} />
                  </div>
                  {wallet.network && <p className="text-xs text-slate-600">Network: <span className="text-slate-400">{wallet.network}</span></p>}
                  <div className="flex items-start gap-2 bg-yellow-500/8 border border-yellow-500/15 rounded-lg p-3">
                    <span className="text-yellow-400 text-sm flex-shrink-0">⚠</span>
                    <p className="text-xs text-yellow-400/80">Only send {selected} to this address. Sending other assets will result in permanent loss.</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 text-center">
                  <p className="text-sm text-red-400">No deposit address set for {selected}. Contact support.</p>
                </div>
              )}

              <Button onClick={() => setStep(2)} className="w-full" size="lg" disabled={!wallet}>
                I've Sent {selected} →
              </Button>
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card className="p-6">
              <h3 className="font-display font-semibold text-white mb-5">Submit transaction details</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 mb-5">
                <CryptoIcon symbol={selected} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Sending to</p>
                  <code className="text-xs text-blue-400 truncate block font-mono">{wallet?.address}</code>
                </div>
                <CopyButton text={wallet?.address} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Amount sent ({selected})</label>
                  <input type="number" step="any" placeholder="0.00000000" value={form.amount}
                    onChange={e => setForm(f=>({...f,amount:e.target.value}))} required
                    className="input-field font-mono"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Transaction Hash (TXID)</label>
                  <textarea className="input-field resize-none font-mono" rows={3}
                    placeholder="Paste your transaction hash here..." value={form.txid}
                    onChange={e => setForm(f=>({...f,txid:e.target.value}))} required/>
                  <p className="text-xs text-slate-600">Find this in your wallet's transaction history</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} type="button" className="flex-1">← Back</Button>
                  <Button type="submit" className="flex-1" loading={loading}>Submit Deposit</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Deposit Submitted!</h3>
              <p className="text-slate-500 text-sm mb-6">Your deposit is under review. You'll receive a notification once approved — usually within 1–24 hours.</p>
              <Button variant="secondary" onClick={() => { setStep(1); setSuccess(false); }}>Submit Another Deposit</Button>
            </Card>
          )}
        </div>

        {/* History */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-display font-semibold text-white mb-4">Deposit History</h3>
          {dLoading ? <Spinner className="py-8"/> : deposits.length === 0 ? <EmptyState icon="↓" title="No deposits yet"/> : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {deposits.map(d => (
                <div key={d.id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <CryptoIcon symbol={d.currency} size="xs"/>
                      <span className="text-sm font-semibold text-white">{parseFloat(d.amount).toFixed(6)} {d.currency}</span>
                    </div>
                    <Badge variant={d.status}>{d.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-mono truncate">TXID: {d.txid.slice(0,24)}...</p>
                  <p className="text-xs text-slate-700 mt-1">{new Date(d.created_at).toLocaleDateString()}</p>
                  {d.admin_note && <p className="text-xs text-yellow-400 mt-1.5 bg-yellow-500/8 rounded p-1.5">📝 {d.admin_note}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DepositPage;
