import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/trello/callback?teamId=<uuid>
 * 
 * Trello returns the token in the URL fragment (#token=...).
 * Since fragments aren't sent to the server, this page uses client-side JS
 * to extract the token and POST it to /api/auth/trello/save.
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId') || '';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Connecting Trello...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex; align-items: center; justify-content: center;
            height: 100vh; margin: 0; background: #f8fafc;
        }
        .container {
            text-align: center; padding: 2rem;
            background: white; border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
            max-width: 400px;
        }
        .spinner {
            width: 32px; height: 32px; margin: 0 auto 16px;
            border: 3px solid #e2e8f0; border-top-color: #0079BF;
            border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h2 { color: #1e293b; font-size: 16px; margin: 0 0 8px; }
        p { color: #64748b; font-size: 13px; margin: 0; }
        .success { color: #059669; }
        .error { color: #dc2626; }
        .debug { font-size: 11px; color: #94a3b8; margin-top: 16px; text-align: left; word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner" id="spinner"></div>
        <h2 id="title">Connecting to Trello...</h2>
        <p id="message">Please wait while we save your connection.</p>
        <div class="debug" id="debug" style="display:none;"></div>
    </div>
    <script>
        (async function() {
            const debugEl = document.getElementById('debug');
            function log(msg) {
                console.log('[Trello Callback]', msg);
                debugEl.style.display = 'block';
                debugEl.innerHTML += msg + '<br>';
            }

            // Extract token from URL fragment
            const fullUrl = window.location.href;
            const hash = window.location.hash;
            log('URL: ' + fullUrl);
            log('Hash: ' + (hash || '(empty)'));
            
            // Trello returns #token=VALUE
            let token = '';
            if (hash && hash.includes('token=')) {
                token = hash.split('token=')[1];
                // Remove any trailing params
                if (token.includes('&')) token = token.split('&')[0];
            }
            
            log('Token: ' + (token ? token.substring(0, 12) + '...' : '(none)'));
            
            if (!token) {
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('title').textContent = 'Connection Failed';
                document.getElementById('title').className = 'error';
                document.getElementById('message').textContent = 'No token received from Trello. Check the debug info below.';
                return;
            }

            try {
                log('Saving token...');
                const res = await fetch('/api/auth/trello/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token, teamId: '${teamId}' })
                });

                const result = await res.json();
                log('Response: ' + JSON.stringify(result));

                if (res.ok) {
                    document.getElementById('spinner').style.display = 'none';
                    document.getElementById('title').textContent = 'Connected!';
                    document.getElementById('title').className = 'success';
                    document.getElementById('message').textContent = 'Trello linked as ' + (result.username || 'user') + '. This window will close.';
                    debugEl.style.display = 'none';
                    
                    if (window.opener) {
                        window.opener.postMessage({ type: 'TRELLO_CONNECTED' }, '*');
                        setTimeout(function() { window.close(); }, 1500);
                    }
                } else {
                    throw new Error(result.error || 'Save returned status ' + res.status);
                }
            } catch (err) {
                log('Error: ' + err.message);
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('title').textContent = 'Connection Error';
                document.getElementById('title').className = 'error';
                document.getElementById('message').textContent = err.message;
            }
        })();
    </script>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}
