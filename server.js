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
            systemInstruction: "You are 'Swar AI', a helpful voice bot. Respond in 1-2 short sentences in a mix of Hindi and Telugu (Romanized)."
        });
        chatSession = model.startChat({ history: [] });
        console.log("AI Started");
    } catch (e) { console.error("AI Error:", e); }
}

app.post('/api/chat', async (req, res) => {
    if (!chatSession) return res.status(500).json({ error: "AI not ready" });
    try {
        const result = await chatSession.sendMessage(req.body.message || "hi");
        res.json({ reply: result.response.text().trim() });
    } catch (error) { res.status(500).json({ error: "AI Processing Error" }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
