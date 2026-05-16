const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load AI library
let GoogleGenerativeAI;
try {
    GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
    console.error("AI Library Load Error");
}

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

// AI Init
if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        chatSession = model.startChat({ history: [] });
    } catch (err) { console.error("AI Init Error"); }
}

app.post('/api/chat', async (req, res) => {
    if (!chatSession) return res.status(500).json({ error: "AI not ready" });
    try {
        const result = await chatSession.sendMessage(req.body.message || "hi");
        res.json({ reply: result.response.text() });
    } catch (error) { res.status(500).json({ error: "AI Error" }); }
});

app.listen(PORT, () => console.log(`Live on ${PORT}`));
