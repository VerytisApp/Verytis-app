
import crypto from 'crypto';

/**
 * Simulation of a Streamlabs Webhook Event
 * To verify the newly created route: app/api/webhooks/streamlabs/route.js
 */
async function simulateStreamlabsWebhook() {
    console.log("🚀 Simulating Streamlabs 'manual_clip_created' Webhook...");

    const eventId = `evt_${crypto.randomUUID().slice(0, 8)}`;
    
    // This ID should ideally match a 'streamlabs_id' in a 'user_connections' record's metadata
    // For local testing, the route will return 'no_matching_connection' if no record exists.
    const mockStreamlabsId = "12345678"; 

    const payload = {
        id: eventId,
        type: "manual_clip_created",
        streamlabs_id: mockStreamlabsId,
        data: {
            clip_id: "clip_999",
            url: "https://streamlabs.com/clips/clip_999",
            created_at: new Date().toISOString(),
            creator: "tychiqueesteve"
        }
    };

    const payloadString = JSON.stringify(payload);

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/streamlabs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-streamlabs-webhook-id': eventId
            },
            body: payloadString
        });

        const data = await response.json();
        console.log("📡 Response Status:", response.status);
        console.log("📦 Response Data:", JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log("✅ Webhook route is reachable and processed the JSON correctly.");
            if (data.status === 'no_matching_connection') {
                console.log("ℹ️ Identity check worked: No connection found for mock ID (Expected in clean env).");
            } else if (data.triggered_count > 0) {
                console.log(`🎉 SUCCESS: ${data.triggered_count} agents were triggered!`);
            }
        } else {
            console.log("❌ FAILED: Webhook route returned an error.");
        }

    } catch (error) {
        console.error("❌ Error simulating webhook:", error.message);
        if (error.message.includes('fetch failed')) {
            console.error("💡 Tip: Ensure the local server is running at http://localhost:3000");
        }
    }
}

simulateStreamlabsWebhook();
