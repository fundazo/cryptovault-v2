
import { FaBitcoin, FaEthereum, FaCoins } from 'react-icons/fa';

import {
  SiTether,
  SiBinance,
  SiSolana,
  SiCardano,
  SiDogecoin,
  SiLitecoin,
  SiPolygon,
  SiChainlink,
  SiPolkadot
} from 'react-icons/si';

export const CRYPTOS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: FaBitcoin,
    color: '#f7931a'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: FaEthereum,
    color: '#627eea'
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    icon: SiTether,
    color: '#26a17b'
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    icon: SiBinance,
    color: '#f0b90b'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: SiSolana,
    color: '#9945ff'
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    icon: SiDogecoin,
    color: '#c2a633'
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    icon: SiLitecoin,
    color: '#345c9c'
  },
];

export const formatCompactNumber = (num) => {
  const n = Number(num) || 0;

  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;

  return n.toFixed(2);
};
export const formatBalance = (amount) => {
  const num = Number(amount) || 0;

  if (num >= 1000) return formatCompactNumber(num);
  if (num >= 1) return num.toFixed(4);
  if (num > 0) return num.toFixed(8);

  return '0';
};
export const getCrypto = (symbol) => CRYPTOS.find(c => c.symbol === symbol) || CRYPTOS[0];

export const formatUSD = (amount, price) => {
  const usd = (parseFloat(amount) || 0) * (price || 0);

  if (usd < 0.01) return '$0.00';
  if (usd < 1000) return `$${usd.toFixed(2)}`;
  if (usd < 1000000) return `$${(usd / 1000).toFixed(1)}K`;
  if (usd < 1000000000) return `$${(usd / 1000000).toFixed(1)}M`;

  return `$${(usd / 1000000000).toFixed(1)}B`;
};

export const getTotalUSD = (balances, prices) => {
  return CRYPTOS.reduce((total, crypto) => {
    const bal = parseFloat(
      balances?.[`${crypto.symbol.toLowerCase()}_balance`] || 0
    );

    const price = prices?.[crypto.symbol]?.price || 0;

    return total + bal * price;
  }, 0);
};