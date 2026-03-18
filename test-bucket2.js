import { createClient } from '@supabase/supabase-js';

const url = "https://xcncnzbxkrzrvztylvfg.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjbmNuemJ4a3J6cnZ6dHlsdmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODI0NDYsImV4cCI6MjA4NTE1ODQ0Nn0.XFW9AgYFqwxEcBbjuA4ZimuSof4VS6drNeqY1WMEgWU";

const supabase = createClient(url, key);

async function test() {
    console.log("Checking list()...");
    const { data, error } = await supabase.storage.from('i_do_not_exist').list();
    console.log("DATA:", data);
    console.log("ERROR:", error);

    console.log("Checking real bucket...");
    const { data: d2, error: e2 } = await supabase.storage.from('knowledge').list();
    console.log("DATA2:", d2);
    console.log("ERROR2:", e2);
}

test();
