export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // TEMP response (just to test)
    return res.status(200).json({
      result: `Generated content for: ${prompt || "no prompt"} 🚀`
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Something went wrong'
    });
  }
}
