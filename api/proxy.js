export default async function handler(req, res) {
  const { target } = req.query;

  try {
    if (target === 'cnn') {
        const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const data = await response.json();
        return res.status(200).json(data);
    }

    if (target === 'yahoo') {
        // 더 안정적인 야후 파이낸스 Quote API로 경로 변경
        const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=^VKOSPI';
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const data = await response.json();
        return res.status(200).json(data);
    }

    res.status(400).json({ error: '잘못된 타겟입니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

