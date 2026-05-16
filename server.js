const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Attempt to load AI library safely
let GoogleGenerativeAI;
try {
    GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
    console.error("Critical: Could not load @google/generative-ai package.");
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files from the ROOT directory
app.use(express.static(__dirname));

// Root route
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: index.html not found. Check GitHub files.");
    }
});

// Initialize AI globally
let chatSession = null;

// Health check
app.get('/status', (req, res) => {
    res.json({ 
        status: "Server is running", 
        ai_ready: !!chatSession,
        port: PORT
    });
});

// AI Initialization Logic
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && GoogleGenerativeAI) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are 'Swar AI', a helpful voice bot. Respond in 1-2 sentences in a Hindi/Telugu mix."
        });
        chatSession = model.startChat({ history: [] });
        console.log("AI initialized successfully.");
    } catch (err) {
        console.error("AI Initialization Failed:", err.message);
    }
}

app.post('/api/chat', async (req, res) => {
    if (!chatSession) {
        return res.status(500).json({ error: "AI is not ready. Check API key on Render." });
    }
    try {
        const result = await chatSession.sendMessage(req.body.message || "hello");
        const reply = result.response.text().trim();
        res.json({ reply: reply });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: "AI failed to respond." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is live on port ${PORT}`);
});
