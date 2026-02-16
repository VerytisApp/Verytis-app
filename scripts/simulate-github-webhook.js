import crypto from 'crypto';

async function simulateWebhook() {
    console.log("🚀 Simulating GitHub PR Merge Webhook...");

    const secret = 'SGesteve69'; // Hardcoded for simulation or process.env.GITHUB_WEBHOOK_SECRET

    const payload = {
        action: "closed",
        pull_request: {
            number: 124,
            title: "Fix: Auth flow race condition",
            merged: true,
            html_url: "https://github.com/verytis/core/pull/124",
            user: {
                login: "tychiqueesteve"
            },
            changed_files: 3,
            additions: 45,
            deletions: 12
        },
        repository: {
            full_name: "verytis/core"
        }
    };

    const payloadString = JSON.stringify(payload);

    // Compute Signature
    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(payloadString).digest('hex');

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/github', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-github-event': 'pull_request',
                'x-hub-signature-256': signature
            },
            body: payloadString
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", data);

        if (data.status === 'logged') {
            console.log("✅ SUCCESS: Webhook processed and logged.");
            if (data.identified) {
                console.log("👤 User was IDENTIFIED.");
            } else {
                console.log("🕵️‍♀️ User was ANONYMOUS (Expected if no social profile set).");
            }
        } else {
            console.log("❌ FAILED: Unexpected status.");
        }

    } catch (error) {
        console.error("Error simulating webhook:", error);
    }
}

simulateWebhook();
