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

    // 2. 한국 증시 (네이버 증권 VKOSPI 직접 추출 방식)
    if (target === 'naver') {
        const url = 'https://finance.naver.com/sise/sise_index.naver?code=VPI200';
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = await response.text();
        
        // 네이버 증권 HTML 구조에서 현재 지수 숫자만 추출해 내는 정규식
        const match = html.match(/id="now_value"[^>]*>([\d\.]+)</);
        if (match && match[1]) {
            const vkospi = parseFloat(match[1]);
            return res.status(200).json({ vkospi: vkospi, timestamp: Date.now() });
        } else {
            throw new Error('네이버 증권 데이터 추출 실패');
        }
    }

    res.status(400).json({ error: '잘못된 타겟입니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
