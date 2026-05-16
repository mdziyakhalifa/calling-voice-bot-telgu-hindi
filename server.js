const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files from the ROOT directory
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: index.html not found.");
    }
});

// Health check
let chatSession = null;
app.get('/status', (req, res) => {
    res.json({ status: "Server is active", ai_ready: !!chatSession });
});

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are 'Swar AI', a helpful voice bot. Respond in 1-2 sentences in a mix of Hindi and Telugu (Romanized script)."
        });
        chatSession = model.startChat({ history: [] });
    } catch (e) {
        console.error("AI Error:", e);
    }
}

app.post('/api/chat', async (req, res) => {
    if (!chatSession) return res.status(500).json({ error: "AI not initialized" });
    try {
        const result = await chatSession.sendMessage(req.body.message);
        res.json({ reply: result.response.text().trim() });
    } catch (error) {
        res.status(500).json({ error: "AI Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
