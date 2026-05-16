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

    // Relative path works best on Render
    const apiUrl = '/api/chat';

    // Status check to verify API Key
    fetch('/status')
        .then(res => res.json())
        .then(data => {
            if (data.ai_ready) {
                systemStatus.innerText = 'AI Online';
                statusIndicator.style.backgroundColor = '#10b981';
            } else {
                systemStatus.innerText = 'AI Key Missing';
                statusIndicator.style.backgroundColor = '#ef4444';
            }
        }).catch(() => { systemStatus.innerText = 'Server Error'; });

    function unlockSynthesis() {
        const ut = new SpeechSynthesisUtterance('');
        ut.volume = 0;
        window.speechSynthesis.speak(ut);
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.onstart = () => { isListening = true; micWrapper.classList.add('listening'); micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>'; statusText.innerText = 'Listening...'; };
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) transcript += event.results[i][0].transcript; }
            if (transcript) {
                liveTranscript.innerText = transcript;
                handleUserMessage(transcript);
            }
        };
        recognition.onend = () => { isListening = false; micWrapper.classList.remove('listening'); micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; statusText.innerText = 'Tap to Speak'; };
    }

    micBtn.addEventListener('click', () => { unlockSynthesis(); if (isListening) recognition.stop(); else recognition.start(); });

    async function handleUserMessage(msg) {
        addMessage(msg, 'user');
        statusText.innerText = 'Swar is thinking...';
        try {
            const res = await fetch(apiUrl, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ message: msg }) 
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'AI Error');
            addMessage(data.reply, 'bot', true);
            statusText.innerText = 'Tap to Speak';
        } catch (e) { 
            console.error(e);
            addMessage("Error: " + e.message + ". Check Render Env Variables.", 'bot'); 
            statusText.innerText = 'Error'; 
        }
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
