export class SistaDialogueManager extends EventTarget {
  constructor() {
    super();
    this.bubble = document.getElementById('sista-speech-bubble');
    this.textEl = document.getElementById('sista-speech-text');
    this.currentText = '';
    this.isSpeaking = false;
    this.voiceEnabled = true;
    this.synth = window.speechSynthesis || null;

    this.initControls();
  }

  initControls() {
    document.getElementById('btn-speech-repeat')?.addEventListener('click', () => {
      if (this.currentText) this.speak(this.currentText);
    });

    document.getElementById('btn-speech-stop')?.addEventListener('click', () => {
      this.stop();
    });

    document.getElementById('btn-voice-toggle')?.addEventListener('click', () => {
      this.voiceEnabled = !this.voiceEnabled;
      const btn = document.getElementById('btn-voice-toggle');
      if (btn) btn.textContent = this.voiceEnabled ? 'Voice on' : 'Voice off';
      if (!this.voiceEnabled) this.stop();
    });
  }

  say(eventId, customText = '') {
    const DIALOGUES = {
      'first-arrival': "Welcome to Leola's Instructional Library. Walk up the garden path, and click the glass doors when you are ready to come inside.",
      'approaching-doors': "The glass doors are opening. Step through, and I'll meet you right here at the desk.",
      'welcome-greeting': "Hi there! I'm Sista Lee, your librarian, reader, crochet teacher, and game coach. Let's make your library card, then we'll explore!",
      'returning-visitor': (name) => `Welcome back, ${name}! Your library card and saved progress are right here. What would you like to explore today?`,
      'card-preparing': "I'm stamping your official library membership into the archive. Just a moment...",
      'card-ready': (name) => `Here you are, ${name}! A handcrafted library card, saved on this device. Take your card, and let's explore the shelves, the reading table, and the Game House!`,
      'reading-table-seated': "Take a comfortable seat. I've placed the books before you. Turn the pages gently, and enjoy the craft.",
      'book-selected': (book) => `You chose ${book}. Take your time reading each chapter, or bring it to the reading table.`,
      'arcade-selected': "Welcome to the 3D Game House! Choose any room to practice your stitches and earn mastery badges.",
      'training-selected': "Here are our instructional video lessons. Master each technique at your own steady pace."
    };

    let text = customText;
    if (!text && DIALOGUES[eventId]) {
      text = typeof DIALOGUES[eventId] === 'function' ? DIALOGUES[eventId]() : DIALOGUES[eventId];
    }
    if (text) {
      this.display(text);
      if (this.voiceEnabled) {
        this.speak(text);
      }
    }
  }

  display(text) {
    this.currentText = text;
    if (this.textEl) {
      this.textEl.textContent = text;
    }
    if (this.bubble) {
      this.bubble.hidden = false;
      this.bubble.style.opacity = '1';
    }
  }

  speak(text) {
    if (!this.synth || !this.voiceEnabled) return;
    this.synth.cancel(); // Interrupt prior utterance

    const clean = text.replace(/[*_#✦]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    // Pick female voice if available
    const voices = this.synth.getVoices();
    const femaleVoice = voices.find(v => /female|natural|samantha|zira|karen|victoria/i.test(v.name));
    if (femaleVoice) utterance.voice = femaleVoice;

    this.isSpeaking = true;
    utterance.onend = () => { this.isSpeaking = false; };
    utterance.onerror = () => { this.isSpeaking = false; };
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) this.synth.cancel();
    this.isSpeaking = false;
    if (this.bubble) this.bubble.style.opacity = '0.4';
  }
}
