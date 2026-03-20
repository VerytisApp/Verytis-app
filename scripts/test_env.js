const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

// Read raw file to get keys
const envRaw = fs.readFileSync(envPath, 'utf8');
const envParsed = dotenv.parse(envRaw);
const allKeys = Object.keys(envParsed);

dotenv.config({ path: envPath });

console.log(`--- 🛡️ Full Environment Variable Diagnostic (Total: ${allKeys.length}) ---`);

let counts = { ok: 0, missing: 0 };

allKeys.forEach(key => {
  const val = process.env[key];
  if (!val || val.trim() === '') {
    console.log(`❌ ${key.padEnd(30)}: [EMPTY/MISSING]`);
    counts.missing++;
  } else {
    // Mask value safely
    let masked = '****';
    if (val.length > 10) {
        masked = val.substring(0, 4) + '...' + val.substring(val.length - 4);
    } else if (val.length > 5) {
        masked = val.substring(0, 2) + '...' + val.substring(val.length - 2);
    }
    console.log(`✅ ${key.padEnd(30)}: [OK] (${masked})`);
    counts.ok++;
  }
});

console.log('\n--- Summary ---');
console.log(`Total detected : ${counts.ok}`);
console.log(`Total empty    : ${counts.missing}`);

if (counts.missing > 0) {
    console.log('\n⚠️ There are empty variables. Check if they are needed for your specific use cases.');
} else {
    console.log('\n🎉 Every variable in your .env has a value!');
}
