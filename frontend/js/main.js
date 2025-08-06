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
document.addEventListener('DOMContentLoaded', () => {
  const donateBtn = document.getElementById('donateBtn');
  if (donateBtn) {
    donateBtn.addEventListener('click', async () => {
      console.log("Donate button clicked"); // Debug log

      const name = document.getElementById('name').value;
      const message = document.getElementById('message').value;
      const amount = parseFloat(document.getElementById('amount').value);

      if (!amount || amount <= 0) {
        alert("Please enter a valid donation amount.");
        return;
      }

      try {
        const res = await fetch('/api/donate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, message, amount })
        });

        const data = await res.json();
        if (res.ok) {
          alert('Donation successful!');
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        console.error("Donation error:", err);
        alert('Donation failed (check console)');
      }
    });
  } else {
    console.error("Donate button not found in DOM.");
  }
});
