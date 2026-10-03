export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 미국 증시 (완벽하게 작동 중인 CNN 코드 절대 보존)
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

  // 2. 한국 증시 (절대 뻗지 않는 5중 폴백 시스템 탑재)
  if (target === 'kr') {
      // ① 구글 파이낸스 (차단율 0%에 가까움)
      try {
          const gRes = await fetch('https://www.google.com/finance/quote/VKOSPI:KRX', {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          const html = await gRes.text();
          const match = html.match(/class="YMlKec fxKbKc"[^>]*>([^<]+)</) || html.match(/data-last-price="([^"]+)"/);
          if (match && match[1]) {
              const vkospi = parseFloat(match[1].replace(/,/g, ''));
              if (!isNaN(vkospi)) return res.status(200).json({ vkospi });
          }
      } catch(e) {}

      // ② 야후 파이낸스 (구글 실패 시 즉시 가동)
      try {
          const yRes = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/^VKOSPI', {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          const yData = await yRes.json();
          if (yData.chart.result[0].meta.regularMarketPrice) {
              return res.status(200).json({ vkospi: yData.chart.result[0].meta.regularMarketPrice });
          }
      } catch(e) {}

      // ③ 다음 금융 (야후 실패 시 즉시 가동)
      try {
          const dRes = await fetch('https://finance.daum.net/api/market_index/days?page=1&perPage=1&market=KRX&symbolCode=U391', {
              headers: { 'Referer': 'https://finance.daum.net/domestic/market_index/U391', 'User-Agent': 'Mozilla/5.0' }
          });
          const dData = await dRes.json();
          if (dData.data[0].tradePrice) {
              return res.status(200).json({ vkospi: dData.data[0].tradePrice });
          }
      } catch(e) {}

      // ④ 네이버 증권 (다음 실패 시 즉시 가동)
      try {
          const nRes = await fetch('https://m.stock.naver.com/api/index/VPI200/basic', {
              headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const nData = await nRes.json();
          if (nData.closePrice) {
              return res.status(200).json({ vkospi: parseFloat(String(nData.closePrice).replace(/,/g, '')) });
          }
      } catch(e) {}

      // ⑤ 트레이딩뷰 (최후의 보루)
      try {
          const tvRes = await fetch('https://scanner.tradingview.com/korea/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
              body: JSON.stringify({ "symbols": { "tickers": ["KRX:VKOSPI"] }, "columns": ["close"] })
          });
          const tvData = await tvRes.json();
          if (tvData.data[0].d[0]) return res.status(200).json({ vkospi: tvData.data[0].d[0] });
      } catch(e) {}

      // 5곳이 동시에 전부 서버가 터지지 않는 이상, 무조건 데이터를 리턴함
      return res.status(500).json({ error: 'All KR sources failed' });
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
