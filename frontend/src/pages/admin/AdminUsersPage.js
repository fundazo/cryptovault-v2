import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { Card, Badge, Button, Input, Modal, Spinner, EmptyState, CryptoIcon } from '../../components/ui';
import { FaSearch, FaUserShield } from 'react-icons/fa';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ currency: 'BTC', amount: '', type: 'credit', description: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search]); // eslint-disable-line

  const handleToggle = async (id, active) => {
    try { await adminAPI.toggleUserStatus(id); toast.success(`User ${active ? 'deactivated' : 'activated'}`); load(); }
    catch { toast.error('Failed'); }
  };

  const handleBalance = async (e) => {
    e.preventDefault(); setActionLoading(true);
    try {
      await adminAPI.adjustBalance({ user_id: balanceModal.id, ...balanceForm, amount: parseFloat(balanceForm.amount) });
      toast.success(`Balance ${balanceForm.type}ed`);
      setBalanceModal(null);
      setBalanceForm({ currency: 'BTC', amount: '', type: 'credit', description: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">User Management</h1>
        <p className="text-slate-500 mt-1">{pagination.total} registered users</p>
      </div>

      <Card className="p-4">
        <Input placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          icon={<FaSearch className="text-sm" />} />
      </Card>

      <Card className="overflow-hidden">
        {loading ? <Spinner className="py-16" size="lg"/> : users.length === 0 ? <EmptyState icon={<FaUserShield className="text-2xl" />} title="No users found"/> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['User','Status','BTC','ETH','USDT','Joined','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/2 transition-all">
                      <td className="px-4 py-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-slate-600 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <Badge variant={u.is_active ? 'approved' : 'rejected'} size="xs">{u.is_active ? 'Active' : 'Banned'}</Badge>
                          <Badge variant={u.role === 'admin' ? 'admin' : 'user'} size="xs">{u.role}</Badge>
                          {!u.is_verified && <Badge variant="warning" size="xs">Unverified</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-orange-400">{parseFloat(u.btc_balance||0).toFixed(4)}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-blue-400">{parseFloat(u.eth_balance||0).toFixed(4)}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-emerald-400">{parseFloat(u.usdt_balance||0).toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5 pr-6">
                        <div className="flex gap-1.5 flex-wrap">
                          <Button size="xs" variant="secondary" onClick={() => setSelectedUser(u)}>View</Button>
                          {u.role !== 'admin' && <>
                            <Button size="xs" variant={u.is_active ? 'danger' : 'success'} onClick={() => handleToggle(u.id, u.is_active)}>{u.is_active ? 'Ban' : 'Unban'}</Button>
                            <Button size="xs" variant="outline" onClick={() => setBalanceModal(u)}>Balance</Button>
                          </>}
                        </div>
                      </td>
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

      {/* User detail modal */}
      <Modal isOpen={!!selectedUser} onClose={()=>setSelectedUser(null)} title="User Details">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">{selectedUser.first_name[0]}{selectedUser.last_name[0]}</div>
              <div>
                <h3 className="font-semibold text-white">{selectedUser.first_name} {selectedUser.last_name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{s:'BTC',b:selectedUser.btc_balance,c:'text-orange-400'},{s:'ETH',b:selectedUser.eth_balance,c:'text-blue-400'},{s:'USDT',b:selectedUser.usdt_balance,c:'text-emerald-400'}].map(({s,b,c})=>(
                <div key={s} className="rounded-xl bg-white/3 border border-white/5 p-3 text-center">
                  <CryptoIcon symbol={s} size="sm"/>
                  <p className={`text-sm font-bold font-mono mt-1 ${c}`}>{parseFloat(b||0).toFixed(4)}</p>
                  <p className="text-xs text-slate-600">{s}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-700 font-mono">ID: {selectedUser.id}</p>
          </div>
        )}
      </Modal>

      {/* Balance modal */}
      <Modal isOpen={!!balanceModal} onClose={()=>setBalanceModal(null)} title={`Adjust Balance — ${balanceModal?.first_name} ${balanceModal?.last_name}`}>
        <form onSubmit={handleBalance} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Operation</label>
              <select className="input-field" value={balanceForm.type} onChange={e=>setBalanceForm(f=>({...f,type:e.target.value}))}>
                <option value="credit">Credit (Add)</option>
                <option value="debit">Debit (Deduct)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-400">Currency</label>
              <select className="input-field" value={balanceForm.currency} onChange={e=>setBalanceForm(f=>({...f,currency:e.target.value}))}>
                {['BTC','ETH','USDT','BNB','SOL','XRP','ADA','DOGE','TRX','LTC','MATIC','AVAX','LINK','DOT','SHIB'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Input label="Amount" type="number" step="any" placeholder="0.00" value={balanceForm.amount} onChange={e=>setBalanceForm(f=>({...f,amount:e.target.value}))} required/>
          <Input label="Description (optional)" placeholder="Reason for adjustment" value={balanceForm.description} onChange={e=>setBalanceForm(f=>({...f,description:e.target.value}))}/>
          <div className={`p-3 rounded-xl border text-sm font-medium ${balanceForm.type==='credit' ? 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400' : 'bg-red-500/8 border-red-500/15 text-red-400'}`}>
            {balanceForm.type==='credit' ? '+ Adding' : '− Deducting'} {balanceForm.amount||'0'} {balanceForm.currency} {balanceForm.type==='credit' ? 'to' : 'from'} account
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={()=>setBalanceModal(null)} className="flex-1">Cancel</Button>
            <Button type="submit" variant={balanceForm.type==='credit'?'success':'danger'} className="flex-1" loading={actionLoading}>
              Confirm {balanceForm.type==='credit'?'Credit':'Debit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
