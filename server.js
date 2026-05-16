const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const logFilePath = path.join(__dirname, 'chat_logs.txt');

// Initialize Gemini API
let genAI = null;
let model = null;
let chatSession = null;

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are 'Swar AI', a helpful and professional customer support voice bot for a software company.
Your primary tasks are to:
1. Greet users warmly.
2. Answer basic questions about software demos.
3. Help schedule software demos.

CRITICAL RULES TO AVOID HALLUCINATION:
- NEVER invent features, prices, or technical details that are not standard. If asked a specific technical question, politely decline and say an agent will contact them.
- Respond ONLY in a natural mix of Hindi and Telugu (Romanized/English script is preferred so Text-to-Speech can read it easily). 
- Keep responses SHORT, exactly 1 to 2 sentences, since this is for voice audio.
- Do NOT use emojis.
- Do not make up links or phone numbers.
- For example, if they say 'Namaste, naa peru Raju, demo kavali', respond with something like: 'Namaste Raju ji! Sure, meeku software demo schedule chestanu. Meeku eppudu anukulanga untundi?'`
    });
    chatSession = model.startChat({
        history: [],
        generationConfig: {
            temperature: 0.2, // Low temperature to reduce hallucination
        }
    });
}

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    let botReply = '';

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        botReply = "Please paste your real GEMINI_API_KEY in the .env file to enable AI responses. / AI kosam mi real API key ni .env file lo pettandi.";
    } else {
        try {
            const result = await chatSession.sendMessage(userMessage);
            botReply = result.response.text().trim();
        } catch (error) {
            console.error("AI Error:", error);
            botReply = "Kshaminchandi, network error vachindi. / Mujhe samajh nahi aaya, please try again.";
        }
    }

    // Append to log file
    const logEntry = `User: ${req.body.message}\nBot: ${botReply}\n\n`;
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log', err);
        }
    });

    res.json({ reply: botReply });
});

// History API Route
app.get('/api/history', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json({ history: "No conversation history found." });
            }
            console.error('Error reading history', err);
            return res.status(500).json({ error: "Failed to read history" });
        }
        res.json({ history: data });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ WARNING: GEMINI_API_KEY is not set in .env file. AI responses will not work.");
    }
});
