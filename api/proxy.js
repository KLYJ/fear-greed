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

    // 2. 한국 증시 (네이버 모바일 숨겨진 실시간 API 활용 - 매우 안정적)
    if (target === 'naver') {
        const url = 'https://polling.finance.naver.com/api/realtime/domestic/index/VPI200';
        const response = await fetch(url);
        const data = await response.json();
        
        // API에서 깔끔하게 숫자만 바로 뽑아옵니다.
        if (data && data.datas && data.datas.length > 0) {
            const vkospi = parseFloat(data.datas[0].closePrice.replace(/,/g, ''));
            return res.status(200).json({ vkospi: vkospi, timestamp: Date.now() });
        } else {
            throw new Error('네이버 API 응답 오류');
        }
    }

    res.status(400).json({ error: '잘못된 타겟입니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
