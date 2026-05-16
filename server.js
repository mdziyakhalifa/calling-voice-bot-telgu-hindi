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
app.get('/status', (req, res) => res.json({ ai_ready: !!chatSession }));

const apiKey = process.env.GEMINI_API_KEY;
async function initAI() {
    if (!apiKey || apiKey === 'your_gemini_api_key_here') return;
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // We use gemini-1.5-flash as it's the best free model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        chatSession = model.startChat({ history: [] });
        console.log("AI Ready");
    } catch (e) { console.error("AI Init Error:", e); }
}
initAI();

app.post('/api/chat', async (req, res) => {
    if (!chatSession) return res.status(500).json({ error: "AI not ready. Check Render API Key." });
    try {
        const result = await chatSession.sendMessage(req.body.message || "hi");
        res.json({ reply: result.response.text().trim() });
    } catch (error) {
        res.status(500).json({ error: "AI Error: " + error.message });
    }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
