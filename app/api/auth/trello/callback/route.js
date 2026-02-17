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
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner" id="spinner"></div>
        <h2 id="title">Connecting to Trello...</h2>
        <p id="message">Please wait while we save your connection.</p>
    </div>
    <script>
        (async function() {
            const hash = window.location.hash;
            const token = hash.replace('#token=', '');
            
            if (!token || token === hash) {
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('title').textContent = 'Connection Failed';
                document.getElementById('title').className = 'error';
                document.getElementById('message').textContent = 'No token received from Trello.';
                return;
            }

            try {
                const res = await fetch('/api/auth/trello/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, teamId: '${teamId}' })
                });

                if (res.ok) {
                    document.getElementById('spinner').style.display = 'none';
                    document.getElementById('title').textContent = 'Connected!';
                    document.getElementById('title').className = 'success';
                    document.getElementById('message').textContent = 'Trello is now linked. This window will close.';
                    
                    if (window.opener) {
                        window.opener.postMessage({ type: 'TRELLO_CONNECTED' }, '*');
                        setTimeout(() => window.close(), 1500);
                    }
                } else {
                    throw new Error('Save failed');
                }
            } catch (err) {
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
