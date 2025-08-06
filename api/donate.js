import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, message, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Attempt insert
  const { error } = await supabase.from('donations').insert([
    { name: name || null, message: message || null, amount }
  ]);

  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ message: 'Donation recorded' });
}

//Temp debug
const { error } = await supabase.from('donations').insert([
  { name: name || null, message: message || null, amount }
]);

if (error) {
  console.error("Supabase insert error:", error);
  return res.status(500).json({ error: error.message });
}
