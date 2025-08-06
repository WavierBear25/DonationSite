const API_BASE = '/api';

async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  const data = await res.json();

  document.getElementById('total').innerText = data.total.toFixed(2);

  const lb = document.getElementById('leaderboard');
  lb.innerHTML = data.leaderboard.map(d => `<li>${d.name}: £${d.total.toFixed(2)}</li>`).join('');

  const recent = document.getElementById('recent');
  recent.innerHTML = data.recent.map(d => `<li>${d.name || 'Anonymous'}: £${d.amount} - ${d.message || ''}</li>`).join('');
}

document.getElementById('donateBtn').addEventListener('click', async () => {
  const name = document.getElementById('name').value;
  const message = document.getElementById('message').value;
  const amount = parseFloat(document.getElementById('amount').value);

  const res = await fetch(`${API_BASE}/donate`, {
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
setInterval(fetchStats, 5000);