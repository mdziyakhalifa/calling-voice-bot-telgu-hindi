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

function initAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        try {
            genAI = new GoogleGenerativeAI(apiKey);
            model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash", // Changed from 2.5 to 1.5 (stable version)
                systemInstruction: `You are 'Swar AI', a helpful and professional customer support voice bot for a software company.
                Your primary tasks are to greet users, answer basic questions about demos, and schedule them.
                Respond ONLY in a natural mix of Hindi and Telugu (Romanized). Keep responses 1-2 sentences.`
            });
            chatSession = model.startChat({
                history: [],
                generationConfig: { temperature: 0.2 }
            });
            console.log("AI Model initialized successfully.");
        } catch (error) {
            console.error("Failed to initialize AI:", error);
        }
    }
}

initAI();

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    let botReply = '';

    if (!chatSession) {
        botReply = "AI is not initialized. Please check your API key settings.";
    } else {
        try {
            const result = await chatSession.sendMessage(userMessage);
            botReply = result.response.text().trim();
        } catch (error) {
            console.error("AI Error:", error);
            botReply = "Kshaminchandi, network error vachindi. Please try again.";
        }
    }

    // Append to log file (wrapped in try-catch for read-only environments)
    try {
        const logEntry = `User: ${userMessage}\nBot: ${botReply}\n\n`;
        fs.appendFile(logFilePath, logEntry, (err) => {
            if (err) console.warn('Logging skipped: File system is read-only or error occurred.');
        });
    } catch (e) {
        console.warn('Logging failed but continuing...');
    }

    res.json({ reply: botReply });
});

app.get('/api/history', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.json({ history: "No conversation history found or storage is disabled." });
        }
        res.json({ history: data });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
