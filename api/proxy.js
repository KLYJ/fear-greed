export default async function handler(req, res) {
  // 에러 기억(캐시) 완벽 삭제 및 외부 통신 허용 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 미국 증시 (CNN) - 현재 완벽하게 작동 중인 코드 (절대 건드리지 않음)
  if (target === 'cnn') {
      try {
          const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
          let data;
          try {
              const res1 = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
              if (!res1.ok) throw new Error();
              data = await res1.json();
          } catch (e) {
              const res2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
              const data2 = await res2.json();
              data = JSON.parse(data2.contents);
          }
          return res.status(200).json(data);
      } catch(error) {
          return res.status(500).json({ error: 'CNN Error' });
      }
  }

  // 2. 한국 증시 (VKOSPI) - 브라우저 보안을 피하기 위해 서버 단에서 3중으로 찌르는 무적망
  if (target === 'kr') {
      // 1순위: 네이버 증권 시도
      try {
          const nRes = await fetch('https://m.stock.naver.com/api/index/VPI200/basic', {
              headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const nData = await nRes.json();
          if (nData && nData.closePrice) {
              return res.status(200).json({ vkospi: parseFloat(String(nData.closePrice).replace(/,/g, '')) });
          }
      } catch (e) {}

      // 2순위: 네이버 실패 시, 야후 파이낸스 시도
      try {
          const yRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^VKOSPI', {
              headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const yData = await yRes.json();
          if (yData.chart && yData.chart.result && yData.chart.result[0]) {
              return res.status(200).json({ vkospi: yData.chart.result[0].meta.regularMarketPrice });
          }
      } catch (e) {}

      // 3순위: 야후마저 실패 시, 트레이딩뷰 강제 파싱 (최후의 보루)
      try {
          const tvRes = await fetch('https://scanner.tradingview.com/korea/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
              body: JSON.stringify({ "symbols": { "tickers": ["KRX:VKOSPI"] }, "columns": ["close"] })
          });
          const tvData = await tvRes.json();
          if (tvData.data && tvData.data.length > 0) {
              return res.status(200).json({ vkospi: tvData.data[0].d[0] });
          }
      } catch (e) {}

      return res.status(500).json({ error: '모든 한국 서버 통신 실패' });
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
