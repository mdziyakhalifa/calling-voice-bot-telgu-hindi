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

    fetch('/status').then(res => res.json()).then(data => {
        if (data.ai_ready) { systemStatus.innerText = 'AI Online'; statusIndicator.style.backgroundColor = '#10b981'; }
    }).catch(() => { systemStatus.innerText = 'Offline'; });

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.continuous = false;
        recognition.interimResults = true; // THIS ALLOWS REAL-TIME TEXT

        recognition.onstart = () => { isListening = true; micWrapper.classList.add('listening'); micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>'; statusText.innerText = 'Listening...'; };
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                else interimTranscript += event.results[i][0].transcript;
            }
            // Update the screen in REAL-TIME
            if (interimTranscript) liveTranscript.innerText = interimTranscript;
            if (finalTranscript) {
                liveTranscript.innerText = finalTranscript;
                handleUserMessage(finalTranscript);
            }
        };

        recognition.onerror = () => stopListening();
        recognition.onend = () => stopListening();
    }

    function unlockAudio() {
        const ut = new SpeechSynthesisUtterance('');
        ut.volume = 0;
        window.speechSynthesis.speak(ut);
    }

    micBtn.addEventListener('click', () => {
        unlockAudio();
        if (isListening) recognition.stop();
        else recognition.start();
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
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = `<div class="bubble"><p>${text}</p></div>`;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (play && sender === 'bot') speak(text);
    }

    function speak(text) {
        synthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        const voices = synthesis.getVoices();
        ut.voice = voices.find(v => v.lang.includes('hi-IN')) || voices[0];
        synthesis.speak(ut);
    }
});
