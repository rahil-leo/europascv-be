const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Template = require('../models/Template');

// Helper function to retry with exponential backoff
async function callGeminiWithRetry(model, prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            if (err.status === 503 && attempt < maxRetries) {
                // 503 = Service Unavailable, wait and retry
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`API busy (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                throw err; // If not 503 or last attempt, throw error
            }
        }
    }
}

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!process.env.GOOGLE_API_KEY) {
            return res.status(503).json({
                reply: "The chatbot is sleeping (Missing GOOGLE_API_KEY). Please add it to the .env file!"
            });
        }

        // Fetch live template data
        const templates = await Template.find().select('name price qualities');
        const templateContext = templates.map(t =>
            `- ${t.name}: ₹${t.price} (Features: ${(t.qualities || []).join(', ')})`
        ).join('\n');

        // System prompt
        const systemPrompt = `You are a friendly, helpful customer support assistant for "Europass.cv".
Your job is to answer user questions about our CV templates and booking process.

Here are our LIVE CV templates available right now:
${templateContext || 'No templates listed yet.'}

How our service works:
1. Users browse templates on the website.
2. They create an account or log in.
3. They click "Book this Template", provide their phone number and any notes.
4. Our admin team contacts them to finalize and deliver the CV.

Rules:
- Keep answers SHORT and friendly (1-3 paragraphs max).
- Use the LIVE template data above for prices. Do NOT make up prices.
- Don't use markdown headers (# or ##). Simple bullet points are fine.
- If you don't know something, ask the user to reach us via the WhatsApp button on the site.`;

        // Build conversation history
        let conversationHistory = systemPrompt + '\n\n';
        
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                if (msg.isWelcome) return;
                conversationHistory += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
            });
        }

        conversationHistory += `User: ${message}\nAssistant:`;

        // Call Google API with retry logic
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const reply = await callGeminiWithRetry(model, conversationHistory);

        res.json({ reply });

    } catch (err) {
        console.error('Chat API Error:', err);
        
        // Graceful error message
        if (err.status === 503) {
            res.status(503).json({ 
                reply: "Our AI is currently busy with lots of requests. Please try again in a few seconds! 🤖" 
            });
        } else {
            res.status(500).json({ 
                reply: "Sorry, I'm having technical difficulties. Please try again later." 
            });
        }
    }
});

module.exports = router;