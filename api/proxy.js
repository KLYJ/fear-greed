// 핵심: Vercel의 일반 데이터센터 서버(Node.js)를 버리고, 차단되지 않는 글로벌 Edge 네트워크로 전환
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get('target');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  try {
    // 1. 미국 증시 (잘 작동하던 CNN 코드를 Edge 환경에 맞춰 업그레이드)
    if (target === 'cnn') {
        const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', { headers });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
        });
    }

    // 2. 한국 증시 (차단벽이 뚫린 Edge 네트워크에서 가장 안정적인 야후 API 직결)
    if (target === 'kr') {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^VKOSPI', { headers });
        const data = await res.json();
        const vkospi = data.chart.result[0].meta.regularMarketPrice;
        return new Response(JSON.stringify({ vkospi }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
        });
    }

    return new Response(JSON.stringify({ error: '잘못된 타겟' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
