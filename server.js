const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;
const LOG_FILE = path.join(__dirname, 'chat_logs.txt');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── AI Setup ──────────────────────────────────────────────────────────────────
let chatSession = null;

const SYSTEM_PROMPT = `You are 'Swar AI', a warm and professional customer support voice bot for a software company.

YOUR TASKS:
1. Greet users warmly and remember their name if they share it.
2. Answer basic questions about the company's software demos.
3. Help schedule software demos.
4. Handle small talk politely, then redirect to demos.

LANGUAGE RULES (CRITICAL):
- Always respond in a natural MIX of Hindi and Telugu.
- Use Romanized/English script (NOT Devanagari or Telugu script).
- Example: "Namaste Raju ji! Sure, meeku demo schedule chestanu. Meeku eppudu anukulanga untundi?"
- Keep replies SHORT — exactly 1 to 2 sentences max.
- Do NOT use emojis, links, or phone numbers.
- Do NOT invent prices, features, or technical details.
- If the user speaks pure Hindi, mix in some Telugu. If pure Telugu, mix in some Hindi.`;

const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // gemini-pro is DEPRECATED — use gemini-1.5-flash
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: { temperature: 0.3, maxOutputTokens: 150 }
        });
        chatSession = model.startChat({ history: [] });
        console.log('✅ Gemini AI initialized (gemini-1.5-flash)');
    } catch (e) {
        console.error('❌ AI init failed:', e.message);
    }
} else {
    console.warn('⚠️  No GEMINI_API_KEY found. Add it to your .env file.');
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/status', (req, res) => res.json({ ai_ready: !!chatSession }));

app.post('/api/chat', async (req, res) => {
    const userMsg = (req.body.message || '').trim();
    if (!userMsg) return res.status(400).json({ error: 'Empty message' });

    if (!chatSession) {
        return res.status(503).json({ error: 'AI not ready — please add your GEMINI_API_KEY to .env' });
    }

    try {
        const result = await chatSession.sendMessage(userMsg);
        const reply = result.response.text().trim();

        // Append to log file
        const entry = `User: ${userMsg}\nBot: ${reply}\n\n`;
        fs.appendFile(LOG_FILE, entry, 'utf8', (err) => {
            if (err) console.error('Log write error:', err);
        });

        res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error.message);
        res.status(500).json({ error: 'AI Error: ' + error.message });
    }
});

// Return chat history as array of {role, text} objects
app.get('/api/history', (req, res) => {
    if (!fs.existsSync(LOG_FILE)) return res.json({ history: [] });
    try {
        const raw = fs.readFileSync(LOG_FILE, 'utf8').trim();
        if (!raw) return res.json({ history: [] });

        const lines = raw.split('\n');
        const history = [];
        lines.forEach(line => {
            const userMatch = line.match(/^User:\s*(.+)/);
            const botMatch  = line.match(/^Bot:\s*(.+)/);
            if (userMatch) history.push({ role: 'user', text: userMatch[1] });
            if (botMatch)  history.push({ role: 'bot',  text: botMatch[1] });
        });
        res.json({ history });
    } catch (e) {
        res.status(500).json({ error: 'Failed to read history' });
    }
});

// Clear history
app.delete('/api/history', (req, res) => {
    fs.writeFile(LOG_FILE, '', 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to clear history' });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`🚀 Swar AI running at http://localhost:${PORT}`));
