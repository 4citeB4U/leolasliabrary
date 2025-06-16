// Original Agent Lee Functionality - COMPLETE RESTORATION
window.speakText = null;
window.agentAutoReadBook = false;
window.agentLeeInstance = null;

// Microsoft Emma Voice Configuration
function setupVoiceSelection() {
  const voices = speechSynthesis.getVoices();
  let selectedVoice = null;

  // Priority order for Microsoft Emma
  const voicePreferences = [
    "Microsoft Emma Online (Natural) - English (United States)",
    "Microsoft Emma - English (United States)", 
    "Emma",
    "Emma (Enhanced)",
    "Microsoft Zira Online (Natural) - English (United States)",
    "Microsoft Zira - English (United States)"
  ];

  // Find the best matching voice
  for (const preference of voicePreferences) {
    selectedVoice = voices.find(voice => voice.name === preference);
    if (selectedVoice) {
      console.log('Selected voice:', selectedVoice.name);
      break;
    }
  }

  // If no exact match, find any Emma voice
  if (!selectedVoice) {
    selectedVoice = voices.find(voice => voice.name.includes('Emma'));
  }

  // Final fallback to any female voice
  if (!selectedVoice) {
    selectedVoice = voices.find(voice => 
      voice.name.includes('female') || 
      voice.name.includes('Zira') ||
      voice.name.includes('Samantha')
    );
  }

  return selectedVoice;
}

// Speech function with Microsoft Emma voice
window.speakText = function(text, callback) {
  try {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = setupVoiceSelection();
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Using voice:', selectedVoice.name);
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    if (callback) {
      utterance.onend = callback;
      utterance.onerror = callback;
    }
    
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech error:', error);
    if (callback) callback();
  }
};

// Section introduction speeches
const sectionIntroductions = {
  home: "Welcome to Leola's Library! I'm Agent Lee, your helpful librarian. This is Sister Leola's personal collection of stories and crochet guides.",
  books: "Here are Sister Leola's wonderful books! We have heartwarming stories and detailed crochet instruction guides. Which one would you like to explore?",
  about: "Hey, let me tell you about Sister Leola! She's a master storyteller and crochet expert who has dedicated her life to sharing knowledge and bringing joy through her crafts and tales.",
  resources: "Here are some helpful resources! You'll find additional learning materials, patterns, and tools to support your reading and crafting journey."
};

