document.addEventListener('DOMContentLoaded', () => {

    // ── Element refs ──────────────────────────────────────────────────────────
    const micBtn          = document.getElementById('mic-btn');
    const micWrapper      = document.querySelector('.mic-wrapper');
    const chatContainer   = document.getElementById('chat-container');
    const liveTranscript  = document.getElementById('live-transcript');
    const statusText      = document.getElementById('status-text');
    const systemStatus    = document.getElementById('system-status');
    const statusDot       = document.getElementById('status-dot');
    const historyContainer = document.getElementById('history-container');

    // ── Settings (with localStorage persistence) ──────────────────────────────
    const SETTINGS_KEY = 'swar_settings';
    let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || {
        lang: 'hi-IN',
        continuous: false,
        ttsLang: 'hi-IN',
        autoplay: true,
        rate: 1.0
    };

    function applySettingsToUI() {
        document.getElementById('setting-lang').value       = settings.lang;
        document.getElementById('setting-continuous').checked = settings.continuous;
        document.getElementById('setting-tts-lang').value  = settings.ttsLang;
        document.getElementById('setting-autoplay').checked = settings.autoplay;
        document.getElementById('setting-rate').value       = settings.rate;
        document.getElementById('rate-label').textContent  = settings.rate + '×';
    }
    applySettingsToUI();

    document.getElementById('setting-rate').addEventListener('input', (e) => {
        document.getElementById('rate-label').textContent = parseFloat(e.target.value).toFixed(1) + '×';
    });

    document.getElementById('save-settings-btn').addEventListener('click', () => {
        settings.lang       = document.getElementById('setting-lang').value;
        settings.continuous = document.getElementById('setting-continuous').checked;
        settings.ttsLang    = document.getElementById('setting-tts-lang').value;
        settings.autoplay   = document.getElementById('setting-autoplay').checked;
        settings.rate       = parseFloat(document.getElementById('setting-rate').value);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        if (recognition) recognition.lang = settings.lang;
        showToast('Settings saved!');
    });

    // ── Status check ──────────────────────────────────────────────────────────
    fetch('/status')
        .then(r => r.json())
        .then(d => {
            if (d.ai_ready) {
                systemStatus.textContent = 'AI Online';
                statusDot.style.backgroundColor = '#10b981';
            } else {
                systemStatus.textContent = 'AI Offline';
                statusDot.style.backgroundColor = '#ef4444';
            }
        })
        .catch(() => {
            systemStatus.textContent = 'Offline';
            statusDot.style.backgroundColor = '#ef4444';
        });

    // ── Speech Recognition ────────────────────────────────────────────────────
    let recognition  = null;
    let isListening  = false;
    const synthesis  = window.speechSynthesis;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR();
        recognition.lang           = settings.lang;
        recognition.interimResults = true;
        recognition.continuous     = false;

        recognition.onstart = () => {
            isListening = true;
            micWrapper.classList.add('listening');
            micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            statusText.textContent = 'Listening...';
            liveTranscript.textContent = '';
        };

        recognition.onresult = (event) => {
            let interim = '', final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += t;
                else interim += t;
            }
            liveTranscript.textContent = interim || final || '';
            if (final.trim()) handleUserMessage(final.trim());
        };

        recognition.onerror = (e) => {
            console.error('Speech error:', e.error);
            statusText.textContent = e.error === 'no-speech' ? 'No speech detected' : 'Mic error: ' + e.error;
            stopListening();
        };

        recognition.onend = () => stopListening();
    } else {
        statusText.textContent = 'Speech not supported in this browser';
        micBtn.disabled = true;
    }

    function stopListening() {
        isListening = false;
        micWrapper.classList.remove('listening');
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        statusText.textContent = 'Tap to Speak';
    }

    micBtn.addEventListener('click', () => {
        if (!recognition) return;
        // Unlock audio context on iOS/Safari
        const unlock = new SpeechSynthesisUtterance('');
        synthesis.speak(unlock);
        if (isListening) {
            recognition.stop();
        } else {
            recognition.lang = settings.lang;
            try { recognition.start(); } catch(e) { console.warn(e); }
        }
    });

    // ── Chat logic ────────────────────────────────────────────────────────────
    async function handleUserMessage(msg) {
        addMessage(msg, 'user');
        liveTranscript.textContent = msg;
        statusText.textContent = 'Thinking...';

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');
            addMessage(data.reply, 'bot', settings.autoplay);
        } catch (e) {
            addMessage('Error: ' + e.message, 'bot', false);
        } finally {
            statusText.textContent = 'Tap to Speak';
        }
    }

    function addMessage(text, sender, play = false) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        const icon = sender === 'bot' ? 'robot' : 'user';
        div.innerHTML = `
            <div class="avatar"><i class="fa-solid fa-${icon}"></i></div>
            <div class="bubble"><p>${escapeHTML(text)}</p></div>`;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (play && sender === 'bot') speak(text);
    }

    function speak(text) {
        synthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.rate = settings.rate;
        const voices = synthesis.getVoices();
        ut.voice = voices.find(v => v.lang.startsWith(settings.ttsLang.split('-')[0])) || voices[0] || null;
        synthesis.speak(ut);
    }

    function escapeHTML(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // Clear chat
    document.getElementById('clear-chat-btn').addEventListener('click', () => {
        chatContainer.innerHTML = '';
        addMessage('Namaste! Main Swar AI hoon. Aapko kaise help kar sakta hoon?', 'bot', false);
    });

    // ── Navigation ────────────────────────────────────────────────────────────
    const navItems  = document.querySelectorAll('.nav-item');
    const sections  = document.querySelectorAll('.view-section');
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('mobile-nav-overlay');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`view-${view}`).classList.add('active');
            if (view === 'history') loadHistory();
            // Close sidebar on mobile
            closeMobileSidebar();
        });
    });

    // Mobile sidebar toggle
    function openMobileSidebar() {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
    }
    function closeMobileSidebar() {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    }

    ['mobile-menu-btn','mobile-menu-btn-h','mobile-menu-btn-s'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => {
            sidebar.classList.contains('open') ? closeMobileSidebar() : openMobileSidebar();
        });
    });
    overlay.addEventListener('click', closeMobileSidebar);

    // ── History view ──────────────────────────────────────────────────────────
    async function loadHistory() {
        historyContainer.innerHTML = '<div class="history-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading...</p></div>';
        try {
            const res  = await fetch('/api/history');
            const data = await res.json();
            if (!data.history || data.history.length === 0) {
                historyContainer.innerHTML = '<div class="history-empty"><i class="fa-solid fa-clock-rotate-left"></i><p>No history yet. Start a conversation!</p></div>';
                return;
            }
            historyContainer.innerHTML = '';
            data.history.forEach(entry => {
                const div = document.createElement('div');
                div.className = `history-message ${entry.role}`;
                div.innerHTML = `
                    <div class="history-role">${entry.role === 'user' ? '<i class="fa-solid fa-user"></i> You' : '<i class="fa-solid fa-robot"></i> Swar AI'}</div>
                    <div class="history-text">${escapeHTML(entry.text)}</div>`;
                historyContainer.appendChild(div);
            });
            historyContainer.scrollTop = historyContainer.scrollHeight;
        } catch(e) {
            historyContainer.innerHTML = '<div class="history-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Failed to load history</p></div>';
        }
    }

    document.getElementById('refresh-history-btn').addEventListener('click', loadHistory);

    document.getElementById('clear-history-btn').addEventListener('click', async () => {
        if (!confirm('Clear all conversation history?')) return;
        try {
            await fetch('/api/history', { method: 'DELETE' });
            historyContainer.innerHTML = '<div class="history-empty"><i class="fa-solid fa-clock-rotate-left"></i><p>History cleared.</p></div>';
            showToast('History cleared');
        } catch(e) {
            showToast('Failed to clear history');
        }
    });

    // ── Toast ─────────────────────────────────────────────────────────────────
    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
    }

    // Load voices asynchronously (required in some browsers)
    if (synthesis.onvoiceschanged !== undefined) synthesis.onvoiceschanged = () => {};
});
