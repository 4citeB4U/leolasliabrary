/*
🧠 Agent Lee Master Prompt — Leola's Library Edition

This file contains the primary configuration and behavior rules for Agent Lee,
the AI assistant for Leola's Library. It defines how Agent Lee should respond,
handle book narration, manage donations, and behave across devices.

ROLE & ENVIRONMENT
------------------
Agent Lee is the resident AI librarian and assistant inside Leola's Library,
embedded in a 100% front-end-only HTML application with no server/backend.

Tools and Responsibilities:
- Reading interactive books aloud with proper voice
- Managing donations via Stripe
- Supporting embedded YouTube video learning
- Guiding users with emotional, conversational narration
- Storing memory of book progress and discussion readiness
- Responding intelligently in both desktop and mobile modes

STRUCTURE FOR ALL ACTIONS
-------------------------
Each user request follows a layered structure in code:

A. USER INTENT
B. AGENT TASK LAYERS (JSON)
C. UI RULES
D. SPEECH RULES

SYSTEM BEHAVIOR CHECKLIST
-------------------------
✅ Minimization Logic - Agent Lee continues narrating while minimized
✅ Single Card Only - No duplicates of the assistant UI on screen
✅ Mobile vs Desktop - Experience matches across all screen sizes
✅ Narration Timing - Each page turn aligns with finished voice narration
✅ Donation Button - Launches Stripe checkout URL directly in-window
✅ YouTube Embeds - Embedded properly with allowfullscreen
✅ Agent Lee Memory - Stored in localStorage for continuity

SELF-REFLECTIVE INTELLIGENCE LOOP
--------------------------------
After any full book or donation action, Agent Lee should:
- Propose continuing learning
- Solve by adding relevant content
- Verify user satisfaction
- Persist learning path
- Elevate with recommendations
*/

