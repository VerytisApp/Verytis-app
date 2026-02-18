import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Trello returns the token in the URL fragment, so we need to handle it client-side
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Connecting Trello...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0079BF 0%, #026AA7 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #0079BF;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h2 {
            color: #333;
            margin: 0 0 10px;
            font-size: 20px;
        }
        p {
            color: #666;
            margin: 0;
            font-size: 14px;
        }
        .success {
            color: #0079BF;
        }
        .error {
            color: #c9372c;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="spinner" class="spinner"></div>
        <h2 id="title">Connecting Trello...</h2>
        <p id="message">Please wait while we link your account.</p>
    </div>

    <script>
        (async function() {
            try {
                // Extract token from URL fragment
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const token = params.get('token');

                if (!token) {
                    throw new Error('No token received from Trello');
                }

                // Fetch Trello member info
                const API_KEY = '${process.env.TRELLO_API_KEY}';
                const memberRes = await fetch(\`https://api.trello.com/1/members/me?key=\${API_KEY}&token=\${token}&fields=id,username,fullName,email\`);
                const member = await memberRes.json();

                if (!member.id) {
                    throw new Error('Failed to fetch Trello member info');
                }

                console.log('Trello member data:', member);

                // Save to user's social_profiles
                console.log('Calling save-member API...');
                const saveRes = await fetch('/api/auth/trello/save-member', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: '${userId}',
                        token: token,
                        member: member
                    })
                });

                console.log('Save response status:', saveRes.status);
                const result = await saveRes.json();
                console.log('Save result:', result);

                if (result.success) {
                    document.getElementById('spinner').style.display = 'none';
                    document.getElementById('title').textContent = '✓ Trello Connected!';
                    document.getElementById('title').className = 'success';
                    document.getElementById('message').textContent = 'Trello linked. This window will close.';
                    
                    if (window.opener) {
                        window.opener.postMessage({ 
                            type: 'TRELLO_LINKED',
                            user: { username: member.username || 'Trello User' }
                        }, '*');
                        setTimeout(function() { window.close(); }, 1500);
                    }
                } else {
                    throw new Error(result.error || 'Save failed');
                }
            } catch (err) {
                console.error('Trello connection error:', err);
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
