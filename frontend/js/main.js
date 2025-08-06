// main.js

const recentList = document.getElementById('recent');
const topList = document.getElementById('topDonators');
const totalSpan = document.getElementById('total');
const donateBtn = document.getElementById('donateBtn');

let donations = []; // This will hold donation objects

function formatCurrency(amount) {
  return amount.toFixed(2);
}

function renderDonations() {
  // Sort recent by timestamp descending
  const recent = [...donations]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  recentList.innerHTML = recent
    .map(d => `<li><strong>${d.name || 'anonymous'}</strong>: $${formatCurrency(d.amount)}<br><em>${d.message || ''}</em></li>`)
    .join('');

  // Sort top donators by amount descending
  const top = [...donations]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  topList.innerHTML = top
    .map(d => `<li><strong>${d.name || 'anonymous'}</strong>: $${formatCurrency(d.amount)}</li>`)
    .join('');

  // Update total raised
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  totalSpan.textContent = formatCurrency(total);
}

function simulateDonation(name, message, amount) {
  const newDonation = {
    name: name.trim() || 'anonymous',
    message: message.trim(),
    amount: Number(amount),
    timestamp: new Date().toISOString()
  };
  donations.push(newDonation);
  renderDonations();
}

donateBtn.addEventListener('click', () => {
  const name = document.getElementById('name').value;
  const message = document.getElementById('message').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid donation amount greater than 0.');
    return;
  }

  simulateDonation(name, message, amount);

  // Clear inputs
  document.getElementById('name').value = '';
  document.getElementById('message').value = '';
  document.getElementById('amount').value = '';
});

// Initial render with empty donations array
renderDonations();
