// Vercel Serverless Function: VitaBot AI Proxy
// POST /api/vitabot  { chatId, text, context?: { offline?: boolean } }
// Env: GOOGLEAI_API_KEY (preferred) or OPENAI_API_KEY

export default async function handler(req, res) {
  // Basic CORS (mobile apps typically don't need it, but keep permissive)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { chatId, text, context = {} } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });

    const OUT_OF_SCOPE = /(crypto|stock|forex|tax|politic|religion|dating|sexual|nsfw|violence|weapons?|hacking|illegal|medical\s*(diagnosis|treatment|prescription|medication))/i;
    const offlinePrefix = context?.offline ? 'Your coach is currently offline. I’m VitaBot, here to help for now. ' : '';
    if (OUT_OF_SCOPE.test(text)) {
      return res.status(200).json({ reply: offlinePrefix + 'I can help with workouts, nutrition, hydration, sleep, and how to use the app. I can’t assist with that topic.' });
    }

    const system = (
      'You are VitaBot, a concise, friendly assistant for a fitness and health app.\n\n' +
      'Scope: ONLY help with:\n' +
      '- Workouts/exercise, warmups, sets/reps, general progression\n' +
      '- Nutrition basics (calories, macros, meal ideas), hydration\n' +
      '- Sleep/recovery habits\n' +
      '- How to use the app (navigation and features)\n\n' +
      'Hard limits: Do NOT provide medical diagnoses, clinical treatment, or personalized medical advice.\n' +
      'Refuse non-fitness topics (crypto, taxes, politics, adult content, hacking, illegal).\n\n' +
      'Style: short, practical, supportive. Use bullet points when helpful. If unclear, ask 1 brief clarifier.\n' +
      'If asked about calories for common foods, provide reasonable approximations (e.g., medium banana ~105 kcal).'
    );

    const googleKey = process.env.GOOGLEAI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Prefer Gemini (free tier friendly)
    if (googleKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleKey}`;
      const gRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser: ${String(text).trim()}` }] }],
          generationConfig: { temperature: 0.4 },
        }),
      });
      if (gRes.ok) {
        const json = await gRes.json();
        const cand = json?.candidates?.[0];
        const parts = cand?.content?.parts || [];
        const content = parts.map(p => p.text).filter(Boolean).join('\n').trim();
        const reply = content || 'I can help with workouts, nutrition, hydration, sleep, and app guidance.';
        return res.status(200).json({ reply: offlinePrefix + reply });
      }
      // fallthrough if non-OK
    }

    // Fallback: OpenAI if available
    if (openaiKey) {
      const oRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: String(text).trim() },
          ],
        }),
      });
      if (oRes.ok) {
        const json = await oRes.json();
        const content = json?.choices?.[0]?.message?.content?.trim();
        const reply = (content && typeof content === 'string') ? content : 'I can help with workouts, nutrition, hydration, sleep, and app guidance.';
        return res.status(200).json({ reply: offlinePrefix + reply });
      }
    }

    // Heuristic backup
    const lower = String(text || '').toLowerCase();
    const maybe = (re) => re.test(lower);
    const parts = [];
    if (maybe(/banana/) && maybe(/cal(orie|ories|kcal)/)) parts.push('A medium banana (~118g) has about 105 kcal.');
    if (maybe(/egg/) && (maybe(/protein/) || maybe(/cal(orie|ories|kcal)/))) parts.push('One large egg ~70 kcal and ~6g protein.');
    if (maybe(/water|hydrate|hydration/)) parts.push('Most people do well with ~2–3L water/day; adjust for heat and workouts.');
    if (!parts.length) parts.push('I can help with workouts, nutrition, hydration, sleep, and app guidance.');
    return res.status(200).json({ reply: offlinePrefix + parts.join('\n') });
  } catch (e) {
    console.error('vitabot proxy error', e);
    return res.status(200).json({ reply: 'I can help with workouts, nutrition, hydration, sleep, and app guidance.' });
  }
}
