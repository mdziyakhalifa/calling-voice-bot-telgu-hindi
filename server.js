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

// Path to public folder
const publicPath = path.join(__dirname, 'public');

// Serve static files (CSS, JS, Images)
app.use(express.static(publicPath));

// Main route to serve the HTML
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: index.html not found in public folder. Please check your GitHub files.");
    }
});

// Health check route
app.get('/status', (req, res) => {
    res.json({ status: "Server is running", time: new Date().toISOString() });
});

// Initialize Gemini AI
let chatSession = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are 'Swar AI', a helpful voice bot. Respond in 1-2 sentences in a mix of Hindi and Telugu (Romanized)."
        });
        chatSession = model.startChat({ history: [] });
    } catch (e) {
        console.error("AI Init Error:", e);
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

app.get('/api/history', (req, res) => {
    res.json({ history: "Cloud storage for history is not configured, but the bot is active!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
