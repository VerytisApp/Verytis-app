import { createClient } from '@supabase/supabase-js';

const url = "https://xcncnzbxkrzrvztylvfg.supabase.co";
const srKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjbmNuemJ4a3J6cnZ6dHlsdmZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU4MjQ0NiwiZXhwIjoyMDg1MTU4NDQ2fQ.P_kcOug2pF3jEF9V73RPrF6oeFH99_1viXOQrMLs6gg";

const supabase = createClient(url, srKey);

async function test() {
    console.log("Checking buckets...");
    const { data, error } = await supabase.storage.listBuckets();
    console.log("DATA:", data?.map(b => b.id));
    console.log("ERROR:", error);
}

test();
