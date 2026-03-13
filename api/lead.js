// api/lead.js — verstuurt lead via Formspree (geen API key nodig)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { naam, telefoon, interesse, datum } = req.body;

  if (!naam || !telefoon) {
    return res.status(400).json({ error: 'naam en telefoon zijn verplicht' });
  }

  try {
    const response = await fetch('https://formspree.io/f/xpqylryk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        naam,
        telefoon,
        interesse:  interesse || 'Niet opgegeven',
        datum:      datum || new Date().toLocaleDateString('nl-NL'),
        _subject:   `Nieuwe lead: ${naam}`,
        _replyto:   'noreply@briqk.nl'
      })
    });

    if (!response.ok) return res.status(500).json({ error: 'Formspree fout' });
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Lead API fout:', err);
    return res.status(500).json({ error: 'Serverfout' });
  }
}
