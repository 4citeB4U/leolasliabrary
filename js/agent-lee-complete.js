// COMPLETE AGENT LEE FUNCTIONALITY - FULL RESTORATION
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
    console.log('speakText called with:', text.substring(0, 50) + '...');
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Small delay to ensure cancellation is complete
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = setupVoiceSelection();
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Using voice:', selectedVoice.name);
      } else {
        console.log('No specific voice found, using default');
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = function() {
        console.log('Speech started');
      };
      
      utterance.onend = function() {
        console.log('Speech ended');
        if (callback) callback();
      };
      
      utterance.onerror = function(event) {
        console.error('Speech error:', event);
        if (callback) callback();
      };
      
      console.log('Starting speech synthesis...');
      speechSynthesis.speak(utterance);
      
      // Double-check that speech started
      setTimeout(() => {
        if (speechSynthesis.speaking) {
          console.log('Speech confirmed to be playing');
        } else {
          console.error('Speech did not start properly');
        }
      }, 500);
      
    }, 100);
    
  } catch (error) {
    console.error('Speech error:', error);
    if (callback) callback();
  }
};

// COMPLETE DETAILED SECTION INTRODUCTIONS
const sectionIntroductions = {
  home: "Welcome to Leola's Library! I'm Agent Lee, your helpful librarian. This is Sister Leola's personal collection of interactive stories, crochet instruction books, and educational resources. Here you'll find heartwarming tales, detailed crafting guides, and fun games that bring the joy of reading and crochet together. Use the navigation buttons to explore different sections, or ask me questions about Sister Leola's work. I can also read books aloud for you while automatically turning pages!",
  
  books: "Welcome to our interactive book collection! Sister Leola has created beautiful flip books that you can read page by page. We have 'Needle & Yarn: A Love Stitched in Time' - a heartwarming story about the connection between crafting and family bonds. We also have 'Crochet Mastery: A Complete Guide' - a detailed instruction book with step-by-step tutorials for beginners to advanced crocheters. Click on any book cover to start reading, and I'll be there to help you navigate and read aloud if you'd like!",
  
  games: "Welcome to our interactive crochet games! These fun activities complement our books and help you practice your crochet skills. Try the 'Crochet Pattern Matcher' where you match different stitch patterns, or the 'Yarn Color Coordinator' to explore beautiful color combinations for your projects. Each game is designed to enhance your understanding of concepts covered in Sister Leola's books. Have fun while learning, and let me know if you need any help with the game instructions!",
  
  about: "Let me tell you about Sister Leola Lee! She's a master storyteller and crochet expert who has dedicated over 40 years to the craft of crochet and the art of storytelling. Born and raised in Milwaukee, Sister Leola learned crochet from her grandmother at the age of eight and has been creating beautiful pieces ever since. She founded this digital library to share her knowledge with crocheters of all skill levels and to preserve the traditional techniques while embracing modern approaches. Her passion for teaching has helped thousands of people discover the joy and therapeutic benefits of crochet.",
  
  resources: "Here you'll find Sister Leola's carefully curated collection of crochet resources! Browse through recommended yarns for different projects, explore specialized hooks for various techniques, and discover the best online communities for crochet enthusiasts. We also have printable stitch charts, gauge measurement guides, and yarn substitution tables. These resources are designed to complement the books and help you on your crochet journey. If you're looking for something specific, just ask me and I'll point you in the right direction!",
  
  tutorials: "Welcome to our comprehensive tutorial section! Sister Leola has created step-by-step video tutorials for all skill levels, from basic chain stitches to advanced lace techniques. Each tutorial corresponds to sections in her books, allowing you to see the techniques in action. We also have a Frequently Asked Questions section covering common crochet problems and their solutions. Browse through the categories or ask me about a specific technique you'd like to learn, and I'll find the perfect tutorial for you!",
  
  contact: "Here's how you can connect with Sister Leola! You can reach her by phone at (414) 210-4029, or visit her studio in Milwaukee, Wisconsin. Sister Leola loves hearing from fellow crochet enthusiasts and readers. Whether you have questions about her books, need help with a crochet technique, or want to share your own projects inspired by her work, she'd be delighted to hear from you. For workshop bookings and speaking engagements, please provide details about your event when you reach out.",
  
  donations: "Thank you for considering supporting Sister Leola's Library! Your generous donations help maintain this digital library and fund the creation of new books, tutorials, and interactive features. All contributions directly support Sister Leola's mission to make crochet instruction accessible to everyone. Donations at the Platinum Yarn level or higher receive special acknowledgment in upcoming publications and early access to new content. Every contribution, no matter the size, makes a difference and is deeply appreciated by Sister Leola and the entire community!"
};

