export default async function handler(req, res) {
  // 캐시 강제 삭제
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 미국 증시 (유진 님이 "잘 된다"고 하셨던 완벽한 원본 코드로 100% 복구)
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

  // 2. 한국 증시 (방어벽을 무사통과하는 마법의 'Origin/Referer' 위장 헤더 추가)
  if (target === 'kr') {
      // 1순위: 트레이딩뷰 (Origin 헤더를 넣어야 AWS 클라우드 서버 접근을 차단하지 않음)
      try {
          const tvRes = await fetch('https://scanner.tradingview.com/korea/scan', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                  'Origin': 'https://kr.tradingview.com',
                  'Referer': 'https://kr.tradingview.com/'
              },
              body: JSON.stringify({ "symbols": { "tickers": ["KRX:VKOSPI"] }, "columns": ["close"] })
          });
          const tvData = await tvRes.json();
          if (tvData.data && tvData.data.length > 0) {
              return res.status(200).json({ vkospi: tvData.data[0].d[0] });
          }
      } catch (e) {}

      // 2순위: 네이버 증권 (Referer 헤더를 넣어야 봇으로 차단하지 않음)
      try {
          const nRes = await fetch('https://m.stock.naver.com/api/index/VPI200/basic', {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                  'Referer': 'https://m.stock.naver.com/'
              }
          });
          const nData = await nRes.json();
          if (nData.closePrice) {
              return res.status(200).json({ vkospi: parseFloat(String(nData.closePrice).replace(/,/g, '')) });
          }
      } catch (e) {}

      return res.status(500).json({ error: 'KR Error' });
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
