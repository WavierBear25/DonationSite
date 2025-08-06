const { createClient } = require('@supabase/supabase-js');
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
};