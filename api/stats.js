const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res) => {
  const { data: totalData } = await supabase.rpc('get_total_donations');
  const total = totalData || 0;

  const { data: leaderboard } = await supabase.rpc('get_leaderboard');

  const { data: recent } = await supabase
    .from('donations')
    .select('name,message,amount,timestamp')
    .order('timestamp', { ascending: false })
    .limit(10);

  res.status(200).json({
    total,
    leaderboard,
    recent
  });
};
