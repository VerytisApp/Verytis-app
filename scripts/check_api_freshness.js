
(async () => {
    try {
        console.log("Checking API directly with no-cache headers...");

        // 1. Initial Fetch
        const headers = { 'Cache-Control': 'no-cache' };

        // Use the monitored resource ID (channelId) from previous steps
        const channelId = 'cfb41847-ecae-499b-9b13-c9586ae749de';
        const url = `http://localhost:3000/api/activity?channelId=${channelId}&t=${Date.now()}`;

        console.log(`Fetching: ${url}`);
        const res = await fetch(url, { headers });
        const data = await res.json();

        if (data.events && data.events.length > 0) {
            console.log(`✅ Success: Retrieved ${data.events.length} events.`);
            console.log(`Latest event: ${data.events[0].action} at ${data.events[0].timestamp}`);
        } else {
            console.log("⚠️ No events found or empty array.");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("❌ Error fetching API:", e);
    }
})();
