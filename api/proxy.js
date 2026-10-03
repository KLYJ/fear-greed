export default async function handler(req, res) {
  const { target } = req.query;

  try {
    // 1. 미국 증시 (CNN)
    if (target === 'cnn') {
        const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const data = await response.json();
        return res.status(200).json(data);
    }

    // 2. 한국 증시 (네이버 모바일 앱 전용 API + 이중 우회 시스템 적용)
    if (target === 'naver') {
        const url = 'https://m.stock.naver.com/api/index/VPI200/basic';
        
        // 시도 1: 아이폰 사파리 브라우저인 것처럼 위장하여 모바일 API 직접 호출
        let response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15' }
        });
        
        // 시도 2: 만약 Vercel 서버 IP가 튕겼다면, 무료 외부 프록시를 한 번 더 거쳐서 강제 호출
        if (!response.ok) {
            const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            response = await fetch(fallbackUrl);
        }
        
        const data = await response.json();
        
        // 복잡한 HTML 없이 깔끔하게 떨어지는 숫자 데이터(closePrice)만 바로 추출
        if (data && data.closePrice) {
            const vkospi = parseFloat(String(data.closePrice).replace(/,/g, ''));
            return res.status(200).json({ vkospi: vkospi, timestamp: Date.now() });
        } else {
            throw new Error('데이터 파싱 실패');
        }
    }

    res.status(400).json({ error: '잘못된 타겟입니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
