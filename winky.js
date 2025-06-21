
const micBtn = document.getElementById('voiceCircle');
const statusEl = document.getElementById('status');
const muteBtn = document.getElementById('muteButton');
const exitBtn = document.getElementById('exitButton');
const voiceSelect = document.getElementById('voiceSelect');
const langSelect = document.getElementById('langSelect');

let isRecording = false;
let isMuted = false;
let conversationMemory = [];
const OPENROUTER_API_KEY = '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';

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const synth = window.speechSynthesis;
let voices = [];

function populateVoices() {
  voices = synth.getVoices();
  voiceSelect.innerHTML = '';
  voices.forEach(v => {
    const option = document.createElement('option');
    option.value = v.name;
    option.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(option);
  });
}
populateVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoices;
}

micBtn.addEventListener('click', () => {
  if (isRecording) {
    recognition.stop();
    return;
  }
  recognition.lang = langSelect.value;
  recognition.start();
  isRecording = true;
  micBtn.classList.add('recording');
  statusEl.textContent = 'Listening...';
});

recognition.onresult = async (event) => {
  const userText = event.results[0][0].transcript;
  statusEl.textContent = 'Thinking...';
  recognition.stop();
  conversationMemory.push({ role: 'user', content: userText });

  try {
    const reply = await getAIResponse();
    statusEl.textContent = isMuted ? 'Muted' : 'Speaking...';
    if (!isMuted) speak(reply);
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'AI error';
  }
};

recognition.onerror = (e) => {
  micBtn.classList.remove('recording');
  isRecording = false;
  statusEl.textContent = 'Mic error: ' + e.error;
};

recognition.onend = () => {
  micBtn.classList.remove('recording');
  isRecording = false;
  if (!synth.speaking) statusEl.textContent = 'Ready to talk to Winky';
};

async function getAIResponse() {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-llm-r1:free',
      messages: [
        { role: 'system', content: 'You are Winky, a flirty, Gen-Z voice assistant who replies in a vibey, spicy, short and funny tone using voice only. You remember context.' },
        ...conversationMemory
      ]
    })
  });
  const data = await response.json();
  const reply = data.choices[0]?.message?.content || "Uhhh... Winky blanked 😵";
  conversationMemory.push({ role: 'assistant', content: reply });
  return reply;
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  const selected = voiceSelect.value;
  voices = synth.getVoices();
  utter.voice = voices.find(v => v.name === selected) || voices[0];
  utter.lang = langSelect.value;
  utter.rate = 1; utter.pitch = 1.05; utter.volume = 1;
  synth.speak(utter);
  utter.onend = () => {
    statusEl.textContent = 'Ready to talk to Winky';
  };
}

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
  statusEl.textContent = isMuted ? 'Muted' : 'Ready to talk to Winky';
});

exitBtn.addEventListener('click', () => {
  location.reload();
});
