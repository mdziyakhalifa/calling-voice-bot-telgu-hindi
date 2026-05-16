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

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

let chatSession = null;
app.get('/status', (req, res) => res.json({ ai_ready: !!chatSession }));

const apiKey = process.env.GEMINI_API_KEY;

// SELF-HEALING INITIALIZATION
async function initAI() {
    if (!apiKey || apiKey === 'your_gemini_api_key_here') return;
    
    const genAI = new GoogleGenerativeAI(apiKey);
    // List of models to try in order of preference
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
    
    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            // Test the model with a tiny message
            const test = await model.generateContent("hi");
            if (test.response) {
                chatSession = model.startChat({ history: [] });
                console.log(`SUCCESS! Using model: ${modelName}`);
                return;
            }
        } catch (e) {
            console.warn(`Model ${modelName} failed. Trying next...`);
        }
    }
    console.error("ALL MODELS FAILED. Please check if your API Key is valid at aistudio.google.com");
}

initAI();

app.post('/api/chat', async (req, res) => {
    if (!chatSession) {
        return res.status(500).json({ error: "AI not initialized. This usually means your API Key is invalid or restricted. Try creating a NEW key at aistudio.google.com" });
    }
    try {
        const result = await chatSession.sendMessage(req.body.message || "hi");
        res.json({ reply: result.response.text().trim() });
    } catch (error) {
        res.status(500).json({ error: "AI Error: " + error.message });
    }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
