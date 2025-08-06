const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

function createFile(path, content) {
  mkdirSync(require('path').dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`Updated: ${path}`);
}

const frontendDir = join(process.cwd(), 'frontend');

// --- Overwrite admin.html ---
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
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    #totalDisplay { font-size: 1.2em; font-weight: bold; }
    #liveToggle { margin-left: 10px; }
    textarea {
      width: 100%;
      min-height: 30px;
      resize: vertical;
      background: #1e1e1e;
      color: #fff;
      border: 1px solid #444;
      padding: 5px;
      font-size: 14px;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
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
    <div class="toolbar">
      <div>
        <span id="totalDisplay">Total Raised: £0</span>
        <label>
          <input type="checkbox" id="liveToggle" onchange="toggleLiveUpdates()"> Live Updates
        </label>
      </div>
      <button onclick="goToMain()">← Back to Main</button>
    </div>

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
    let liveInterval = null;

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

      if (data.error) {
        alert('Session expired or unauthorized.');
        localStorage.removeItem('adminToken');
        location.reload();
        return;
      }

      // Calculate total
      const total = data.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
      document.getElementById('totalDisplay').innerText = \`Total Raised: £\${total}\`;

      // Populate table
      const table = document.getElementById('donationsTable');
      table.innerHTML = '';
      data.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = \`
          <td>\${d.id}</td>
          <td>\${d.name || 'Anonymous'}</td>
          <td>
            <textarea oninput="autoResize(this)" onchange="editMessage(\${d.id}, this.value)">\${d.message || ''}</textarea>
          </td>
          <td>£\${d.amount}</td>
          <td>\${new Date(d.timestamp).toLocaleString()}</td>
          <td><button onclick="refundDonation(\${d.id})">Refund</button></td>
        \`;
        table.appendChild(row);

        // Trigger auto-resize immediately
        const textarea = row.querySelector('textarea');
        autoResize(textarea);
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

    function toggleLiveUpdates() {
      clearInterval(liveInterval);
      if (document.getElementById('liveToggle').checked) {
        liveInterval = setInterval(fetchDonations, 5000);
      }
    }

    function autoResize(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }

    function goToMain() {
      window.location.href = 'index.html';
    }
  </script>
</body>
</html>`);

// Commit & push
try {
  execSync('git add .; git commit -m "Update admin dashboard with fixes"; git push origin main', {
    stdio: 'inherit',
    shell: 'powershell.exe'
  });
} catch (err) {
  console.error('Git push failed:', err.message);
}
