const { GoogleGenerativeAI } = require('@google/generative-ai');

const generateStudyPlan = async (req, res) => {
    try {
        const { prompt, subject, timeframeDays } = req.body;

        if (!prompt || !subject || !timeframeDays) {
            return res.status(400).json({ message: 'Prompt, subject, and timeframeDays are required' });
        }

        // Use mock logic if API key is not present (to prevent crashes and ensure local dev works)
        if (!process.env.GEMINI_API_KEY) {
            console.log('No GEMINI_API_KEY found, using fallback AI generator.');

            // Generate a smart mock plan
            const mockGoals = [];
            const weeks = Math.ceil(timeframeDays / 7);

            if (timeframeDays <= 14) {
                for (let i = 1; i <= timeframeDays; i++) {
                    mockGoals.push(`Day ${i} -> Focus on specific concepts of ${subject} (Mock AI)`);
                }
            } else {
                for (let i = 1; i <= weeks; i++) {
                    if (i === weeks) {
                        mockGoals.push(`Week ${i} -> Mock tests + final revision for ${subject}`);
                    } else if (i === 1) {
                        mockGoals.push(`Week ${i} -> Core foundation of ${subject}`);
                    } else {
                        mockGoals.push(`Week ${i} -> Deep dive into advanced ${subject} topics`);
                    }
                }
            }

            return res.status(200).json({
                title: `${subject} Mastery Strategy`,
                subject: subject,
                description: `AI-generated study roadmap for ${subject} based on: "${prompt}". (Add GEMINI_API_KEY for true dynamic AI)`,
                goals: mockGoals,
                hoursPerDay: 2,
            });
        }

        // Real Google Gemini AI Integration
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-2.5-flash which is free tier friendly and available
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const aiPrompt = `
        You are an expert AI Study Strategy Assistant. The user wants to study "${subject}". 
        Their specific goal is: "${prompt}".
        They have approximately ${timeframeDays} days to prepare.
        
        Generate a highly structured study roadmap. 
        Return ONLY a raw JSON object with the following structure (do not wrap in markdown tags like \`\`\`json, just return pure JSON).
        {
            "title": "A catchy, motivating title for this plan",
            "subject": "${subject}",
            "description": "A short 1-2 sentence motivating description of the learning strategy",
            "goals": [
                "Week 1 -> Core concepts of...",
                "Week 2 -> Problem solving and...",
                "Week 3 -> Mock tests and..."
            ],
            "hoursPerDay": 2
        }
        Provide realistic daily chunks if timeframe is under 14 days, otherwise use weekly chunks. Keep each goal item concise and actionable. Ensure the JSON is perfectly valid.
        `;

        const result = await model.generateContent(aiPrompt);
        const responseText = result.response.text();

        // Clean markdown JSON wrapper if the AI still adds it
        const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const generatedData = JSON.parse(cleanedJsonString);

        res.status(200).json(generatedData);

    } catch (error) {
        console.error('Error generating AI plan:', error);
        res.status(500).json({ message: 'Failed to generate AI strategy', error: error.message });
    }
};

module.exports = { generateStudyPlan };
