export default async function handler(req, res) {
  // 사파리의 에러 화면 기억(캐시) 강제 삭제
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1차 직접 호출 시도 후, 막히면 2차 강제 우회 호출을 쏘는 핵심 생존 함수
  async function fetchSafeData(url) {
      try {
          // 1차 시도: Vercel 서버에서 직접 정상 호출 (빠름)
          const res1 = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
          if (res1.ok) return await res1.json();
          throw new Error('직접 호출 차단됨');
      } catch (e) {
          // 2차 시도: 차단 시, 응답을 JSON으로 감싸서 무조건 뚫어내는 특수 우회 프록시(AllOrigins) 작동
          const res2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
          const data2 = await res2.json();
          return JSON.parse(data2.contents);
      }
  }

  try {
    // 1. 미국 증시 (CNN)
    if (target === 'cnn') {
        const data = await fetchSafeData('https://production.dataviz.cnn.io/index/fearandgreed/graphdata');
        return res.status(200).json(data);
    }

    // 2. 한국 증시 (가장 데이터가 안정적인 야후 파이낸스 차트 API 복구)
    if (target === 'korea') {
        const data = await fetchSafeData('https://query1.finance.yahoo.com/v8/finance/chart/^VKOSPI');
        const vkospi = data.chart.result[0].meta.regularMarketPrice;
        return res.status(200).json({ vkospi: vkospi, timestamp: Date.now() });
    }

    res.status(400).json({ error: '잘못된 타겟입니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
