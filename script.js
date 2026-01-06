// Mode switching
        const modeCards = document.querySelectorAll('.mode-card');
        const contentAreas = document.querySelectorAll('.content-area');

        modeCards.forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                
                modeCards.forEach(c => c.classList.remove('active'));
                contentAreas.forEach(ca => ca.classList.remove('active'));
                
                card.classList.add('active');
                document.getElementById(`${mode}-content`).classList.add('active');
            });
        });

        // Text to Speech
        const textInput = document.getElementById('textInput');
        const voiceSelect = document.getElementById('voiceSelect');
        const speakBtn = document.getElementById('speakBtn');
        const stopBtn = document.getElementById('stopBtn');
        const ttsStatus = document.getElementById('ttsStatus');

        let voices = [];
        const synth = window.speechSynthesis;

        function loadVoices() {
            voices = synth.getVoices();
            voiceSelect.innerHTML = '<option value="">Default Voice</option>';
            
            voices.forEach((voice, i) => {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
        }

        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }

        speakBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            
            if (!text) {
                showStatus(ttsStatus, 'Please enter some text first', 'error');
                return;
            }

            synth.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (voiceSelect.value) {
                utterance.voice = voices[voiceSelect.value];
            }

            utterance.onstart = () => {
                speakBtn.disabled = true;
                stopBtn.disabled = false;
                showStatus(ttsStatus, 'Speaking your text...', 'success');
            };

            utterance.onend = () => {
                speakBtn.disabled = false;
                stopBtn.disabled = true;
                showStatus(ttsStatus, 'Finished speaking', 'success');
            };

            utterance.onerror = (e) => {
                speakBtn.disabled = false;
                stopBtn.disabled = true;
                showStatus(ttsStatus, 'Error: ' + e.error, 'error');
            };

            synth.speak(utterance);
        });

        stopBtn.addEventListener('click', () => {
            synth.cancel();
            speakBtn.disabled = false;
            stopBtn.disabled = true;
            showStatus(ttsStatus, 'Speech stopped', 'success');
        });

        // Speech to Text
        const transcriptOutput = document.getElementById('transcriptOutput');
        const recordBtn = document.getElementById('recordBtn');
        const clearBtn = document.getElementById('clearBtn');
        const sttStatus = document.getElementById('sttStatus');

        let recognition;
        let isRecording = false;

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isRecording = true;
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = `
                    <svg class="icon" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                    <span>Stop Recording</span>
                `;
                showStatus(sttStatus, 'Listening to your voice...', 'success');
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    }
                }

                if (finalTranscript) {
                    transcriptOutput.value += finalTranscript;
                }
            };

            recognition.onerror = (event) => {
                showStatus(sttStatus, 'Error: ' + event.error, 'error');
                resetRecordButton();
            };

            recognition.onend = () => {
                if (isRecording) {
                    recognition.start();
                } else {
                    resetRecordButton();
                }
            };

            recordBtn.addEventListener('click', () => {
                if (isRecording) {
                    isRecording = false;
                    recognition.stop();
                    showStatus(sttStatus, 'Recording stopped', 'success');
                } else {
                    recognition.start();
                }
            });
        } else {
            recordBtn.disabled = true;
            showStatus(sttStatus, 'Speech recognition not supported in this browser', 'error');
        }

        clearBtn.addEventListener('click', () => {
            transcriptOutput.value = '';
            showStatus(sttStatus, 'Transcript cleared', 'success');
        });

        function resetRecordButton() {
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = `
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
                <span>Start Recording</span>
            `;
        }

        function showStatus(element, message, type) {
            element.textContent = message;
            element.className = 'status show ' + type;
            setTimeout(() => {
                element.classList.remove('show');
            }, 3000);
        }