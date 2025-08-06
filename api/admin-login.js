module.exports = async (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    // Simple token (in real app use JWT)
    const token = process.env.ADMIN_PASSWORD;
    return res.status(200).json({ success: true, token });
  }
  res.status(401).json({ success: false, error: 'Invalid password' });
};