/**
 * Cloudflare Pages Functions / Worker
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith('/api/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      const shouldFallback = path.startsWith('/share/') || !path.includes('.');
      if (!shouldFallback) {
        return assetResponse;
      }

      const indexUrl = new URL('/index.html', request.url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST' && path === '/api/share') {
      try {
        const { key, data } = await request.json();

        if (!key || !data) {
          return new Response(
            JSON.stringify({ error: 'Missing share payload.' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        await env.GGBPuppy_SHARES.put(key, JSON.stringify(data));

        return new Response(
          JSON.stringify({ id: key }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Share save failed:', error);
        return new Response(
          JSON.stringify({ error: 'Share save failed.', detail: message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    if (request.method === 'GET' && path.startsWith('/api/share/')) {
      const id = path.split('/api/share/')[1];

      try {
        const value = await env.GGBPuppy_SHARES.get(id);

        if (!value) {
          return new Response(
            JSON.stringify({ error: 'Share not found.' }),
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
        const message = error instanceof Error ? error.message : String(error);
        console.error('Share fetch failed:', error);
        return new Response(
          JSON.stringify({ error: 'Share fetch failed.', detail: message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found.' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};
