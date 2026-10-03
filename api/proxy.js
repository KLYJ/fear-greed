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

    // 2. 한국 증시 (네이버 이중 보안 완벽 우회)
    if (target === 'naver') {
        const url = 'https://polling.finance.naver.com/api/realtime/domestic/index/VPI200';
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                // 핵심: 네이버 증권 웹사이트에서 직접 요청한 것처럼 출처를 위장
                'Referer': 'https://finance.naver.com/' 
            }
        });
        
        if (!response.ok) {
            throw new Error(`네이버 서버 차단: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.datas && data.datas.length > 0) {
            // 숫자 형식에 쉼표가 있을 경우를 대비해 안전하게 변환
            const closePrice = String(data.datas[0].closePrice).replace(/,/g, '');
            return res.status(200).json({ vkospi: parseFloat(closePrice), timestamp: Date.now() });
        } else {
            throw new Error('데이터 형식 불일치');
        }
    }

    res.status(400).json({ error: '잘못된 타겟입니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