// Agent Lee Configuration
window.AGENT_LEE_CONFIG = {
  preferredVoiceName: "Emma", // Enforce Emma voice
  voiceFallbacks: [
    "Microsoft Emma Online (Natural) - English (United States)",
    "Microsoft Emma - English (United States)",
    "Emma",
    "Emma (Enhanced)"
  ],
  narrationSpeed: 1.0,
  strictlyFemaleVoiceOnly: true,
  // Additional voice preferences
  blockedVoices: [
    "Microsoft David", 
    "Microsoft Mark",
    "Microsoft David Desktop",
    "Google US English",
    "Daniel",
    "Alex",
    "Google UK English Male"
  ],
  femaleVoicePreferences: [
    "Microsoft Emma",
    "Emma",
    "Microsoft Zira",
    "Google US English Female",
    "Google UK English Female",
    "Samantha",
    "Victoria"
  ]
}
const AGENT_LEE_CONFIG = {
  // Basic settings
  preferredVoiceName: "Emma",  // Target a female voice with this name if available
  femaleVoiceOnly: true,       // Only use female voices, never fall back to male/neutral
  donationUrl: "https://buy.stripe.com/7sI0282DR9075u87sw",
  
  // Book IDs and their full names
  books: {
    "needle-and-yarn": "Needle & Yarn: A Love Stitched in Time",
    "crochet-mastery": "Crochet Mastery: A Complete Guide"
  },
  
  // Tools implementation mappings to actual functions
  tools: {
    READ_BOOK: function(bookId) {
      // Implemented in startAutoReadingBook function
      window.agentAutoReadBook = true;
      if (window.speakPageContent) {
        window.speakPageContent();
      }
      return true;
    },
    
    TOGGLE_AGENT_CARD: function(state) {
      const agentLeeCard = document.getElementById('agent-lee-card');
      if (!agentLeeCard) return false;
      
      if (state === "minimized") {
        agentLeeCard.classList.add('minimized');
        agentLeeCard.classList.remove('expanded');
        const minimizeToggle = document.getElementById('minimize-toggle');
        if (minimizeToggle) minimizeToggle.textContent = '+';
      } else if (state === "expanded") {
        agentLeeCard.classList.remove('minimized');
        agentLeeCard.classList.add('expanded');
        const minimizeToggle = document.getElementById('minimize-toggle');
        if (minimizeToggle) minimizeToggle.textContent = '−';
      }
      return true;
    },
    
    TRACK_BOOK_PROGRESS: function(bookId) {
      // Initialize if not exists
      let readBooks = JSON.parse(localStorage.getItem('readBooks') || '[]');
      if (!readBooks.includes(bookId)) {
        readBooks.push(bookId);
      }
      localStorage.setItem('readBooks', JSON.stringify(readBooks));
      localStorage.setItem('lastReadBook', bookId);
      return true;
    },
    
    START_DISCUSSION: function(bookId) {
      localStorage.setItem('lastDiscussion', bookId);
      // Discussion content handled in processUserMessage based on the book
      return true;
    },
    
    EMBED_YOUTUBE: function(videoId, targetSelector) {
      const target = document.querySelector(targetSelector);
      if (!target) return false;
      
      target.innerHTML = `
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube.com/embed/${videoId}" 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
      return true;
    },
    
    STRIPE_DONATE: function() {
      window.open(AGENT_LEE_CONFIG.donationUrl, '_blank');
      return true;
    },
    
    RESPONSIVE_LAYOUT: function() {
      // This is handled by CSS, but we can verify proper layout here
      const isMobile = window.innerWidth <= 576;
      const agentLeeCard = document.getElementById('agent-lee-card');
      
      if (isMobile) {
        agentLeeCard.style.width = "90%";
        agentLeeCard.style.right = "5%";
        agentLeeCard.style.left = "5%";
      } else {
        agentLeeCard.style.width = "280px";
        agentLeeCard.style.right = "20px";
        agentLeeCard.style.left = "auto";
      }
      return true;
    },
    
    VOICE_ENGINE: function(femaleOnly = true) {
      const voices = window.speechSynthesis.getVoices();
      
      // First try to find the preferred voice by name
      let foundVoice = voices.find(v => 
        v.name.includes(AGENT_LEE_CONFIG.preferredVoiceName) && 
        v.lang.includes('en')
      );
      
      // If not found and female only, look for female voices
      if (!foundVoice && femaleOnly) {
        foundVoice = voices.find(v => 
          v.lang.includes('en') && 
          (v.name.toLowerCase().includes('female') || 
           v.name.toLowerCase().includes('samantha') || 
           v.name.toLowerCase().includes('karen'))
        );
      }
      
      // If found, save it to localStorage for consistency
      if (foundVoice) {
        localStorage.setItem('preferred-voice-name', foundVoice.name);
      }
      
      return !!foundVoice;
    }
  },
  
  // Execute a plan of actions
  executePlan: function(plan) {
    if (!Array.isArray(plan)) {
      console.error("Invalid plan format, must be an array");
      return false;
    }
    
    for (const step of plan) {
      const action = this.tools[step.action];
      if (typeof action === 'function') {
        action(step.args);
      }
    }
    return true;
  },
  
  // Process user intent to create and execute a plan
  processIntent: function(intent) {
    // This would be implemented with natural language processing
    // For now, we'll have some hard-coded mappings
    if (intent.toLowerCase().includes('read') && 
        (intent.toLowerCase().includes('needle') || 
         intent.toLowerCase().includes('yarn'))) {
      
      return this.executePlan([
        {
          action: "READ_BOOK",
          args: { bookId: "needle-and-yarn" }
        },
        {
          action: "TRACK_BOOK_PROGRESS",
          args: { bookId: "needle-and-yarn" }
        }
      ]);
    }
    
    if (intent.toLowerCase().includes('read') && 
        intent.toLowerCase().includes('crochet')) {
      
      return this.executePlan([
        {
          action: "READ_BOOK",
          args: { bookId: "crochet-mastery" }
        },
        {
          action: "TRACK_BOOK_PROGRESS",
          args: { bookId: "crochet-mastery" }
        }
      ]);
    }
    
    if (intent.toLowerCase().includes('donate')) {
      return this.executePlan([
        {
          action: "STRIPE_DONATE",
          args: { url: this.donationUrl }
        }
      ]);
    }
    
    // Default behavior if no specific intent is matched
    return false;
  }
};

// Export for use in other files
window.AGENT_LEE_CONFIG = AGENT_LEE_CONFIG;