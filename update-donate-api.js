const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const donateCode = "import { createClient } from '@supabase/supabase-js';\n\n" +
"\nconst supabaseUrl = process.env.SUPABASE_URL;\n" +
"const supabaseKey = process.env.SUPABASE_KEY;\n" +
"const supabase = createClient(supabaseUrl, supabaseKey);\n\n" +
"export async function POST(request) {\n" +
"  try {\n" +
"    const { name, message, amount } = await request.json();\n\n" +
"    if (!amount || isNaN(amount) || amount <= 0) {\n" +
"      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });\n" +
"    }\n\n" +
"    const { error } = await supabase.from('donations').insert([\n" +
"      {\n" +
"        name: name?.trim() || 'Anonymous',\n" +
"        message: message?.trim() || '',\n" +
"        amount,\n" +
"      },\n" +
"    ]);\n\n" +
"    if (error) {\n" +
"      return new Response(JSON.stringify({ error: error.message }), { status: 400 });\n" +
"    }\n\n" +
"    return new Response(JSON.stringify({ success: true }), { status: 200 });\n" +
"  } catch (err) {\n" +
"    return new Response(JSON.stringify({ error: err.message }), { status: 500 });\n" +
"  }\n" +
"}\n";

const filePath = join(process.cwd(), 'donation-app', 'netlify', 'functions', 'donate.js');
const dirPath = join(process.cwd(), 'donation-app', 'netlify', 'functions');

if (!existsSync(dirPath)) {
  mkdirSync(dirPath, { recursive: true });
  console.log(`Created missing directory: ${dirPath}`);
}

writeFileSync(filePath, donateCode);
console.log(`Updated donate function at: ${filePath}`);

try {
  execSync('git add .; git commit -m "Fix donate API with proper JSON parsing and error handling"; git push origin main', {
    stdio: 'inherit',
    shell: 'powershell.exe',
  });
} catch (err) {
  console.error('Git push failed:', err.message);
}
