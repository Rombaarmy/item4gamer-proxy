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

    const incomingUrl = new URL(request.url);

    // Page de test intégrée, servie directement par ce Worker (https, pas de blocage réseau)
    if (incomingUrl.pathname === "/test" && request.method === "GET") {
      return new Response(TEST_PAGE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const API_BASE = "https://item4gamer.com/wp-json/reseller/v1";
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

const TEST_PAGE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test commande Item4Gamer</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,sans-serif}
  body{background:#f0f2f5;color:#1a1a2e;padding:16px;max-width:480px;margin:0 auto}
  h1{font-size:18px;font-weight:800;margin-bottom:4px}
  .sub{font-size:12px;color:#888;margin-bottom:16px}
  .warn{background:#fff8e1;border:1.5px solid #ffe082;color:#a06a00;font-size:12px;font-weight:600;padding:10px 12px;border-radius:10px;margin-bottom:16px;line-height:1.4}
  label{display:block;font-size:11px;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:.3px;margin-bottom:6px;margin-top:14px}
  input{width:100%;border:1.5px solid #e0e0e0;border-radius:10px;padding:12px 14px;font-size:15px;outline:none}
  input:focus{border-color:#ffb300}
  button{width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#ffd54f,#ffb300);color:#fff;font-size:15px;font-weight:800;margin-top:18px;cursor:pointer}
  button:disabled{opacity:.6}
  pre{white-space:pre-wrap;word-break:break-word;background:#1a1a2e;color:#8ef58e;font-size:12px;padding:14px;border-radius:12px;margin-top:16px;max-height:300px;overflow:auto}
  .status{font-size:12px;font-weight:700;margin-top:10px}
</style>
</head>
<body>
  <h1>🧪 Test commande réelle</h1>
  <div class="sub">Servi directement par le Worker item4gamer-proxy</div>
  <div class="warn">⚠️ Ceci envoie une VRAIE commande chez Item4Gamer et débite ton wallet réel.</div>
  <label for="vid">Variation ID (pack)</label>
  <input id="vid" value="35430">
  <label for="sid">Save ID (Player ID PUBG)</label>
  <input id="sid" value="">
  <button id="btn" onclick="sendOrder()">Envoyer la commande test</button>
  <div class="status" id="status"></div>
  <pre id="result" style="display:none"></pre>
<script>
async function sendOrder(){
  var vid = document.getElementById('vid').value.trim();
  var sid = document.getElementById('sid').value.trim();
  var statusEl = document.getElementById('status');
  var resultEl = document.getElementById('result');
  var btn = document.getElementById('btn');
  if(!vid || !sid){ statusEl.textContent = '⚠️ Remplis les deux champs.'; statusEl.style.color = '#e74c3c'; return; }
  btn.disabled = true; btn.textContent = 'Envoi en cours...'; statusEl.textContent=''; resultEl.style.display='none';
  try{
    var res = await fetch('/order/add-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variation_id: vid, save_id: sid })
    });
    var text = await res.text();
    var pretty = text;
    try{ pretty = JSON.stringify(JSON.parse(text), null, 2); }catch(e){}
    statusEl.textContent = res.ok ? ('✅ Réponse reçue (statut ' + res.status + ')') : ('❌ Erreur (statut ' + res.status + ')');
    statusEl.style.color = res.ok ? '#27ae60' : '#e74c3c';
    resultEl.textContent = pretty; resultEl.style.display = 'block';
  }catch(e){
    statusEl.textContent = '❌ Erreur réseau : ' + e.message; statusEl.style.color = '#e74c3c';
  }finally{
    btn.disabled = false; btn.textContent = 'Envoyer la commande test';
  }
}
</script>
</body>
</html>`;