// Create the Agent Lee card with image
function createAgentLeeCard() {
  console.log('Creating comprehensive Agent Lee card...');
  
  // Remove any existing Agent Lee
  const existing = document.getElementById('agent-lee-card');
  if (existing) {
    existing.remove();
  }
  
  // Create the card structure
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
        <span class="button-text">Home</span>
      </button>
      <button id="books-nav-btn" class="nav-button" data-section="books">
        <span>📚</span>
        <span class="button-text">Books</span>
      </button>
      <button id="games-nav-btn" class="nav-button" data-section="games">
        <span>🎮</span>
        <span class="button-text">Games</span>
      </button>
      <button id="about-nav-btn" class="nav-button" data-section="about">
        <span>👩‍🏫</span>
        <span class="button-text">About</span>
      </button>
      <button id="resources-nav-btn" class="nav-button" data-section="resources">
        <span>📋</span>
        <span class="button-text">Resources</span>
      </button>
      <button id="tutorials-nav-btn" class="nav-button" data-section="tutorials">
        <span>🎓</span>
        <span class="button-text">Tutorials</span>
      </button>
      <button id="contact-nav-btn" class="nav-button" data-section="contact">
        <span>📞</span>
        <span class="button-text">Contact</span>
      </button>
      <button id="donations-nav-btn" class="nav-button" data-section="donations">
        <span>❤️</span>
        <span class="button-text">Donate</span>
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
  setupAgentLeeFunctionality(agentLeeCard);
  
  // Force a small delay to ensure everything is properly attached
  setTimeout(() => {
    console.log('Verifying navigation buttons are working...');
    const buttons = agentLeeCard.querySelectorAll('.nav-button');
    buttons.forEach(btn => {
      console.log('Button found:', btn.id, 'Section:', btn.getAttribute('data-section'));
    });
  }, 500);
  
  console.log('Agent Lee card created successfully');
}

// Setup Agent Lee comprehensive functionality
function setupAgentLeeFunctionality(agentLeeCard) {
  // Minimize/Maximize functionality
  const minimizeToggle = document.getElementById('minimize-toggle');
  const minimizeBtn = document.getElementById('minimize-btn');
  
  function toggleMinimize() {
    if (agentLeeCard.classList.contains('minimized')) {
      agentLeeCard.classList.remove('minimized');
      agentLeeCard.classList.add('expanded');
      if (minimizeToggle) minimizeToggle.textContent = '−';
    } else {
      agentLeeCard.classList.add('minimized');
      agentLeeCard.classList.remove('expanded');
      if (minimizeToggle) minimizeToggle.textContent = '+';
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
        (e.target === agentLeeCard || e.target.closest('#agent-lee-card'))) {
      toggleMinimize();
    }
  });
  
  // Navigation with detailed introductions
  setupNavigationWithDetailedIntroductions(agentLeeCard);
  
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
  if (window.pageFlip || 
      document.querySelector('.story-page') || 
      window.location.href.includes('d6jq33mv39.html') || 
      window.location.href.includes('0lbzci75tc.html') ||
      window.location.href.includes('needle-yarn.html') ||
      window.location.href.includes('crochet-mastery.html')) {
    const bookControls = agentLeeCard.querySelector('.book-control-panel');
    if (bookControls) {
      bookControls.style.display = 'block';
    }
  }
  
  // Expanded welcome message with full introduction
  setTimeout(function() {
    // Determine which section we're on
    let currentSection = 'home';
    if (window.location.href.includes('#books')) currentSection = 'books';
    else if (window.location.href.includes('#games')) currentSection = 'games';
    else if (window.location.href.includes('#about')) currentSection = 'about';
    else if (window.location.href.includes('#resources')) currentSection = 'resources';
    else if (window.location.href.includes('#tutorials')) currentSection = 'tutorials';
    else if (window.location.href.includes('#contact')) currentSection = 'contact';
    else if (window.location.href.includes('#donations') || window.location.href.includes('donations.html')) currentSection = 'donations';
    
    console.log('Current section detected:', currentSection);
    
    // Use the appropriate detailed introduction
    const introduction = sectionIntroductions[currentSection];
    
    console.log('Speaking initial introduction:', introduction);
    
    addMessage(introduction, 'agent');
    
    // Ensure speech synthesis is available
    if (window.speakText && speechSynthesis) {
      speechSynthesis.cancel(); // Clear any existing speech
      setTimeout(() => {
        window.speakText(introduction);
      }, 200);
    }
  }, 1500);
}

