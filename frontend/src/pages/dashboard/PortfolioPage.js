import React, { useState, useEffect } from 'react';
import { userAPI } from '../../utils/api';
import { Card, CryptoIcon, Spinner } from '../../components/ui';
import { CRYPTOS, getTotalUSD, formatCompactNumber } from '../../utils/crypto';
import { fetchPrices } from '../../utils/prices';

const PortfolioPage = () => {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
const [prices, setPrices] = useState({});
  useEffect(() => {
    userAPI.getBalances().then(r => setBalances(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
  fetchPrices()
    .then(setPrices)
    .catch(console.error);
}, []);

const totalUSD = getTotalUSD(balances, prices);

const assets = CRYPTOS.map(c => {
  const bal = parseFloat(
    balances?.[`${c.symbol.toLowerCase()}_balance`] || 0
  );

  const price = prices?.[c.symbol]?.price || 0;
  const change = prices?.[c.symbol]?.change || 0;

  const usd = bal * price;
  const pct = totalUSD > 0 ? (usd / totalUSD) * 100 : 0;

  return {
    ...c,
    bal,
    price,
    change,
    usd,
    pct,
  };
}).sort((a, b) => b.usd - a.usd);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg"/></div>;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-slate-500 mt-1">All your crypto assets</p>
      </div>

      {/* Total */}
      <div className="rounded-2xl p-6 border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
        <p className="text-slate- text-sm mb-1">Total Portfolio Value</p>
        <p className="font-display text-3xl font-bold text-white">
        ${formatCompactNumber(totalUSD)}
        </p>
      </div>

      {/* All assets */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">All Assets ({CRYPTOS.length})</h3>
        </div>
        <div className="divide-y divide-white/5">
          {assets.map(a => (
            <div key={a.symbol} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-all">
              <CryptoIcon symbol={a.symbol} size="md" />
                 <div className="flex-1 min-w-0">
  <div>
    <p className="text-sm font-semibold text-white leading-tight">
  {a.name}
</p>

<p className="text-xs text-slate-500 mt-0.5 leading-tight">
  {Number(a.bal).toLocaleString()} {a.symbol}
</p>

<div className="flex items-center gap-2 mt-1">
      <div className="flex-1 max-w-24 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-primary transition-all"
          style={{ width: `${Math.min(a.pct, 100)}%` }}
        />
      </div>

      <span className="text-xs text-slate-600">
        <span className="text-xs text-slate-600">
  {a.pct >= 99.99
    ? '99.99%'
    : a.pct < 0.01
    ? '<0.01%'
    : `${a.pct.toFixed(2)}%`}
</span>
      </span>
    </div>
  </div>
</div>

<div className="text-right min-w-[180px]">
  <p className="text-sm font-semibold text-white">
    ${formatCompactNumber(a.usd)}
  </p>

  <p className="text-xs text-slate-500">
    ${a.price.toLocaleString()} •
    <span
      className={`ml-1 ${
        a.change >= 0 ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      {a.change >= 0 ? '+' : ''}
      {Number(a.change || 0).toFixed(2)}%
    </span>
  </p>
</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PortfolioPage;
