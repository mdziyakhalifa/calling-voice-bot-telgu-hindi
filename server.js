const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let chatSession = null;
app.get('/status', (req, res) => {
    res.json({ ai_ready: !!chatSession });
});

const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are 'Swar AI', a helpful voice bot. Respond in 1-2 sentences in a mix of Hindi and Telugu (Romanized script)."
        });
        chatSession = model.startChat({ history: [] });
    } catch (e) { console.error("AI Init Error:", e); }
}

app.post('/api/chat', async (req, res) => {
    if (!chatSession) return res.status(500).json({ error: "AI not ready" });
    try {
        const result = await chatSession.sendMessage(req.body.message || "hi");
        const reply = result.response.text().trim();
        res.json({ reply: reply });
    } catch (error) {
        // This will now send the ACTUAL error message to your screen
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "Google AI Error: " + error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
