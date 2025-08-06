const { writeFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const styleCss = `/* Reset and base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background: #121212;
  color: #eee;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
}

.container {
  display: flex;
  max-width: 1000px;
  width: 100%;
  gap: 30px;
}

.column {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 24px;
  flex: 1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow-y: auto;
}

h1, h2 {
  margin-bottom: 20px;
  font-weight: 600;
  color: #f9f9f9;
}

input[type="text"],
input[type="number"],
textarea {
  background: #2a2a2a;
  border: none;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 20px;
  color: #eee;
  font-size: 1rem;
  resize: vertical;
  transition: background 0.3s ease;
}

input[type="text"]:focus,
input[type="number"]:focus,
textarea:focus {
  background: #3a3a3a;
  outline: none;
}

#donateBtn {
  background: #ff5722;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  padding: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
  box-shadow: 0 6px 12px rgba(255, 87, 34, 0.5);
}

#donateBtn:hover {
  background: #e64a19;
}

ul, ol {
  list-style: none;
  overflow-y: auto;
  flex-grow: 1;
}

ul li, ol li {
  padding: 12px 8px;
  margin-bottom: 8px;
  background: #292929;
  border-radius: 8px;
  font-size: 0.95rem;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.05);
  word-break: break-word;
}

h1 span#total {
  color: #ffab91;
  font-weight: 700;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  .column {
    max-height: none;
  }
}
`;

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Donations</title>
<link rel="stylesheet" href="css/style.css" />
</head>
<body>
<div class="container">
  <section class="column donate">
    <h1>Total Raised: $<span id="total">0</span></h1>
    <h2>Make a Donation</h2>
    <input type="text" id="name" placeholder="Your Name (optional)" autocomplete="name" />
    <textarea id="message" placeholder="Message (optional)" autocomplete="off"></textarea>
    <input type="number" id="amount" placeholder="Amount ($)" min="0.01" step="0.01" />
    <button id="donateBtn">Donate</button>
  </section>

  <section class="column recent">
    <h2>Recent Donations</h2>
    <ul id="recent"></ul>
  </section>

  <section class="column top">
    <h2>Top Donators</h2>
    <ol id="topDonators"></ol>
  </section>
</div>
<script src="js/main.js"></script>
</body>
</html>`;

const stylePath = join(process.cwd(), 'frontend', 'css', 'style.css');
const indexPath = join(process.cwd(), 'frontend', 'index.html');

writeFileSync(stylePath, styleCss, 'utf8');
writeFileSync(indexPath, indexHtml, 'utf8');

console.log('Updated style.css and index.html');

try {
  execSync('git add .; git commit -m "Update main page style and structure"; git push origin main', {
    stdio: 'inherit',
    shell: 'powershell.exe'
  });
} catch (err) {
  console.error('Git push failed:', err.message);
}
