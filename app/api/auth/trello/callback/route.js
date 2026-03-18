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
    
    // RÉCUPÉRATION DE L'ÉTAT DEPUIS LE COOKIE (SOURCE DE VÉRITÉ PRIMAIRE)
    const stateCookie = req.cookies.get('trello_auth_state')?.value;
    let state = {};
    if (stateCookie) {
        try {
            state = JSON.parse(stateCookie);
            console.log('[TRELLO CALLBACK] State recovered from cookie:', state);
        } catch (e) {
            console.error('[TRELLO CALLBACK] Error parsing state cookie:', e);
        }
    }

    // Extraction avec priorité au cookie (style Slack/GitHub)
    const userId = state.userId || searchParams.get('userId') || '';
    const type = state.type || searchParams.get('type') || 'integration';
    const organizationId = state.organizationId || searchParams.get('organizationId') || '';

    if (!userId) {
        console.warn('[TRELLO CALLBACK] userId missing from cookie and params');
    }
    const apiKey = process.env.TRELLO_API_KEY;

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
            text-align: center; padding: 2.5rem;
            background: white; border-radius: 24px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
            max-width: 440px; width: 90%;
        }
        .spinner {
            width: 40px; height: 40px; margin: 0 auto 20px;
            border: 3px solid #f1f5f9; border-top-color: #0079BF;
            border-radius: 50%; animation: spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h2 { color: #0f172a; font-size: 18px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.025em; }
        p { color: #64748b; font-size: 14px; margin: 0 0 24px; line-height: 1.5; }
        
        .selection-zone { display: none; text-align: left; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
        label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        
        select {
            width: 100%; padding: 12px; border-radius: 12px;
            border: 2px solid #f1f5f9; background: #f8fafc;
            color: #1e293b; font-size: 14px; font-weight: 600;
            outline: none; transition: all 0.2s; cursor: pointer;
            appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 12px center; background-size: 16px;
        }
        select:focus { border-color: #0079BF; background: white; box-shadow: 0 0 0 4px rgba(0, 121, 191, 0.1); }
        
        .btn {
            width: 100%; margin-top: 20px; padding: 14px;
            background: #0079BF; color: white; border: none;
            border-radius: 14px; font-size: 13px; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.05em;
            cursor: pointer; transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(0, 121, 191, 0.2);
        }
        .btn:hover { background: #005a8c; transform: translateY(-1px); box-shadow: 0 6px 15px rgba(0, 121, 191, 0.3); }
        .btn:active { transform: translateY(0); }
        .btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }

        .success { color: #059669 !important; }
        .error { color: #dc2626 !important; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner" id="spinner"></div>
        <h2 id="title">Connecting to Trello...</h2>
        <p id="message">Please wait while we prepare your connection.</p>
        
        <div id="selectionZone" class="selection-zone">
            <label for="orgSelect">Trello Workspace</label>
            <select id="orgSelect"></select>
            <button id="confirmBtn" class="btn">Confirm Selection</button>
        </div>
    </div>
    <script>
        (async function() {
            const hash = window.location.hash;

            let token = '';
            if (hash && hash.includes('token=')) {
                token = hash.split('token=')[1];
                if (token.includes('&')) token = token.split('&')[0];
            }

            if (!token) {
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('title').textContent = 'Connection Failed';
                document.getElementById('title').className = 'error';
                document.getElementById('message').textContent = 'No token received from Trello.';
                return;
            }

            // Function to save the connection directly (v16.1)
            try {
                const res = await fetch('/api/auth/trello/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        token: token, 
                        userId: '${userId}',
                        type: '${type}',
                        organizationId: '${organizationId}'
                    })
                });

                const result = await res.json();

                if (res.ok) {
                    document.getElementById('spinner').style.display = 'none';
                    document.getElementById('title').textContent = 'Connected!';
                    document.getElementById('title').className = 'success';
                    document.getElementById('message').textContent = 'Trello linked successfully.';
                    
                    if (window.opener) {
                        window.opener.postMessage({ 
                            type: 'TRELLO_LINKED',
                            user: { username: result.username || 'Trello User' }
                        }, '*');
                        setTimeout(function() { window.close(); }, 1500);
                    }
                } else {
                    throw new Error(result.error || 'Save failed');
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

    const finalResponse = new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
    });
    finalResponse.cookies.delete('trello_auth_state');
    return finalResponse;
}
