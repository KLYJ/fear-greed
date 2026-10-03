export default async function handler(req, res) {
  // 사파리의 지독한 에러 화면 기억(캐시) 강제 삭제 기능
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { target } = req.query;

  try {
    // 1. 미국 증시 (CNN) - 에러 시 우회 서버 자동 전환 기능 탑재
    if (target === 'cnn') {
        const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
        try {
            // 기본 호출
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!response.ok) throw new Error();
            return res.status(200).json(await response.json());
        } catch (e) {
            // Vercel IP가 차단당하면 글로벌 무료 프록시(CodeTabs)를 통해 강제 우회 호출
            const fallback = await fetch('https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url));
            return res.status(200).json(await fallback.json());
        }
    }

    // 2. 한국 증시 (블랙리스트 차단이 없는 TradingView + Naver 이중 설계)
    if (target === 'korea') {
        try {
            // 1순위: 전 세계에 열려있어 차단 확률 0%인 '트레이딩뷰' VKOSPI 공식 스캐너
            const tvUrl = 'https://scanner.tradingview.com/korea/scan';
            const response = await fetch(tvUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "symbols": { "tickers": ["KRX:VKOSPI"] }, "columns": ["close"] })
            });
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return res.status(200).json({ vkospi: data.data[0].d[0], timestamp: Date.now() });
            }
            throw new Error('트레이딩뷰 파싱 실패');
        } catch (e1) {
            // 2순위: 혹시라도 실패하면 네이버 모바일 증권을 글로벌 프록시로 우회해서 호출 (최후의 보루)
            const naverUrl = 'https://m.stock.naver.com/api/index/VPI200/basic';
            const pRes = await fetch('https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(naverUrl));
            const pData = await pRes.json();
            return res.status(200).json({ vkospi: parseFloat(String(pData.closePrice).replace(/,/g, '')), timestamp: Date.now() });
        }
    }

    res.status(400).json({ error: '잘못된 타겟' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
