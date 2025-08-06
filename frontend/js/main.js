async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('total').textContent = data.total.toFixed(2);

    const recent = document.getElementById('recent');
    recent.innerHTML = '';
    data.recent.forEach(d => {
      const li = document.createElement('li');
      li.textContent = ${d.name}: UTF8{d.amount.toFixed(2)} - ;
      recent.appendChild(li);
    });

    const topDonators = document.getElementById('topDonators');
    topDonators.innerHTML = '';
    data.top.forEach(d => {
      const li = document.createElement('li');
      li.textContent = ${d.name}: UTF8{d.amount.toFixed(2)};
      topDonators.appendChild(li);
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

async function donate() {
  const name = document.getElementById('name').value.trim();
  const message = document.getElementById('message').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid donation amount.');
    return;
  }

  try {
    const res = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message, amount }),
    });

    const result = await res.json();

    if (res.ok) {
      alert('Donation successful!');
      document.getElementById('name').value = '';
      document.getElementById('message').value = '';
      document.getElementById('amount').value = '';
      fetchStats();
    } else {
      alert('Donation failed: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Donation error: ' + error.message);
  }
}

document.getElementById('donateBtn').addEventListener('click', donate);

window.onload = fetchStats;
