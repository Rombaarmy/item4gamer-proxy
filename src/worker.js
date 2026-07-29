export default {
  async fetch(request, env, ctx) {
    const ALLOWED_ORIGIN = "https://TON-SITE.netlify.app"; // à corriger plus tard

    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const API_BASE = "https://item4gamer.com/api";

    const incomingUrl = new URL(request.url);
    const targetUrl = API_BASE + incomingUrl.pathname + incomingUrl.search;

    const headers = new Headers();
    headers.set("api-key", env.ITEM4GAME_API_KEY);
    headers.set("Content-Type", "application/json");

    const init = { method: request.method, headers };
    if (request.method === "POST" || request.method === "PUT") {
      init.body = await request.text();
    }

    try {
      const apiResponse = await fetch(targetUrl, init);
      const responseBody = await apiResponse.text();
      return new Response(responseBody, {
        status: apiResponse.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Erreur proxy Item4Gamer" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};
