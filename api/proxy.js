export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { target } = req.query;

  // 1. 미국 증시 (완벽하게 작동 중인 원본 CNN 코드 유지)
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

  // 2. 한국 증시 (차단 없는 네이버 코스피 실시간 시세 기반 자체 공포탐욕 지수 산출)
  if (target === 'kr') {
      try {
          // 차단 없는 네이버 모바일 코스피 시세 API
          const res = await fetch('https://m.stock.naver.com/api/index/KOSPI/basic', {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          const data = await res.json();
          
          if (data && data.closePrice && data.fluctuationsRatio) {
              // 코스피 현재 지수와 당일 등락률(%) 추출
              const kospiPrice = parseFloat(String(data.closePrice).replace(/,/g, ''));
              const ratio = parseFloat(data.fluctuationsRatio); // 예: +1.5% 또는 -2.0%
              
              // 코스피 등락률(-3% ~ +3%)을 0~100점 공포탐욕 점수로 변환
              // 폭락(-3% 이하)하면 공포(0점), 폭등(+3% 이상)하면 탐욕(100점), 보합(0%)이면 중립(50점)
              let score = Math.round(50 + (ratio * 15));
              if (score > 100) score = 100;
              if (score < 0) score = 0;

              // 프론트엔드 호환을 위해 기존 vkospi 자리에 가상의 점수 환산값을 전달
              return res.status(200).json({ vkospi: 50 + (50 - score / 2), realKospi: kospiPrice, ratio: ratio });
          }
          throw new Error('코스피 데이터 파싱 실패');
      } catch (error) {
          return res.status(500).json({ error: 'KR Error' });
      }
  }

  return res.status(400).json({ error: '잘못된 타겟' });
}
