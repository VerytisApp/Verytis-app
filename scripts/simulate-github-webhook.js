// Native fetch is used in Node 22

async function simulateWebhook() {
    console.log("🚀 Simulating GitHub PR Merge Webhook...");

    const payload = {
        action: "closed",
        pull_request: {
            number: 123,
            title: "Fix vital security issue",
            merged: true,
            html_url: "https://github.com/verytis/core/pull/123",
            user: {
                login: "tychiqueesteve" // Ensure this matches a profile in DB or test fallback
            },
            changed_files: 5,
            additions: 100,
            deletions: 20
        },
        repository: {
            full_name: "verytis/core"
        }
    };

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/github', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-github-event': 'pull_request'
            },
            body: JSON.stringify(payload)
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
