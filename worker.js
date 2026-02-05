/**
 * Cloudflare Worker
 * 处理分享数据的存储和检索
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/share - 保存分享数据
    if (request.method === 'POST' && path === '/api/share') {
      try {
        const { key, data } = await request.json();

        if (!key || !data) {
          return new Response(
            JSON.stringify({ error: '缺少必需参数' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // 保存到 KV
        await env.GGBPuppy_SHARES.put(key, JSON.stringify(data));

        return new Response(
          JSON.stringify({ id: key }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('保存失败:', error);
        return new Response(
          JSON.stringify({ error: '保存失败' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // GET /api/share/:id - 获取分享数据
    if (request.method === 'GET' && path.startsWith('/api/share/')) {
      const id = path.split('/api/share/')[1];

      try {
        const value = await env.GGBPuppy_SHARES.get(id);

        if (!value) {
          return new Response(
            JSON.stringify({ error: '未找到分享内容' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const data = JSON.parse(value);

        return new Response(
          JSON.stringify({ id, data }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('获取失败:', error);
        return new Response(
          JSON.stringify({ error: '获取失败' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 404 - 未找到
    return new Response(
      JSON.stringify({ error: '未找到请求的资源' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};
