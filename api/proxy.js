export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 미국 증시 (완벽하게 잘 작동하는 원본 CNN 코드 유지)
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

  // 2. 한국 증시 (차단벽이 전혀 없는 인베스팅닷컴 실시간 위젯 데이터 활용)
  if (target === 'kr') {
      try {
          // 인베스팅닷컴의 VKOSPI 실시간 위젯 전용 데이터 주소 (ID: 44341 = VKOSPI)
          const widgetUrl = 'https://tvc.investing.com/iframe/data/history?symbol=44341&resolution=D&from=1700000000&to=9999999999';
          const response = await fetch(widgetUrl, {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                  'Referer': 'https://www.investing.com/'
              }
          });
          const data = await response.json();
          
          if (data && data.c && data.c.length > 0) {
              // 가장 최신 종가(마지막 배열 값)를 가져옴
              const vkospi = data.c[data.c.length - 1];
              return res.status(200).json({ vkospi: parseFloat(vkospi) });
          }
          throw new Error('데이터 파싱 실패');
      } catch (error) {
          return res.status(500).json({ error: 'KR Error' });
      }
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
