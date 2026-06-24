import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Input, Modal, Spinner, EmptyState, CryptoIcon } from '../../components/ui';

const ReviewModal = ({ item, type, onClose, onSuccess }) => {
  const [form, setForm] = useState({ status: 'approved', admin_note: '', txid: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (type === 'deposit') await adminAPI.reviewDeposit(item.id, form);
      else await adminAPI.reviewWithdrawal(item.id, form);
      toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} ${form.status}`);
      onSuccess(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-white/3 border border-white/5 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <CryptoIcon symbol={item.currency} size="md"/>
          <div>
            <p className="font-semibold text-white">{parseFloat(item.amount).toFixed(8)} {item.currency}</p>
            <p className="text-sm text-slate-500">{item.first_name} {item.last_name} · {item.email}</p>
          </div>
        </div>
        {type === 'deposit' && (
          <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
            <p className="text-xs text-slate-600 mb-1">Transaction Hash:</p>
            <p className="text-xs font-mono text-blue-400 break-all">{item.txid}</p>
          </div>
        )}
        {type === 'withdrawal' && (
          <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
            <p className="text-xs text-slate-600 mb-1">Destination Address:</p>
            <p className="text-xs font-mono text-blue-400 break-all">{item.destination_address}</p>
          </div>
        )}
        <p className="text-xs text-slate-700">Submitted: {new Date(item.created_at).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['approved','rejected'].map(s => (
          <button key={s} type="button" onClick={() => setForm(f=>({...f,status:s}))}
            className={`py-3 rounded-xl border font-semibold text-sm transition-all capitalize
              ${form.status === s
                ? s==='approved' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-red-500/15 border-red-500/40 text-red-400'
                : 'bg-white/3 border-white/5 text-slate-500 hover:text-white'}`}>
            {s==='approved' ? '✓ Approve' : '✗ Reject'}
          </button>
        ))}
      </div>

      {type === 'withdrawal' && form.status === 'approved' && (
        <Input label="Outgoing TXID (optional)" placeholder="Enter after processing payment" value={form.txid} onChange={e=>setForm(f=>({...f,txid:e.target.value}))}/>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-400">Note to user (optional)</label>
        <textarea className="input-field resize-none" rows={2}
          placeholder={form.status==='rejected' ? 'Reason for rejection...' : 'Optional message...'} value={form.admin_note}
          onChange={e=>setForm(f=>({...f,admin_note:e.target.value}))}/>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" variant={form.status==='approved'?'success':'danger'} className="flex-1" loading={loading}>
          {form.status==='approved' ? 'Approve' : 'Reject'}
        </Button>
      </div>
    </form>
  );
};

const AdminTable = ({ type }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [reviewItem, setReviewItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const fn = type === 'deposit' ? adminAPI.getDeposits : adminAPI.getWithdrawals;
      const res = await fn({ status: status||undefined, limit: 50 });
      setItems(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, type]); // eslint-disable-line

  const title = type === 'deposit' ? 'Deposits' : 'Withdrawals';

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Manage {title}</h1>
        <p className="text-slate-500 mt-1">Review and process {title.toLowerCase()}</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2 flex-wrap">
          {[{v:'pending',l:'Pending'},{v:'approved',l:'Approved'},{v:'rejected',l:'Rejected'},{v:'',l:'All'}].map(s => (
            <button key={s.v} onClick={()=>setStatus(s.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border
                ${status===s.v ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' : 'bg-white/3 text-slate-500 border-white/5 hover:text-white'}`}>
              {s.l}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <Spinner className="py-16" size="lg"/> : items.length === 0 ? (
          <EmptyState icon={type==='deposit'?'↓':'↑'} title={`No ${status||''} ${title.toLowerCase()}`}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
  <thead>
    <tr className="border-b border-white/5">
      {['User','Currency','Amount', type==='deposit'?'TXID':'Destination','Date','Status','Action'].map(h => (
        <th
          key={h}
          className="text-left px-4 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider first:pl-6 last:pr-6"
        >
          {h}
        </th>
      ))}
    </tr>
  </thead>

  <tbody className="divide-y divide-white/5">
    {items.map(item => (
      <tr
        key={item.id}
        className="h-16 hover:bg-white/2 transition-all"
      >
        <td className="px-4 py-4 pl-6 align-middle">
          <div>
            <p className="text-sm font-medium text-white">
              {item.first_name} {item.last_name}
            </p>
            <p className="text-xs text-slate-600 truncate">
              {item.email}
            </p>
          </div>
        </td>

        <td className="px-4 py-4 align-middle">
          <div className="flex items-center gap-2">
            <CryptoIcon symbol={item.currency} size="xs" />
            <span className="text-sm text-white">
              {item.currency}
            </span>
          </div>
        </td>

        <td className="px-4 py-4 align-middle">
          <span className="text-sm font-semibold font-mono text-white">
            {parseFloat(item.amount).toFixed(6)}
          </span>
        </td>

        <td className="px-4 py-4 max-w-[180px] align-middle">
          <span className="text-xs font-mono text-slate-500 truncate block">
            {type === 'deposit'
              ? item.txid?.slice(0, 22) + '...'
              : item.destination_address?.slice(0, 22) + '...'}
          </span>
        </td>

        <td className="px-4 py-4 align-middle">
          <span className="text-xs text-slate-600">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </td>

        <td className="px-4 py-4 align-middle">
          <div className="flex items-center">
            <Badge variant={item.status}>
              {item.status}
            </Badge>
          </div>
        </td>

        <td className="px-4 py-4 pr-6 align-middle">
          {item.status === 'pending' ? (
            <Button
              size="xs"
              onClick={() => setReviewItem(item)}
            >
              Review
            </Button>
          ) : item.admin_note ? (
            <span className="text-xs text-slate-600 italic">
              {item.admin_note.slice(0, 20)}...
            </span>
          ) : (
            <span className="text-xs text-slate-700">
              —
            </span>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
          </div>
        )}
      </Card>

      <Modal isOpen={!!reviewItem} onClose={()=>setReviewItem(null)} title={`Review ${type==='deposit'?'Deposit':'Withdrawal'}`}>
        {reviewItem && <ReviewModal item={reviewItem} type={type} onClose={()=>setReviewItem(null)} onSuccess={load}/>}
      </Modal>
    </div>
  );
};

export const AdminDepositsPage = () => <AdminTable type="deposit"/>;
export const AdminWithdrawalsPage = () => <AdminTable type="withdrawal"/>;
