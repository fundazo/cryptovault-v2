import axios from 'axios';

export const fetchPrices = async () => {
  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      params: {
        ids: 'bitcoin,ethereum,tether,binancecoin,solana,cardano,dogecoin,litecoin',
        vs_currencies: 'usd',
        include_24hr_change: true,
      },
    }
  );

  return {
    BTC: {
      price: data.bitcoin?.usd || 0,
      change: data.bitcoin?.usd_24h_change || 0,
    },
    ETH: {
      price: data.ethereum?.usd || 0,
      change: data.ethereum?.usd_24h_change || 0,
    },
    USDT: {
      price: data.tether?.usd || 0,
      change: data.tether?.usd_24h_change || 0,
    },
    BNB: {
      price: data.binancecoin?.usd || 0,
      change: data.binancecoin?.usd_24h_change || 0,
    },
    SOL: {
      price: data.solana?.usd || 0,
      change: data.solana?.usd_24h_change || 0,
    },
    ADA: {
      price: data.cardano?.usd || 0,
      change: data.cardano?.usd_24h_change || 0,
    },
    DOGE: {
      price: data.dogecoin?.usd || 0,
      change: data.dogecoin?.usd_24h_change || 0,
    },
    LTC: {
      price: data.litecoin?.usd || 0,
      change: data.litecoin?.usd_24h_change || 0,
    },
  };
};