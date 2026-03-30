import { Router } from 'express';

const router = Router();

// Using models confirmed to be available for this API key
const MODEL_URL_FLASH = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const MODEL_URL_FALLBACK = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

router.post('/generate', async (req, res) => {
  try {
    const { prompt, temperature = 0.3, maxOutputTokens = 768 } = req.body ?? {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const generateContent = async (url: string) => {
      return await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });
    };

    let response = await generateContent(MODEL_URL_FLASH);

    // If latest flash fails, try the 2.0 version
    if (response.status === 404) {
      console.warn('Gemini Flash Latest not found, trying Gemini 2.0 Flash fallback...');
      response = await generateContent(MODEL_URL_FALLBACK);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error('Gemini API Error details:', JSON.stringify(errorBody, null, 2));
      const message =
        errorBody?.error?.message ||
        `Gemini API error: ${response.status} ${response.statusText}`;
      return res.status(response.status).json({ error: message });
    }

    const data = await response.json();
    const text =
      data?.candidates
        ?.flatMap((candidate: any) => candidate?.content?.parts ?? [])
        ?.map((part: any) => part?.text)
        ?.filter(Boolean)
        ?.join('\n')
        ?.trim() || '';

    if (!text) {
      return res.status(502).json({ error: 'Gemini response was empty.' });
    }

    res.json({ text });
  } catch (error) {
    console.error('Gemini proxy error:', error);
    res.status(500).json({ error: 'Failed to generate AI output.' });
  }
});

export default router;

