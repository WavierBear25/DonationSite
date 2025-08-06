const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

// --- Helper function ---
function createFile(path, content) {
  mkdirSync(require('path').dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`Created: ${path}`);
}

// --- Paths ---
const frontendDir = join(process.cwd(), 'frontend');
const apiDir = join(process.cwd(), 'api');

// --- 1. Admin HTML ---
createFile(join(frontendDir, 'admin.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    body { font-family: sans-serif; background: #121212; color: #fff; padding: 20px; }
    .hidden { display: none; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; border-bottom: 1px solid #444; }
    button { margin: 0 5px; padding: 5px 10px; cursor: pointer; }
    input, textarea { padding: 5px; }
    .login-box { max-width: 300px; margin: 50px auto; }
  </style>
</head>
<body>
  <div id="login" class="login-box">
    <h2>Admin Login</h2>
    <input type="password" id="password" placeholder="Password">
    <button onclick="login()">Login</button>
    <p id="loginError" style="color:red;"></p>
  </div>

  <div id="dashboard" class="hidden">
    <h2>Donations Dashboard</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Message</th>
          <th>Amount</th>
          <th>Timestamp</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="donationsTable"></tbody>
    </table>
  </div>

  <script>
    const API = '/api';

    async function login() {
      const password = document.getElementById('password').value;
      const res = await fetch(\`\${API}/admin-login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        document.getElementById('login').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        fetchDonations();
      } else {
        document.getElementById('loginError').innerText = data.error;
      }
    }

    async function fetchDonations() {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(\`\${API}/admin-donations?token=\${token}\`);
      const data = await res.json();
      const table = document.getElementById('donationsTable');
      table.innerHTML = '';
      data.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = \`
          <td>\${d.id}</td>
          <td>\${d.name || 'Anonymous'}</td>
          <td><input value="\${d.message || ''}" onchange="editMessage(\${d.id}, this.value)"></td>
          <td>£\${d.amount}</td>
          <td>\${new Date(d.timestamp).toLocaleString()}</td>
          <td>
            <button onclick="refundDonation(\${d.id})">Refund</button>
          </td>
        \`;
        table.appendChild(row);
      });
    }

    async function editMessage(id, newMessage) {
      const token = localStorage.getItem('adminToken');
      await fetch(\`\${API}/admin-edit\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id, message: newMessage })
      });
      fetchDonations();
    }

    async function refundDonation(id) {
      const token = localStorage.getItem('adminToken');
      await fetch(\`\${API}/admin-refund\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id })
      });
      fetchDonations();
    }
  </script>
</body>
</html>`);

// --- 2. API: admin-login.js ---
createFile(join(apiDir, 'admin-login.js'), `module.exports = async (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    // Simple token (in real app use JWT)
    const token = process.env.ADMIN_PASSWORD;
    return res.status(200).json({ success: true, token });
  }
  res.status(401).json({ success: false, error: 'Invalid password' });
};`);

// --- 3. API: admin-donations.js ---
createFile(join(apiDir, 'admin-donations.js'), `const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  const token = req.query.token;
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};`);

// --- 4. API: admin-edit.js ---
createFile(join(apiDir, 'admin-edit.js'), `const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  const { token, id, message } = req.body;
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('donations')
    .update({ message })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
};`);

// --- 5. API: admin-refund.js ---
createFile(join(apiDir, 'admin-refund.js'), `const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  const { token, id } = req.body;
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
};`);

// --- Commit & Push to GitHub ---
try {
  execSync('git add .; git commit -m "Add admin dashboard and APIs"; git push origin main', { stdio: 'inherit', shell: 'powershell.exe' });
} catch (error) {
  console.error('Git push failed:', error.message);
}
