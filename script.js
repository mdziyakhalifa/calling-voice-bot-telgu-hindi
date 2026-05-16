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

    // Determine the correct API base URL
    // If the file is opened directly (file://), point to localhost:3000
    // Otherwise, use the relative path (works for localhost and ngrok/localtunnel)
    const apiUrl = window.location.protocol === 'file:' 
        ? 'http://localhost:3000/api/chat' 
        : '/api/chat';

    // Initialize Web Speech API for STT
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.lang = 'hi-IN'; // Works great for mixed Hindi and Indian English/Telugu
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isListening = true;
            micWrapper.classList.add('listening');
            micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            statusText.innerText = 'Listening...';
            liveTranscript.innerText = 'Listening...';
            liveTranscript.style.color = 'var(--text-primary)';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (interimTranscript) {
                liveTranscript.innerText = interimTranscript;
            }

            if (finalTranscript) {
                liveTranscript.innerText = finalTranscript;
                handleUserMessage(finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            stopListening();
            statusText.innerText = 'Tap to Speak';
            liveTranscript.innerText = 'Error: ' + event.error;
            liveTranscript.style.color = 'var(--danger)';
        };

        recognition.onend = () => {
            stopListening();
        };

    } else {
        micBtn.disabled = true;
        statusText.innerText = 'Speech Recognition Not Supported';
        systemStatus.innerText = 'Mic Disabled';
        statusIndicator.style.backgroundColor = 'var(--danger)';
        statusIndicator.style.boxShadow = '0 0 10px var(--danger)';
    }

    function toggleListening() {
        if (isListening) {
            recognition.stop();
        } else {
            synthesis.cancel();
            recognition.start();
        }
    }

    function stopListening() {
        isListening = false;
        micWrapper.classList.remove('listening');
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        statusText.innerText = 'Tap to Speak';
        if (liveTranscript.innerText === 'Listening...') {
            liveTranscript.innerText = 'Waiting for voice...';
            liveTranscript.style.color = 'var(--text-secondary)';
        }
    }

    function addMessageToChat(text, sender, autoPlay = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble';
        
        const textP = document.createElement('p');
        textP.innerText = text;
        bubbleDiv.appendChild(textP);

        if (sender === 'bot') {
            const playBtn = document.createElement('button');
            playBtn.className = 'playback-btn';
            playBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Play';
            playBtn.onclick = () => speak(text);
            bubbleDiv.appendChild(playBtn);
        }

        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(bubbleDiv);
        
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (autoPlay && sender === 'bot') {
            speak(text);
        }
    }

    async function handleUserMessage(message) {
        addMessageToChat(message, 'user');
        statusText.innerText = 'AI is thinking...';
        liveTranscript.innerText = 'Waiting for voice...';
        liveTranscript.style.color = 'var(--text-secondary)';
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            statusText.innerText = 'Tap to Speak';
            addMessageToChat(data.reply, 'bot', true);
        } catch (error) {
            console.error('Error fetching response', error);
            statusText.innerText = 'Tap to Speak';
            addMessageToChat('Sorry, I am having trouble connecting to the AI server. Please make sure the server is running.', 'bot', false);
        }
    }

    function speak(text) {
        if (!synthesis) return;
        synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = synthesis.getVoices();
        let selectedVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('te-IN'));
        
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('en-IN'));
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        synthesis.speak(utterance);
    }

    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
            // Pre-load voices
        };
    }

    micBtn.addEventListener('click', toggleListening);
    
    // Sidebar Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const historyContent = document.getElementById('history-content');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items and hide all views
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(view => {
                view.classList.remove('active');
                view.classList.add('hidden');
            });

            // Add active class to clicked nav item
            item.classList.add('active');

            // Show corresponding view and update header
            if (item.id === 'nav-conversation') {
                document.getElementById('view-conversation').classList.remove('hidden');
                document.getElementById('view-conversation').classList.add('active');
                headerTitle.innerText = 'Virtual Assistant';
                headerSubtitle.innerText = 'Hindi & Telugu Supported';
            } 
            else if (item.id === 'nav-history') {
                document.getElementById('view-history').classList.remove('hidden');
                document.getElementById('view-history').classList.add('active');
                headerTitle.innerText = 'Conversation History';
                headerSubtitle.innerText = 'Logs of your past chats';
                
                // Fetch History
                historyContent.innerText = 'Loading history...';
                try {
                    const hUrl = window.location.protocol === 'file:' ? 'http://localhost:3000/api/history' : '/api/history';
                    const res = await fetch(hUrl);
                    if (!res.ok) throw new Error('Failed to fetch history');
                    const hData = await res.json();
                    historyContent.innerText = hData.history || 'No conversation history yet.';
                } catch (err) {
                    historyContent.innerText = 'Error loading history from server.';
                }
            }
            else if (item.id === 'nav-settings') {
                document.getElementById('view-settings').classList.remove('hidden');
                document.getElementById('view-settings').classList.add('active');
                headerTitle.innerText = 'System Settings';
                headerSubtitle.innerText = 'Manage AI Preferences';
            }
        });
    });

    // Clear Chat Logic
    const clearBtn = document.getElementById('clear-chat-btn');
    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            chatContainer.innerHTML = `
                <div class="message bot">
                    <div class="avatar"><i class="fa-solid fa-robot"></i></div>
                    <div class="bubble">
                        <p>Namaste! Nenu me swar assistant ni. Aapko kaise help chahiye?</p>
                    </div>
                </div>
            `;
        });
    }

});
