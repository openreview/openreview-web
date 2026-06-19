// Guest-scraping challenge page, served from the FRONTEND origin so that the
// clearance cookie set by POST {API}/challenge/verify is stored under the
// frontend's top-level browsing context. Serving it from the API origin caused
// Firefox Private Browsing (strict cookie partitioning) to strand the cookie in
// the API-host partition, producing an endless re-challenge loop.

export const dynamic = 'force-dynamic'

const apiBase = process.env.API_V2_URL || ''
let apiOrigin = ''
try {
  apiOrigin = new URL(apiBase).origin
} catch {
  apiOrigin = ''
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  `connect-src 'self' ${apiOrigin}`.trim(),
  "img-src 'self' data:",
].join('; ')

// Only allow returning to a same-origin (frontend) path or the API origin
// (e.g. a gated PDF the user navigated to directly). Anything else → home.
function safeRedirect(raw, frontendOrigin) {
  if (!raw) return '/'
  try {
    const url = new URL(raw, frontendOrigin)
    if (url.origin === frontendOrigin) return url.pathname + url.search + url.hash
    if (apiOrigin && url.origin === apiOrigin) return url.href
  } catch (_) {
    // fall through
  }
  return '/'
}

const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="true" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Noto+Sans:400,400i,700,700i&display=swap&subset=latin-ext" />
  <title>Verifying your browser | OpenReview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; background: #fffdfa; color: #2c3a4a; min-height: 100vh; display: flex; flex-direction: column; }
    .navbar { background-color: #8c1b13; padding: 12px 0; }
    .navbar-inner { max-width: 960px; margin: 0 auto; padding: 0 15px; }
    .navbar-brand { color: #fff; font-size: 18px; text-decoration: none; }
    .navbar-brand strong { font-weight: 700; }
    .main { flex: 1; display: flex; justify-content: center; align-items: center; padding: 40px 15px; }
    .card { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 36px 40px; max-width: 420px; width: 100%; text-align: center; }
    .card h1 { font-size: 22px; font-weight: 700; color: #2c3a4a; margin-bottom: 6px; }
    .card h2 { font-size: 15px; font-weight: 400; color: #777; margin-bottom: 24px; }
    .widget { display: flex; justify-content: center; min-height: 65px; margin-bottom: 16px; }
    .status { font-size: 14px; color: #555; line-height: 1.5; }
    .status.error { color: #8c1b13; }
    .status.success { color: #388e3c; }
    .footer { text-align: center; padding: 16px 15px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .footer a { color: #4d8093; text-decoration: none; }
    .footer a:hover { color: #3f6978; text-decoration: underline; }
  </style>
</head>
<body>
  <nav class="navbar"><div class="navbar-inner"><a class="navbar-brand" href="/"><strong>OpenReview</strong>.net</a></div></nav>
  <div class="main">
    <div class="card">
      <h1>Verifying your browser</h1>
      <h2>Complete the check below to continue to OpenReview</h2>
      <div class="widget"><div class="cf-turnstile" data-sitekey="{{SITE_KEY}}" data-callback="onSolve" data-error-callback="onError"></div></div>
      <p id="status" class="status">Please complete the verification above.</p>
    </div>
  </div>
  <footer class="footer"><a href="/">OpenReview</a> &mdash; Open Peer Review. Open Publishing. Open Access.</footer>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <script>
    (function () {
      var statusEl = document.getElementById('status');
      var apiBase = {{API_BASE}};
      var redirectTarget = {{REDIRECT}};
      function showError(msg) { statusEl.className = 'status error'; statusEl.textContent = msg; }
      window.onError = function () { showError('Verification failed to load. Please refresh the page and try again.'); };
      window.onSolve = function (token) {
        statusEl.className = 'status';
        statusEl.textContent = 'Verifying...';
        fetch(apiBase + '/challenge/verify', { method: 'POST', credentials: 'include', headers: { 'cf-turnstile-token': token } })
          .then(function (res) {
            if (!res.ok) { throw new Error('Verification failed'); }
            statusEl.className = 'status success';
            statusEl.textContent = 'Verified. Redirecting...';
            window.location = redirectTarget;
          })
          .catch(function () {
            showError('Verification failed. Please try again.');
            // The solved token is single-use and now spent; reset the widget so
            // the user gets a fresh token to retry (handles transient failures).
            if (window.turnstile && typeof window.turnstile.reset === 'function') { window.turnstile.reset(); }
          });
      };
    })();
  </script>
</body>
</html>`

export async function GET(request) {
  const url = new URL(request.url)
  const redirect = safeRedirect(url.searchParams.get('redirect'), url.origin)
  const siteKey = process.env.TURNSTILE_SITEKEY || ''

  // Substitute via replacement functions so "$" in values isn't interpreted by
  // String.replace, and JSON-encode the JS values to prevent script breakout.
  const html = TEMPLATE.replace(/\{\{SITE_KEY\}\}/g, () => siteKey)
    .replace(/\{\{API_BASE\}\}/g, () => JSON.stringify(apiBase))
    .replace(/\{\{REDIRECT\}\}/g, () => JSON.stringify(redirect).replace(/</g, '\\u003c'))

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': CSP },
  })
}
