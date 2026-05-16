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

    // Correct API URL for Render
    const apiUrl = window.location.protocol === 'file:' 
        ? 'http://localhost:3001/api/chat' 
        : '/api/chat';

    // Verify server status on load
    fetch(window.location.protocol === 'file:' ? 'http://localhost:3001/status' : '/status')
        .then(res => res.json())
        .then(data => {
            console.log("Server Status:", data);
            if (data.ai_initialized) {
                systemStatus.innerText = 'AI Online';
                statusIndicator.style.backgroundColor = 'var(--success)';
            } else {
                systemStatus.innerText = 'AI Key Missing';
                statusIndicator.style.backgroundColor = 'var(--danger)';
            }
        })
        .catch(err => {
            console.error("Server check failed:", err);
            systemStatus.innerText = 'Server Offline';
        });

    // "Unlock" speech synthesis for mobile
    let synthesisUnlocked = false;
    function unlockSynthesis() {
        if (synthesisUnlocked) return;
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
        synthesisUnlocked = true;
    }

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN'; 
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isListening = true;
            micWrapper.classList.add('listening');
            micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            statusText.innerText = 'Listening...';
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript) {
                liveTranscript.innerText = finalTranscript;
                handleUserMessage(finalTranscript);
            }
        };

        recognition.onerror = () => stopListening();
        recognition.onend = () => stopListening();
    }

    function toggleListening() {
        unlockSynthesis();
        if (isListening) recognition.stop();
        else recognition.start();
    }

    function stopListening() {
        isListening = false;
        micWrapper.classList.remove('listening');
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        statusText.innerText = 'Tap to Speak';
    }

    async function handleUserMessage(message) {
        addMessageToChat(message, 'user');
        statusText.innerText = 'Swar is thinking...';
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Server processing error');
            }
            
            statusText.innerText = 'Tap to Speak';
            addMessageToChat(data.reply, 'bot', true);
        } catch (error) {
            console.error('Fetch Error:', error);
            addMessageToChat('Error: ' + error.message, 'bot', false);
            statusText.innerText = 'Error';
        }
    }

    function addMessageToChat(text, sender, autoPlay = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = `<p>${text}</p>`;
        
        if (sender === 'bot') {
            const btn = document.createElement('button');
            btn.className = 'playback-btn';
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Play';
            btn.onclick = () => speak(text);
            bubble.appendChild(btn);
        }
        
        msgDiv.appendChild(bubble);
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (autoPlay && sender === 'bot') speak(text);
    }

    function speak(text) {
        synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synthesis.getVoices();
        let voice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('te-IN')) || voices.find(v => v.lang.includes('en-IN'));
        if (voice) utterance.voice = voice;
        synthesis.speak(utterance);
    }

    micBtn.addEventListener('click', toggleListening);

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-nav-overlay');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }
});
