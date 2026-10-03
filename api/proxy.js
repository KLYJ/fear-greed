export default async function handler(req, res) {
  // 사파리 브라우저의 지독한 에러 캐싱(기억)을 강제로 지우는 마법의 설정
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { target } = req.query;

  try {
    // 1. 미국 증시 (CNN)
    if (target === 'cnn') {
        const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await response.json();
        return res.status(200).json(data);
    }

    // 2. 한국 증시 (클라우드 서버 차단이 없는 '구글 파이낸스'로 최종 우회)
    if (target === 'korea') {
        const url = 'https://www.google.com/finance/quote/VKOSPI:KRX';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        const html = await response.text();
        
        // 구글 파이낸스의 실시간 가격 데이터 추출
        const match = html.match(/data-last-price="([^"]+)"/);
        
        if (match && match[1]) {
            const vkospi = parseFloat(match[1]);
            return res.status(200).json({ vkospi: vkospi, timestamp: Date.now() });
        } else {
            throw new Error('구글 데이터 추출 실패');
        }
    }

    res.status(400).json({ error: '잘못된 타겟' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