// Create the original Agent Lee card
function createOriginalAgentLee() {
  console.log('Creating original Agent Lee card...');
  
  // Remove any existing Agent Lee
  const existing = document.getElementById('agent-lee-card');
  if (existing) {
    existing.remove();
  }
  
  // Create the original card structure
  const agentLeeCard = document.createElement('div');
  agentLeeCard.id = 'agent-lee-card';
  agentLeeCard.className = 'minimized';
  
  agentLeeCard.innerHTML = `
    <button class="minimize-toggle" id="minimize-toggle">+</button>
    
    <!-- Card Header -->
    <div class="card-header" id="drag-handle">
      <div class="avatar">
        <img src="xhabe2hpi5.png" alt="Agent Lee">
      </div>
      <div class="agent-details">
        <h3>Agent Lee</h3>
        <p>Your Helpful Librarian</p>
      </div>
    </div>
    
    <!-- Navigation Grid -->
    <div class="navigation-grid">
      <button id="home-nav-btn" class="nav-button" data-section="home">
        <span>🏠</span>
        Home
      </button>
      <button id="books-nav-btn" class="nav-button" data-section="books">
        <span>📚</span>
        Books
      </button>
      <button id="about-nav-btn" class="nav-button" data-section="about">
        <span>👩‍🏫</span>
        About
      </button>
      <button id="resources-nav-btn" class="nav-button" data-section="resources">
        <span>📋</span>
        Resources
      </button>
    </div>
    
    <!-- Book Controls -->
    <div class="book-control-panel" style="display: none;">
      <div class="book-nav-buttons">
        <button class="book-control-button" id="book-prev-btn">← Previous Page</button>
        <button class="book-control-button" id="book-next-btn">Next Page →</button>
      </div>
      
      <div class="book-read-buttons">
        <button class="book-control-button" id="book-read-page-btn">Read This Page</button>
        <button class="book-control-button" id="book-read-all-btn">Auto-Read Book</button>
        <button class="book-control-button" id="book-stop-btn">Stop Reading</button>
      </div>
    </div>
    
    <!-- Chat Messages -->
    <div class="chat-area">
      <div class="chat-messages" id="chat-messages">
        <div class="empty-message" id="empty-message">
          Ask me a question...
        </div>
      </div>
      
      <textarea 
        class="message-input" 
        id="message-input" 
        rows="1" 
        placeholder="Type your message..."></textarea>
      
      <div class="control-row">
        <button class="control-button send-btn" id="send-button">Send</button>
        <button class="control-button stop-btn" id="stop-speaking">Stop</button>
        <button class="control-button minimize-btn" id="minimize-btn">Minimize</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(agentLeeCard);
  window.agentLeeInstance = agentLeeCard;
  
  // Setup all functionality
  setupOriginalAgentLee(agentLeeCard);
  
  console.log('Original Agent Lee created successfully');
}

// Setup original Agent Lee functionality
function setupOriginalAgentLee(agentLeeCard) {
  // Minimize/Maximize functionality
  const minimizeToggle = document.getElementById('minimize-toggle');
  const minimizeBtn = document.getElementById('minimize-btn');
  
  function toggleMinimize() {
    if (agentLeeCard.classList.contains('minimized')) {
      agentLeeCard.classList.remove('minimized');
      agentLeeCard.classList.add('expanded');
      minimizeToggle.textContent = '−';
    } else {
      agentLeeCard.classList.add('minimized');
      agentLeeCard.classList.remove('expanded');
      minimizeToggle.textContent = '+';
    }
  }
  
  if (minimizeToggle) {
    minimizeToggle.addEventListener('click', toggleMinimize);
  }
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', toggleMinimize);
  }
  
  // Click on minimized card to expand
  agentLeeCard.addEventListener('click', function(e) {
    if (agentLeeCard.classList.contains('minimized') && 
        e.target === agentLeeCard) {
      toggleMinimize();
    }
  });
  
  // Navigation with section introductions
  setupNavigationWithIntroductions(agentLeeCard);
  
  // Book controls
  setupBookControls(agentLeeCard);
  
  // Chat functionality
  setupChatFunctionality(agentLeeCard);
  
  // Stop speaking button
  const stopButton = document.getElementById('stop-speaking');
  if (stopButton) {
    stopButton.addEventListener('click', function() {
      speechSynthesis.cancel();
      window.agentAutoReadBook = false;
      addMessage("I've stopped speaking.", 'agent');
    });
  }
  
  // Show book controls if on a book page
  if (window.pageFlip || document.querySelector('.story-page') || 
      window.location.href.includes('d6jq33mv39.html') || 
      window.location.href.includes('0lbzci75tc.html')) {
    const bookControls = agentLeeCard.querySelector('.book-control-panel');
    if (bookControls) {
      bookControls.style.display = 'block';
    }
  }
  
  // Welcome message with voice
  setTimeout(function() {
    addMessage("Welcome! I'm Agent Lee, your helpful librarian. How can I assist you today?", 'agent');
    window.speakText("Welcome to Leola's Library! I'm Agent Lee, your helpful librarian. How can I assist you today?");
  }, 1500);
}

// Navigation with section introductions
function setupNavigationWithIntroductions(agentLeeCard) {
  const navButtons = agentLeeCard.querySelectorAll('.nav-button');
  
  navButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const section = this.getAttribute('data-section');
      const introduction = sectionIntroductions[section];
      
      // Speak introduction IMMEDIATELY before navigation
      if (introduction) {
        addMessage(introduction, 'agent');
        window.speakText(introduction);
      }
      
      // Navigate after speaking starts
      setTimeout(() => {
        switch(section) {
          case 'home':
            window.location.href = 'index.html';
            break;
          case 'books':
            window.location.href = 'index.html#books';
            break;
          case 'about':
            window.location.href = 'index.html#about';
            break;
          case 'resources':
            window.location.href = 'index.html#resources';
            break;
        }
      }, 100);
    });
  });
}

// Book controls setup
function setupBookControls(agentLeeCard) {
  const prevButton = document.getElementById('book-prev-btn');
  const nextButton = document.getElementById('book-next-btn');
  const readPageButton = document.getElementById('book-read-page-btn');
  const readAllButton = document.getElementById('book-read-all-btn');
  const stopReadingButton = document.getElementById('book-stop-btn');
  
  if (prevButton) {
    prevButton.addEventListener('click', function() {
      if (window.pageFlip) {
        window.pageFlip.flipPrev();
      }
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', function() {
      if (window.pageFlip) {
        window.pageFlip.flipNext();
      }
    });
  }
  
  if (readPageButton) {
    readPageButton.addEventListener('click', function() {
      if (window.speakPageContent) {
        window.speakPageContent();
        addMessage("I'll read this page for you.", 'agent');
      }
    });
  }
  
  if (readAllButton) {
    readAllButton.addEventListener('click', function() {
      if (window.readEntireBook) {
        window.readEntireBook();
        addMessage("I'll read the entire book for you, turning pages as we go.", 'agent');
      }
    });
  }
  
  if (stopReadingButton) {
    stopReadingButton.addEventListener('click', function() {
      speechSynthesis.cancel();
      window.agentAutoReadBook = false;
      addMessage("I've stopped reading the book.", 'agent');
    });
  }
}

// Chat functionality
function setupChatFunctionality(agentLeeCard) {
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
      addMessage(text, 'user');
      messageInput.value = '';
      
      // Simple responses
      setTimeout(() => {
        let response = "I'm here to help you with Sister Leola's library. You can ask me to read books, navigate sections, or tell you more about the collection.";
        
        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
          response = "Hello! It's wonderful to see you in Sister Leola's library. What can I help you explore today?";
        } else if (text.toLowerCase().includes('book')) {
          response = "I'd love to help you with our books! We have beautiful stories and crochet guides. Which would you like to explore?";
        } else if (text.toLowerCase().includes('read')) {
          response = "I can read any of our books to you! Just open a book and I'll be happy to narrate it for you.";
        }
        
        addMessage(response, 'agent');
        window.speakText(response);
      }, 1000);
    }
  }
  
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }
  
  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

// Add message to chat
function addMessage(text, sender) {
  const chatMessages = document.getElementById('chat-messages');
  const emptyMessage = document.getElementById('empty-message');
  
  if (emptyMessage && emptyMessage.style.display !== 'none') {
    emptyMessage.style.display = 'none';
  }
  
  if (chatMessages) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Force Agent Lee to appear everywhere
function forceAgentLeeEverywhere() {
  // Create Agent Lee if it doesn't exist
  if (!document.getElementById('agent-lee-card')) {
    console.log('Force creating Agent Lee...');
    createOriginalAgentLee();
  }
  
  // Make sure Agent Lee is visible
  const agentLee = document.getElementById('agent-lee-card');
  if (agentLee) {
    agentLee.style.display = 'block';
    agentLee.style.visibility = 'visible';
    agentLee.style.position = 'fixed';
    agentLee.style.bottom = '20px';
    agentLee.style.right = '20px';
    agentLee.style.zIndex = '9999';
    console.log('Agent Lee is now visible');
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, creating Agent Lee...');
  
  // Wait for voices to load
  speechSynthesis.addEventListener('voiceschanged', function() {
    setupVoiceSelection();
  });
  
  // Create Agent Lee immediately
  createOriginalAgentLee();
  
  // Force Agent Lee everywhere
  forceAgentLeeEverywhere();
});

// Immediate creation attempt
if (document.readyState === 'loading') {
  // Wait for DOM
} else {
  // DOM already loaded
  createOriginalAgentLee();
  forceAgentLeeEverywhere();
}

// Multiple fallback attempts
setTimeout(forceAgentLeeEverywhere, 1000);
setTimeout(forceAgentLeeEverywhere, 2000);
setTimeout(forceAgentLeeEverywhere, 3000);
setTimeout(forceAgentLeeEverywhere, 5000);

// Check every 2 seconds and recreate if missing
setInterval(function() {
  if (!document.getElementById('agent-lee-card')) {
    console.log('Agent Lee missing, recreating...');
    forceAgentLeeEverywhere();
  }
}, 2000);