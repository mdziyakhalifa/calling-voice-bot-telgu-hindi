const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;
const LOG_FILE = path.join(__dirname, 'chat_logs.txt');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── AI Setup ──────────────────────────────────────────────────────────────────
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

const groqApiKey = process.env.GROQ_API_KEY;
let groq = null;

if (groqApiKey && groqApiKey !== 'your_groq_api_key_here') {
    try {
        groq = new Groq({ apiKey: groqApiKey });
        console.log('✅ Groq AI initialized (llama-3.1-8b-instant)');
    } catch (e) {
        console.error('❌ Groq init failed:', e.message);
    }
} else {
    console.warn('⚠️  No GROQ_API_KEY found. Add it to your .env file or Render environment variables.');
}

// ── In-memory conversation history (multi-turn memory) ────────────────────────
// Stores last 10 exchanges per session to avoid token overflow
const conversationHistory = [];
const MAX_HISTORY = 10;

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/status', (req, res) => res.json({ ai_ready: !!groq }));

app.post('/api/chat', async (req, res) => {
    const userMsg = (req.body.message || '').trim();
    if (!userMsg) return res.status(400).json({ error: 'Empty message' });

    if (!groq) {
        return res.status(503).json({ error: 'AI not ready — please add your GROQ_API_KEY to environment variables.' });
    }

    try {
        // Add user message to history
        conversationHistory.push({ role: 'user', content: userMsg });

        // Keep only last MAX_HISTORY messages to avoid token overflow
        if (conversationHistory.length > MAX_HISTORY * 2) {
            conversationHistory.splice(0, 2);
        }

        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...conversationHistory          // full history for memory
            ],
            max_tokens: 150,
            temperature: 0.3
        });

        const reply = completion.choices[0].message.content.trim();

        // Add bot reply to history
        conversationHistory.push({ role: 'assistant', content: reply });

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
    conversationHistory.length = 0; // also clear in-memory history
    fs.writeFile(LOG_FILE, '', 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to clear history' });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`🚀 Swar AI running at http://localhost:${PORT}`));
