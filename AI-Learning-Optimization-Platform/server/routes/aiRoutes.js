const express = require('express');
const router = express.Router();

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

async function callGemini(systemPrompt, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n${userMessage}`
        : userMessage;

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature: 0.7 }
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');
    return text;
}

const TUTOR_SYSTEM_PROMPT = `You are Cognify's AI Tutor — a warm, brilliant, and encouraging learning companion. You combine the depth of a great teacher with the friendliness of a study buddy.

## YOUR PERSONALITY
- Warm, enthusiastic, and genuinely excited about learning
- Use emojis naturally — not excessively, but to add emotion and clarity
- Celebrate wins, no matter how small ("That's a great question! 🎯")
- Be honest when something is tricky ("This one trips up a lot of people, don't worry! 😄")
- Never make the student feel dumb — always validate first, then correct
- Match the student's energy — if they're casual, be casual; if focused, be focused

## RESPONSE STRUCTURE
For CONCEPT questions use:
💡 **Quick Answer** (1-2 lines, the core idea)
📖 **Let me explain** (clear breakdown, simple language)
🔍 **Example** (always give a real, relatable code or real-world example)
💬 **Think of it like this** (an analogy that makes it click)
✅ **Key takeaway** (one memorable line)

For HOW-TO questions use:
🎯 **What you want to do** (restate clearly)
🪜 **Step by step:** (numbered steps)
💻 **Here's the code:** (clean, commented code block)
⚡ **Pro tip** (one extra insight they didn't ask for but will love)

For STUCK / DEBUGGING questions use:
😌 **Don't stress** (quick reassurance)
🔎 **What's happening** (explain the error clearly)
🛠️ **How to fix it** (exact steps or corrected code)
🧠 **Why this happened** (so they learn, not just copy-paste)

For MOTIVATION / GENERAL questions:
Just be human — warm, real, encouraging. Like a mentor who genuinely cares.

## FORMATTING RULES
- Use **bold** for key terms and important points
- Use \`code\` for inline code mentions
- Use proper code blocks with language tags for any code
- Use bullet points and numbered lists for steps
- Keep paragraphs short — max 3 lines each
- Add relevant emoji at the start of each major section
- End responses with either a follow-up question OR an encouraging nudge

## RESPONSE LENGTH
- Simple questions: 100-150 words
- Concept explanations: 150-250 words
- Step-by-step guides: as long as needed, but each step concise
- Never write walls of text — break everything up visually`;

async function callGeminiChat(conversationHistory) {
    const apiKey = process.env.GEMINI_API_KEY;

    // Build Gemini contents array with full conversation history
    // Gemini uses 'user' and 'model' roles
    const contents = conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: TUTOR_SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.8, maxOutputTokens: 1500 }
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');
    return text;
}

// POST /api/ai/chat  — multi-turn conversation
router.post('/chat', async (req, res) => {
    try {
        // Accept full conversation history array OR legacy single message
        const { messages, message, context } = req.body;

        let conversationHistory;
        if (messages && Array.isArray(messages)) {
            // New multi-turn format: [{role: 'user'|'assistant', content: '...'}]
            conversationHistory = messages;
        } else {
            // Legacy fallback: single message with optional context string
            const content = context ? `${context}\n\nUser: ${message}` : message;
            conversationHistory = [{ role: 'user', content }];
        }

        const reply = await callGeminiChat(conversationHistory);
        res.json({ result: reply, reply });
    } catch (error) {
        console.error('Chat error:', error.message);
        res.status(500).json({ error: error.message });
    }
});


// POST /api/ai/quiz
router.post('/quiz', async (req, res) => {
    try {
        const { topic, difficulty, count } = req.body;
        const systemPrompt = `Return ONLY a valid JSON array of ${count} multiple-choice questions. Each object: {"question": "...", "options": ["option A", "option B", "option C", "option D"], "answer": 0}. Where "answer" is the 0-indexed integer of the correct option. No markdown code fences. No explanatory text. Pure JSON array only.`;
        const userMsg = `Generate a ${difficulty} level quiz about: ${topic}`;
        const raw = await callGemini(systemPrompt, userMsg);
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const questions = JSON.parse(cleaned);
        res.json({ questions });
    } catch (error) {
        console.error('Quiz error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ai/study-plan
router.post('/study-plan', async (req, res) => {
    try {
        const { topic, goal, days, dailyTime, level } = req.body;
        const systemPrompt = "You are an expert learning coach. Create detailed, actionable study plans with: overview, daily/weekly breakdown, milestones, and practical tips. Format it clearly with sections.";
        const userMsg = `Topic: ${topic}\nGoal: ${goal}\nDays available: ${days}\nDaily time: ${dailyTime}\nCurrent level: ${level}\n\nCreate a concrete, detailed study plan.`;
        const result = await callGemini(systemPrompt, userMsg);
        res.json({ result, plan: result });
    } catch (error) {
        console.error('Study plan error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ai/summarize — supports subject + difficulty
router.post('/summarize', async (req, res) => {
    try {
        const { notes, format, subject, difficulty } = req.body;

        const difficultyInstruction = difficulty === 'advanced'
            ? 'Preserve technical terminology. Include nuances and deeper insights. Suitable for someone with prior knowledge of the subject.'
            : 'Use simple language. Avoid jargon. Short sentences. Explain any technical terms used. Perfect for beginners or quick review.';

        const subjectContext = subject && subject !== 'other'
            ? `These are ${subject} notes. `
            : '';

        let outputInstruction;
        if (format === 'summary') {
            outputInstruction = `${subjectContext}${difficultyInstruction}

Return ONLY a valid JSON object:
{ "keyPoints": ["key point 1", "key point 2", ...] }
Each key point should be a clear, complete sentence or fact. Include 5-12 key points. No markdown code fences. Pure JSON only.`;
        } else if (format === 'flashcards') {
            outputInstruction = `${subjectContext}${difficultyInstruction}

Create study flashcards from these notes.
Return ONLY a valid JSON object:
{ "flashcards": [{"question": "...", "answer": "..."}, ...] }
Create 6-12 flashcards. Questions should be specific and test real understanding. Answers should be concise but complete. No markdown code fences. Pure JSON only.`;
        } else {
            outputInstruction = `${subjectContext}${difficultyInstruction}

Return ONLY a valid JSON object with BOTH key points AND flashcards:
{ "keyPoints": ["key point 1", ...], "flashcards": [{"question": "...", "answer": "..."}, ...] }
Include 5-10 key points and 5-8 flashcards. No markdown code fences. Pure JSON only.`;
        }

        const systemPrompt = `You are an expert study assistant who creates high-quality, structured study materials. ${outputInstruction}`;
        const raw = await callGemini(systemPrompt, `Here are the notes to process:\n\n${notes}`);
        const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

        let result;
        try {
            result = JSON.parse(cleaned);
        } catch {
            result = cleaned;
        }

        res.json({ result });
    } catch (error) {
        console.error('Summarize error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ai/detect-topic — fast topic detection (first 500 chars only)
router.post('/detect-topic', async (req, res) => {
    try {
        const { notes } = req.body;
        if (!notes || notes.length < 80) return res.json({ topic: null });

        const systemPrompt = 'Identify the topic or subject of these notes. Reply with ONLY a short topic name (2-5 words maximum). Examples: "Python Functions", "World War II", "Calculus Derivatives", "Newton\'s Laws". Nothing else — just the topic name.';
        const topic = await callGemini(systemPrompt, notes.slice(0, 500));
        res.json({ topic: topic.trim().replace(/["']/g, '') });
    } catch (error) {
        console.error('Detect topic error:', error.message);
        res.json({ topic: null }); // soft fail — not critical
    }
});


// POST /api/ai/explain
router.post('/explain', async (req, res) => {
    try {
        const { concept, level } = req.body;
        const systemPrompt = `You are an expert teacher. Structure your explanation as:
1. One-line definition
2. Real-world analogy (relatable for a ${level})
3. How it works (step by step)
4. Code example (if programming-related)
5. When to use / when not to use`;
        const userMsg = `Explain the concept of "${concept}" like I am a ${level}.`;
        const result = await callGemini(systemPrompt, userMsg);
        res.json({ result, explanation: result });
    } catch (error) {
        console.error('Explain error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ai/coach
router.post('/coach', async (req, res) => {
    try {
        const { stats, struggle } = req.body;
        const systemPrompt = `You are an expert learning coach. Analyze the student's data and provide:
1. **Strengths** – What they're doing well
2. **Areas to Improve** – Specific weaknesses
3. **Action Plan** – 3-5 concrete, actionable steps
4. **Motivational Message** – Encouraging closing note

Be specific, data-driven, and encouraging.`;
        const userMsg = `Student stats: ${JSON.stringify(stats)}\n\nWhat they're struggling with: ${struggle}`;
        const result = await callGemini(systemPrompt, userMsg);
        res.json({ result, advice: result });
    } catch (error) {
        console.error('Coach error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
