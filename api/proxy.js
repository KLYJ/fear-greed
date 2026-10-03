export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 미국 증시 (잘 작동하는 원본 CNN 코드 100% 유지)
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

  // 2. 한국 증시 (지연 없는 야후 파이낸스 코스피 실시간 API 직통 연결)
  if (target === 'kr') {
      try {
          const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^KS11', {
              headers: { 
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'application/json'
              }
          });
          if (!response.ok) throw new Error('Yahoo API Error');
          
          const data = await response.json();
          const meta = data.chart.result[0].meta;
          const kospiPrice = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose;
          
          // 당일 등락률(%) 계산
          const ratio = ((kospiPrice - prevClose) / prevClose) * 100;

          return res.status(200).json({ kospi: kospiPrice, ratio: ratio });
      } catch (error) {
          return res.status(500).json({ error: 'KR Error' });
      }
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
