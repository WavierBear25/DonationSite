const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, message, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const { error } = await supabase.from('donations').insert([
      { name: name || null, message: message || null, amount }
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Donation recorded' });
  } catch (err) {
    console.error("Unhandled error in donate.js:", err);
    res.status(500).json({ error: 'Server crashed: ' + err.message });
  }
};

//temp
document.getElementById('donateBtn').addEventListener('click', async () => {
  console.log("Donate button clicked");

  const name = document.getElementById('name').value;
  const message = document.getElementById('message').value;
  const amount = parseFloat(document.getElementById('amount').value);

  console.log("Donation details:", { name, message, amount });

  try {
    const res = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message, amount })
    });

    console.log("API response status:", res.status);

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
