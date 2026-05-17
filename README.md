<div align="center">

# 🎙️ Swar AI — Hindi + Telugu Voice Bot

**A production-ready, AI-powered multilingual voice assistant for software demo scheduling.**  
Understands and responds in a natural mix of Hindi + Telugu using voice input and voice output.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.1-F55036?style=flat-square)](https://console.groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-10b981?style=flat-square)]()

[Live Demo](https://calling-voice-bot-telgu-hindi.onrender.com/) · [Report Bug](../../issues) · [Request Feature](../../issues)

![Swar AI Screenshot]<img width="1919" height="913" alt="image" src="https://github.com/user-attachments/assets/92c4d005-fc4a-4142-88a7-4169ea181382" />

<img width="1919" height="912" alt="image" src="https://github.com/user-attachments/assets/03072b8b-47fb-421c-bd86-f000d4fa9647" />
<img width="1303" height="880" alt="image" src="https://github.com/user-attachments/assets/d1da8121-fa38-43b6-8b64-bace10ece209" />



</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Conversation Logs](#-conversation-logs)
- [Deployment](#-deployment)
- [How It Works](#-how-it-works)
- [Assignment Criteria](#-assignment-criteria)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Swar AI** is a real-time multilingual voice bot that bridges Hindi and Telugu speakers with software support. Users speak in Hindi, Telugu, or a mix of both — the bot understands, generates a contextual AI response, and replies back in voice.

Built as part of a voice bot assignment, it demonstrates end-to-end STT → AI → TTS pipeline with multi-turn conversation memory, conversation logging, and a polished responsive UI.

### Example Conversation

```
User  : Namaste, naa peru Raju
Bot   : Namaste Raju ji! Meeru ela unnaru, meeku ela help cheyagalanu?

User  : Mujhe ek software demo kavali
Bot   : Sure Raju ji, meekosam demo schedule chestanu. Meeku eppudu anukulanga untundi?

User  : Telugu lo matlaadu
Bot   : Sare, nenu Telugu lo matladutanu. Demo ki meeku oka convenient time cheppagalara?
```

---

## ✨ Features

### Core
- 🎤 **Voice Input (STT)** — Web Speech API captures Hindi + Telugu speech in real time
- 🧠 **AI Response** — Groq LLaMA 3.1 8B generates natural Hindi+Telugu mixed replies
- 🔊 **Voice Output (TTS)** — Browser SpeechSynthesis speaks the bot's response aloud
- 🧵 **Multi-turn Memory** — Bot remembers your name and context across the conversation
- 📝 **Live Transcript** — See your speech converted to text as you speak
- 💬 **Chat UI** — Clean bubble-style conversation view

### Pages / Views
- **Conversation** — Main voice chat interface
- **History** — Browse all past conversations from `chat_logs.txt`
- **Settings** — Configure input language, TTS voice, speech rate, autoplay

### Quality
- 📱 Fully responsive — works on mobile and desktop
- 🌙 Dark theme with animated gradient background
- ⚡ Fast responses (~200–400ms) via Groq inference
- 🔒 No data sent to third parties except Groq API
- 🪵 All conversations logged locally to `chat_logs.txt`

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS | UI, chat view, settings |
| **STT** | Web Speech API (`hi-IN`) | Voice → Text |
| **TTS** | Browser SpeechSynthesis | Text → Voice |
| **Backend** | Node.js + Express | REST API server |
| **AI Model** | Groq — LLaMA 3.1 8B Instant | Response generation |
| **Logging** | `chat_logs.txt` (append-only) | Conversation history |
| **Deployment** | Render / ngrok | Hosting & tunneling |

---

## 📁 Project Structure

```
swar-ai/
├── index.html          # Main frontend — all 3 views (Conversation, History, Settings)
├── style.css           # Responsive dark UI with CSS variables
├── script.js           # STT, TTS, chat logic, navigation, settings persistence
├── server.js           # Express backend — Groq AI, chat API, history API
├── package.json        # Node dependencies
├── chat_logs.txt       # Auto-generated conversation log (gitignored)
├── .env                # API keys (never commit this)
├── .env.example        # Template for environment variables
└── README.md           # This file
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A free [Groq API key](https://console.groq.com) (no billing required)
- A modern browser (Chrome recommended for best Web Speech API support)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/swar-ai.git
cd swar-ai
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
```
Open `.env` and add your Groq API key (see [Environment Variables](#-environment-variables)).

**4. Start the server**
```bash
npm start
```

**5. Open in browser**
```
http://localhost:3001
```

> ⚠️ **Use Chrome or Edge** for best Web Speech API support. Firefox has limited STT support.

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# Groq API Key — get yours free at https://console.groq.com
GROQ_API_KEY=gsk_your_key_here

# Server port (optional, defaults to 3001)
PORT=3001
```

**Getting a Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Go to **API Keys → Create API Key**
4. Copy the key starting with `gsk_...`

> 🔒 Never commit your `.env` file. It is already in `.gitignore`.

---

## 📡 API Reference

### `GET /status`
Returns whether the AI model is initialized and ready.

**Response**
```json
{ "ai_ready": true }
```

---

### `POST /api/chat`
Send a user message and receive an AI response.

**Request Body**
```json
{ "message": "Namaste, naa peru Raju" }
```

**Response**
```json
{ "reply": "Namaste Raju ji! Meeku ela help cheyagalanu?" }
```

**Error Response**
```json
{ "error": "AI not ready — please add your GROQ_API_KEY to environment variables." }
```

---

### `GET /api/history`
Returns the full conversation log as a structured array.

**Response**
```json
{
  "history": [
    { "role": "user", "text": "Namaste, naa peru Raju" },
    { "role": "bot",  "text": "Namaste Raju ji! Meeku ela help cheyagalanu?" }
  ]
}
```

---

### `DELETE /api/history`
Clears all conversation history (both in-memory and log file).

**Response**
```json
{ "success": true }
```

---

## 🪵 Conversation Logs

Every conversation is automatically saved to `chat_logs.txt` in the project root:

```
User: Namaste, naa peru Raju
Bot: Namaste Raju ji! Meeku ela help cheyagalanu?

User: Mujhe ek software demo kavali
Bot: Sure Raju ji, meekosam demo schedule chestanu. Meeku eppudu anukulanga untundi?

User: Telugu lo matlaadu
Bot: Sare, nenu Telugu lo matladutanu. Demo ki meeku convenient time cheppagalara?
```

- Logs are **append-only** — nothing is ever overwritten automatically
- View logs in the app via the **History** tab
- Clear logs via the trash icon in the History view or `DELETE /api/history`
- Add `chat_logs.txt` to `.gitignore` if you don't want to commit user data

---

## ☁️ Deployment

### Deploy to Render (Recommended)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   ```
   GROQ_API_KEY = gsk_your_key_here
   ```
6. Click **Deploy** — your app will be live at `https://your-app.onrender.com`

### Expose Locally with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your server first
npm start

# In a new terminal, expose port 3001
ngrok http 3001
```

Copy the `https://xxxx.ngrok.io` URL — this is your shareable demo link.

---

## 🔍 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  🎤 Mic → Web Speech API (hi-IN)                           │
│         ↓ transcript text                                   │
│  📤 POST /api/chat  ──────────────────────────────────┐    │
│                                                        │    │
│  📥 { reply }  ←──────────────────────────────────────┘    │
│         ↓                                                   │
│  💬 Display in chat bubble                                  │
│         ↓                                                   │
│  🔊 SpeechSynthesis.speak(reply)                           │
└─────────────────────────────────────────────────────────────┘
                           │ POST /api/chat
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE.JS SERVER                           │
│                                                             │
│  1. Add message to conversationHistory[]                    │
│  2. Send [systemPrompt + full history] to Groq             │
│  3. Receive reply from LLaMA 3.1 8B                        │
│  4. Append to chat_logs.txt                                 │
│  5. Return { reply } to browser                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    GROQ     │
                    │ LLaMA 3.1   │
                    │  8B Instant │
                    └─────────────┘
```

### Multi-turn Memory
The server maintains a `conversationHistory` array in memory. Every user message and bot reply is appended before each Groq API call, so the model always has full context of the conversation. The last 10 exchanges (20 messages) are kept to stay within token limits.

---

## 📊 Assignment Criteria

| Criteria | Weight | Status |
|---|---|---|
| Hindi + Telugu mix conversation | 30% | ✅ Natural mix via LLaMA system prompt |
| STT + TTS working | 20% | ✅ Web Speech API + SpeechSynthesis |
| UI & usability | 20% | ✅ Responsive dark UI, 3 views |
| Logs implementation | 15% | ✅ chat_logs.txt + History view |
| Code quality | 15% | ✅ Modular, commented, error-handled |
| **Bonus: Natural language mixing** | ➕ | ✅ Smooth Hindi+Telugu Romanized |
| **Bonus: Better UI design** | ➕ | ✅ Glassmorphism dark theme |
| **Bonus: Smart AI replies** | ➕ | ✅ Groq LLaMA 3.1 |
| **Bonus: Multi-turn memory** | ➕ | ✅ Full history sent per request |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ for the Hindi + Telugu Voice Bot Assignment

**[⬆ Back to Top](#️-swar-ai--hindi--telugu-voice-bot)**

</div>
