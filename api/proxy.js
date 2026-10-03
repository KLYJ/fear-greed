export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 미국 증시 (이전에 유진 님께서 잘 된다고 하셨던 완벽 작동 CNN 코드 원상 복구)
  if (target === 'cnn') {
      try {
          const response = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          const data = await response.json();
          return res.status(200).json(data);
      } catch (error) {
          return res.status(500).json({ error: 'CNN Error' });
      }
  }

  // 2. 한국 증시 (사파리 보안에 막히지 않도록, 서버에서 트레이딩뷰를 직접 찔러서 가져옴)
  if (target === 'kr') {
      try {
          const tvUrl = 'https://scanner.tradingview.com/korea/scan';
          const tvRes = await fetch(tvUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ "symbols": { "tickers": ["KRX:VKOSPI"] }, "columns": ["close"] })
          });
          const tvData = await tvRes.json();
          
          if (tvData.data && tvData.data.length > 0) {
              return res.status(200).json({ vkospi: tvData.data[0].d[0] });
          }
          throw new Error('데이터 없음');
      } catch (error) {
          return res.status(500).json({ error: 'KR Error' });
      }
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
