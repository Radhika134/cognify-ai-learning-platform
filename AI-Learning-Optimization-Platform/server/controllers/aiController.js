const generateStudyPlan = async (req, res) => {
    try {
        const { prompt, subject, timeframeDays } = req.body;

        if (!prompt || !subject || !timeframeDays) {
            return res.status(400).json({ message: 'Prompt, subject, and timeframeDays are required' });
        }

        // Fallback if no API key
        if (!process.env.GEMINI_API_KEY) {
            console.log('No GEMINI_API_KEY found, using fallback generator.');
            const mockGoals = [];
            const weeks = Math.ceil(timeframeDays / 7);
            if (timeframeDays <= 14) {
                for (let i = 1; i <= timeframeDays; i++) {
                    mockGoals.push(`Day ${i} → Focus on specific concepts of ${subject}`);
                }
            } else {
                for (let i = 1; i <= weeks; i++) {
                    if (i === 1) mockGoals.push(`Week ${i} → Core foundation of ${subject}`);
                    else if (i === weeks) mockGoals.push(`Week ${i} → Mock tests + final revision for ${subject}`);
                    else mockGoals.push(`Week ${i} → Deep dive into advanced ${subject} topics`);
                }
            }
            return res.status(200).json({
                title: `${subject} Mastery Plan`,
                subject,
                description: `A structured ${timeframeDays}-day roadmap to master ${subject}. Set your Gemini API key for AI-personalised plans!`,
                goals: mockGoals,
                hoursPerDay: 2,
            });
        }

        // Use native fetch (REST API) instead of SDK — avoids proxy/network issues
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const aiPrompt = `You are an expert AI Study Strategy Assistant. The user wants to study "${subject}".
Their specific goal is: "${prompt}".
They have approximately ${timeframeDays} days to prepare.

Generate a highly structured study roadmap.
Return ONLY a raw JSON object with the following structure (no markdown code fences, just pure JSON):
{
    "title": "A catchy, motivating title for this plan",
    "subject": "${subject}",
    "description": "A short 1-2 sentence motivating description of the strategy",
    "goals": [
        "Day 1 → ...",
        "Day 2 → ..."
    ],
    "hoursPerDay": 2
}
If timeframe is under 14 days, use daily chunks. Otherwise use weekly chunks. Keep each goal concise and actionable. Return valid JSON only.`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
                generationConfig: { temperature: 0.7 }
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Gemini API error:', errBody);
            throw new Error(`Gemini API returned ${response.status}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Strip any markdown fences the model might add
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const generatedData = JSON.parse(cleaned);

        res.status(200).json(generatedData);

    } catch (error) {
        console.error('Error generating AI plan:', error.message);
        res.status(500).json({ message: 'Failed to generate AI strategy', error: error.message });
    }
};

module.exports = { generateStudyPlan };