// Navigation with detailed section introductions
function setupNavigationWithDetailedIntroductions(agentLeeCard) {
  const navButtons = agentLeeCard.querySelectorAll('.nav-button');
  
  console.log('Setting up navigation for', navButtons.length, 'buttons');
  
  navButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const section = this.getAttribute('data-section');
      const introduction = sectionIntroductions[section];
      
      console.log('Button clicked:', section);
      console.log('Introduction text:', introduction);
      
      // Speak introduction IMMEDIATELY - NO DELAY
      if (introduction) {
        console.log('Speaking introduction for:', section);
        addMessage(introduction, 'agent');
        
        // Make sure speech synthesis is ready
        if (speechSynthesis) {
          speechSynthesis.cancel(); // Clear any pending speech
          setTimeout(() => {
            window.speakText(introduction);
          }, 100);
        }
      } else {
        console.error('No introduction found for section:', section);
      }
      
      // DON'T NAVIGATE - Stay on same page so speech can complete
      // Just scroll to the section instead
      setTimeout(() => {
        if (section === 'donations') {
          window.location.href = 'donations.html';
        } else {
          // For other sections, just scroll to them
          const targetElement = document.getElementById(section) || document.querySelector(`#${section}`);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          } else {
            // If section doesn't exist, go to home with hash
            window.location.href = `index.html#${section}`;
          }
        }
      }, 2000); // Give speech time to start
    });
    
    console.log('Event listener added to button:', button.id);
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
        addMessage("I'll read this page for you. Just relax and listen!", 'agent');
      }
    });
  }
  
  if (readAllButton) {
    readAllButton.addEventListener('click', function() {
      if (window.readEntireBook) {
        window.readEntireBook();
        addMessage("I'll read the entire book for you, turning pages as we go. You can stop me anytime by clicking the 'Stop Reading' button.", 'agent');
      }
    });
  }
  
  if (stopReadingButton) {
    stopReadingButton.addEventListener('click', function() {
      speechSynthesis.cancel();
      window.agentAutoReadBook = false;
      addMessage("I've stopped reading the book. Let me know if you'd like me to continue or start from another page.", 'agent');
    });
  }
}

// Chat functionality with comprehensive responses
function setupChatFunctionality(agentLeeCard) {
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
      addMessage(text, 'user');
      messageInput.value = '';
      
      // Comprehensive responses
      setTimeout(() => {
        let response = "I'm here to help you explore Sister Leola's library. You can ask me about the books, games, crochet techniques, or request me to read books aloud for you. Is there something specific you'd like to know about?";
        
        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
          response = "Hello! I'm delighted to welcome you to Sister Leola's digital library. I'm Agent Lee, your personal guide to all the interactive books, crochet guides, and educational resources available here. How can I enhance your experience today?";
        } 
        else if (text.toLowerCase().includes('book')) {
          response = "Sister Leola has created two wonderful interactive books: 'Needle & Yarn: A Love Stitched in Time' is a heartwarming story that weaves together themes of family and crafting tradition. 'Crochet Mastery: A Complete Guide' is a comprehensive instruction book suitable for beginners to advanced crocheters, with detailed illustrations and step-by-step tutorials. Would you like me to tell you more about either book?";
        } 
        else if (text.toLowerCase().includes('crochet')) {
          response = "Sister Leola has been a crochet expert for over 40 years! Her digital library includes comprehensive guides, video tutorials, and interactive books that teach everything from basic stitches to advanced techniques. The 'Crochet Mastery' book is especially helpful for learning new patterns and techniques. Would you like me to guide you to specific crochet resources?";
        }
        else if (text.toLowerCase().includes('read')) {
          response = "I'd be delighted to read any of Sister Leola's books to you! Just navigate to a book, and when it's open, I can either read the current page or auto-read the entire book, turning pages as we go. The auto-read feature is perfect for when you want to listen while working on your crochet projects. Would you like me to start reading a book for you now?";
        }
        else if (text.toLowerCase().includes('about') || text.toLowerCase().includes('leola')) {
          response = "Sister Leola Lee is a master storyteller and crochet expert with over 40 years of experience. Born and raised in Milwaukee, she learned crochet from her grandmother at the age of eight. She's dedicated her life to preserving traditional crochet techniques while embracing modern approaches. Through this digital library, she shares her passion for both storytelling and crochet with people around the world. Her teaching has helped thousands discover the joy and therapeutic benefits of crochet.";
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
  console.log('Adding message:', sender, text.substring(0, 50) + '...');
  
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
    console.log('Message added to chat');
  } else {
    console.error('Chat messages container not found');
  }
}

// Force Agent Lee to appear everywhere
function forceAgentLeeEverywhere() {
  // Create Agent Lee if it doesn't exist
  if (!document.getElementById('agent-lee-card')) {
    console.log('Force creating Agent Lee...');
    createAgentLeeCard();
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
    console.log('Voices loaded');
    setupVoiceSelection();
  });
  
  // Load voices immediately if available
  if (speechSynthesis.getVoices().length > 0) {
    setupVoiceSelection();
  }
  
  // Create Agent Lee immediately
  createAgentLeeCard();
  
  // Force Agent Lee everywhere
  forceAgentLeeEverywhere();
  
  // Test speech synthesis
  setTimeout(() => {
    console.log('Testing speech synthesis availability...');
    console.log('SpeechSynthesis available:', !!window.speechSynthesis);
    console.log('Voices available:', speechSynthesis.getVoices().length);
    console.log('Agent Lee window.speakText available:', !!window.speakText);
  }, 1000);
});

// Immediate creation attempt
if (document.readyState === 'loading') {
  // Wait for DOM
  console.log('Waiting for DOM to load...');
} else {
  // DOM already loaded
  console.log('DOM already loaded, creating Agent Lee...');
  createAgentLeeCard();
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