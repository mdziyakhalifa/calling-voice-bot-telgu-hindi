document.addEventListener('DOMContentLoaded', () => {
    const micBtn = document.getElementById('mic-btn');
    const micWrapper = document.querySelector('.mic-wrapper');
    const chatContainer = document.getElementById('chat-container');
    const liveTranscript = document.getElementById('live-transcript');
    const statusText = document.getElementById('status-text');
    const systemStatus = document.getElementById('system-status');
    const statusIndicator = document.querySelector('.status-indicator');

    let recognition = null;
    let isListening = false;
    let synthesis = window.speechSynthesis;

    // Status check
    fetch('/status').then(res => res.json()).then(data => {
        if (data.ai_ready) { systemStatus.innerText = 'AI Online'; statusIndicator.style.backgroundColor = '#10b981'; }
    }).catch(() => { systemStatus.innerText = 'Offline'; });

    // Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.interimResults = true;

        recognition.onstart = () => { isListening = true; micWrapper.classList.add('listening'); micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>'; statusText.innerText = 'Listening...'; };
        recognition.onresult = (event) => {
            let interim = ''; let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript;
                else interim += event.results[i][0].transcript;
            }
            if (interim) liveTranscript.innerText = interim;
            if (final) { liveTranscript.innerText = final; handleUserMessage(final); }
        };
        recognition.onend = () => { isListening = false; micWrapper.classList.remove('listening'); micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; statusText.innerText = 'Tap to Speak'; };
    }

    micBtn.addEventListener('click', () => {
        const ut = new SpeechSynthesisUtterance(''); ut.volume = 0; synthesis.speak(ut); // Unlock audio
        if (isListening) recognition.stop(); else recognition.start();
    });

    async function handleUserMessage(msg) {
        addMessage(msg, 'user');
        statusText.innerText = 'Thinking...';
        try {
            const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            addMessage(data.reply, 'bot', true);
            statusText.innerText = 'Tap to Speak';
        } catch (e) { addMessage("Error: " + e.message, 'bot'); statusText.innerText = 'Error'; }
    }

    function addMessage(text, sender, play = false) {
        const div = document.createElement('div'); div.className = `message ${sender}`;
        div.innerHTML = `<div class="avatar"><i class="fa-solid fa-${sender==='bot'?'robot':'user'}"></i></div><div class="bubble"><p>${text}</p></div>`;
        chatContainer.appendChild(div); chatContainer.scrollTop = chatContainer.scrollHeight;
        if (play && sender === 'bot') speak(text);
    }

    function speak(text) {
        synthesis.cancel(); const ut = new SpeechSynthesisUtterance(text);
        const v = synthesis.getVoices(); ut.voice = v.find(v => v.lang.includes('hi-IN')) || v[0];
        synthesis.speak(ut);
    }

    // Sidebar Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            const target = item.innerText.trim().toLowerCase();
            document.getElementById(`view-${target}`).classList.add('active');
            if (sidebar.classList.contains('active')) { sidebar.classList.remove('active'); overlay.classList.remove('active'); }
        });
    });

    // Mobile Menu & Clear Chat
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-nav-overlay');
    document.getElementById('mobile-menu-btn').addEventListener('click', () => { sidebar.classList.add('active'); overlay.classList.add('active'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.add('hidden'); });
    document.getElementById('clear-chat-btn').addEventListener('click', () => { chatContainer.innerHTML = ''; });
});
