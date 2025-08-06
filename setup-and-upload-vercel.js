const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

// --- CONFIG: CHANGE THIS TO YOUR REPO URL ---
const GITHUB_REPO = "https://github.com/WavierBear25/DonationSite.git";

// Helper functions
function makeDir(path) {
  mkdirSync(path, { recursive: true });
}

function createFile(path, content) {
  writeFileSync(path, content);
  console.log(`Created: ${path}`);
}

// --- FILE STRUCTURE CREATION ---
const root = process.cwd();

makeDir(join(root, 'frontend/css'));
makeDir(join(root, 'frontend/js'));
makeDir(join(root, 'api'));

// index.html with 3-column layout
createFile(join(root, 'frontend/index.html'), `<!DOCTYPE html>
<html>
<head>
  <title>Donations</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="container three-column">

    <div class="column recent">
      <h2>Recent Donations</h2>
      <ul id="recent"></ul>
    </div>

    <div class="column donate">
      <h1>Total Raised: £<span id="total">0</span></h1>
      <div class="donate-box">
        <h2>Donate</h2>
        <input type="text" id="name" placeholder="Your Name (optional)">
        <textarea id="message" placeholder="Message (optional)"></textarea>
        <input type="number" id="amount" placeholder="Amount (£)">
        <button id="donateBtn">Donate</button>
        <div class="payment-buttons">
          <button disabled>PayPal (Coming Soon)</button>
          <button disabled>Credit Card (Coming Soon)</button>
        </div>
      </div>
    </div>

    <div class="column leaderboard">
      <h2>Top Donators</h2>
      <ul id="leaderboard"></ul>
    </div>

  </div>

  <script src="js/main.js"></script>
</body>
</html>`);

// style.css
createFile(join(root, 'frontend/css/style.css'), `body {
  font-family: Arial, sans-serif;
  background: #f7f8fa;
  margin: 0;
  padding: 0;
  color: #333;
}
.container.three-column {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  max-width: 1200px;
  margin: 20px auto;
  padding: 10px;
}
.column {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  flex: 1;
  min-width: 250px;
}
.column h2, .column h1 {
  text-align: center;
  margin-bottom: 10px;
}
.donate-box input,
.donate-box textarea,
.donate-box button {
  width: 100%;
  padding: 10px;
  margin: 8px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.donate-box button {
  background: #007BFF;
  color: white;
  border: none;
  cursor: pointer;
}
.donate-box button:hover {
  background: #0056b3;
}
.payment-buttons button {
  margin-top: 10px;
  background: #ccc;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .container.three-column {
    flex-direction: column;
  }
}`);

// main.js
createFile(join(root, 'frontend/js/main.js'), `const API_BASE = '/api';

async function fetchStats() {
  const res = await fetch(\`\${API_BASE}/stats\`);
  const data = await res.json();

  document.getElementById('total').innerText = data.total.toFixed(2);

  const lb = document.getElementById('leaderboard');
  lb.innerHTML = data.leaderboard.map(d => \`<li>\${d.name}: £\${d.total.toFixed(2)}</li>\`).join('');

  const recent = document.getElementById('recent');
  recent.innerHTML = data.recent.map(d => \`<li>\${d.name || 'Anonymous'}: £\${d.amount} - \${d.message || ''}</li>\`).join('');
}

document.getElementById('donateBtn').addEventListener('click', async () => {
  const name = document.getElementById('name').value;
  const message = document.getElementById('message').value;
  const amount = parseFloat(document.getElementById('amount').value);

  const res = await fetch(\`\${API_BASE}/donate\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, message, amount })
  });

  if (res.ok) {
    alert('Donation successful!');
    fetchStats();
  } else {
    alert('Error donating');
  }
});

fetchStats();
setInterval(fetchStats, 5000);`);

// stats.js (Vercel serverless function)
createFile(join(root, 'api/stats.js'), `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const { data: totalData } = await supabase.rpc('get_total_donations');
  const total = totalData || 0;

  const { data: leaderboard } = await supabase.rpc('get_leaderboard');

  const { data: recent } = await supabase
    .from('donations')
    .select('name,message,amount,timestamp')
    .order('timestamp', { ascending: false })
    .limit(10);

  res.status(200).json({
    total,
    leaderboard,
    recent
  });
}`);

// donate.js (Vercel serverless function)
createFile(join(root, 'api/donate.js'), `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, message, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  await supabase.from('donations').insert([
    { name: name || null, message: message || null, amount }
  ]);

  res.status(200).json({ message: 'Donation recorded' });
}`);

// --- GIT COMMANDS ---
try {
  execSync('git init', { stdio: 'inherit' });
  execSync('git branch -M main', { stdio: 'inherit' });
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Initial Vercel donation site"', { stdio: 'inherit' });
  execSync(`git remote add origin ${GITHUB_REPO}`, { stdio: 'inherit' });
  execSync('git push origin main --force', { stdio: 'inherit' });
  console.log('Pushed to GitHub successfully!');
} catch (error) {
  console.error('Git commands failed:', error.message);
}
