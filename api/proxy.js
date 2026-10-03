export default async function handler(req, res) {
  // 사파리의 에러 기억(캐시)을 강제로 지우는 설정
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { target } = req.query;

  // 핵심: 일반 PC 크롬 브라우저와 100% 동일한 '풀버전' 신분증 (봇 차단 완벽 회피)
  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  try {
    // 1. 미국 증시 (CNN)
    if (target === 'cnn') {
        const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('CNN 차단됨');
        const data = await response.json();
        return res.status(200).json(data);
    }

    // 2. 한국 증시 (구글 파이낸스)
    if (target === 'korea') {
        const url = 'https://www.google.com/finance/quote/VKOSPI:KRX';
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('구글 차단됨');
        
        const html = await response.text();
        // 구글 웹페이지에서 실시간 가격 숫자만 쏙 빼내는 정규식
        const match = html.match(/data-last-price="([^"]+)"/);
        
        if (match && match[1]) {
            const vkospi = parseFloat(match[1]);
            return res.status(200).json({ vkospi: vkospi, timestamp: Date.now() });
        } else {
            throw new Error('데이터 파싱 실패');
        }
    }

    res.status(400).json({ error: '잘못된 타겟' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
