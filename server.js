const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the ROOT directory
app.use(express.static(__dirname));

// Main route to serve the HTML
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: index.html not found in root. Make sure it is uploaded to GitHub.");
    }
});

// Health check route - visit your-url.onrender.com/status to verify
app.get('/status', (req, res) => {
    res.json({ 
        status: "Server is active", 
        ai_initialized: !!chatSession,
        time: new Date().toISOString() 
    });
});

// Initialize Gemini AI
let chatSession = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are 'Swar AI', a helpful voice bot for a software company. Respond only in 1-2 sentences using a natural mix of Hindi and Telugu (Romanized script)."
        });
        chatSession = model.startChat({ history: [] });
        console.log("AI initialized successfully.");
    } catch (e) {
        console.error("AI Initialization Error:", e);
    }
} else {
    console.warn("WARNING: GEMINI_API_KEY is missing or invalid.");
}

app.post('/api/chat', async (req, res) => {
    if (!chatSession) {
        return res.status(500).json({ error: "AI not initialized. Please set GEMINI_API_KEY in Render Environment Variables." });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
        const result = await chatSession.sendMessage(message);
        const botReply = result.response.text().trim();
        res.json({ reply: botReply });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to get AI response. Check API quota or key validity." });
    }
});

// History endpoint (basic log reading)
app.get('/api/history', (req, res) => {
    const logPath = path.join(__dirname, 'chat_logs.txt');
    if (fs.existsSync(logPath)) {
        fs.readFile(logPath, 'utf8', (err, data) => {
            if (err) return res.json({ history: "Error reading history." });
            res.json({ history: data });
        });
    } else {
        res.json({ history: "No conversation history found." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
