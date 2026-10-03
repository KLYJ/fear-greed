export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 암호화폐 (기존 공포지수 + 비트코인 현재가/등락률 동시 제공)
  if (target === 'crypto') {
      try {
          // 공포탐욕지수 fetch
          const fngRes = await fetch('https://api.alternative.me/fng/');
          const fngData = await fngRes.json();
          
          // 비트코인 시세 fetch (CoinGecko 무료 API)
          const btcRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
          const btcData = await btcRes.json();

          return res.status(200).json({
              fng: fngData.data[0],
              btcPrice: btcData.bitcoin.usd,
              btcChange: btcData.bitcoin.usd_24h_change
          });
      } catch (error) {
          return res.status(500).json({ error: 'Crypto Error' });
      }
  }

  // 2. 미국 증시 (CNN 공포지수 + S&P500, 나스닥, 다우 지수 및 등락률 동시 제공)
  if (target === 'cnn') {
      try {
          // CNN 공포지수
          const cnnRes = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          const cnnData = await cnnRes.json();

          // 미국 3대 지수 fetch (야후 파이낸스: S&P500=^GSPC, 나스닥=^IXIC, 다우=^DJI)
          const fetchYahoo = async (symbol) => {
              const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
              });
              const d = await r.json();
              const meta = d.chart.result[0].meta;
              const price = meta.regularMarketPrice;
              const prev = meta.chartPreviousClose;
              const change = ((price - prev) / prev) * 100;
              return { price, change };
          };

          const [sp500, nasdaq, dow] = await Promise.all([
              fetchYahoo('^GSPC'),
              fetchYahoo('^IXIC'),
              fetchYahoo('^DJI')
          ]);

          return res.status(200).json({
              cnn: cnnData,
              usIndices: { sp500, nasdaq, dow }
          });
      } catch (error) {
          return res.status(500).json({ error: 'US Market Error' });
      }
  }

  // 3. 한국 증시 (코스피 현재가 및 등락률)
  if (target === 'kr') {
      try {
          const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^KS11', {
              headers: { 
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'application/json'
              }
          });
          if (!response.ok) throw new Error();
          
          const data = await response.json();
          const meta = data.chart.result[0].meta;
          const kospiPrice = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose;
          const ratio = ((kospiPrice - prevClose) / prevClose) * 100;

          return res.status(200).json({ kospi: kospiPrice, ratio: ratio });
      } catch (error) {
          return res.status(500).json({ error: 'KR Error' });
      }
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
