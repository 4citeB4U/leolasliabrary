// Agent Lee Functionality
window.speakText = null;
window.agentAutoReadBook = false;
window.agentLeeInstance = null;

// Force Agent Lee to load
function forceCreateAgentLee() {
  console.log('Force creating Agent Lee...');
  
  // Remove any existing Agent Lee
  const existing = document.getElementById('agent-lee-card');
  if (existing) {
    existing.remove();
  }
  
  // Create Agent Lee card and append to body
  const agentLeeCard = document.createElement('div');
  agentLeeCard.id = 'agent-lee-card';
  agentLeeCard.innerHTML = `
    <button class="minimize-toggle" id="minimize-toggle">−</button>
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
      <button id="home-nav-btn" class="nav-button" data-section="home-section" data-href="index.html">
        <span>🏠</span>
        Home
      </button>
      <button id="books-nav-btn" class="nav-button" data-section="books-section" data-href="index.html#books">
        <span>📚</span>
        Books
      </button>
      <button id="about-nav-btn" class="nav-button" data-section="about-section" data-href="index.html#about">
        <span>👩‍🏫</span>
        About
      </button>
      <button id="resources-nav-btn" class="nav-button" data-section="resources-section" data-href="index.html#resources">
        <span>📋</span>
        Resources
      </button>
    </div>
    
    <!-- Book Controls (Hidden by default) -->
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
  
  console.log('Agent Lee card created and added to body');
  
  // Setup basic behavior
  setupAgentLee(agentLeeCard);
  
  // Set up navigation buttons
  setupAgentLeeNavigation(agentLeeCard);
  
  // If we're on a book page, show book controls
  if (window.location.href.includes('d6jq33mv39.html') || 
      window.location.href.includes('0lbzci75tc.html') ||
      window.location.href.includes('needle-yarn.html') ||
      window.location.href.includes('crochet-mastery.html') ||
      document.querySelector('.story-page') || // Also check for story page class
      document.querySelector('.page') || // Or any page class
      window.pageFlip) { // Or if pageFlip is already defined
    
    document.body.classList.add('book-page');
    const bookControls = agentLeeCard.querySelector('.book-control-panel');
    if (bookControls) {
      bookControls.style.display = 'block';
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Agent Lee script loading...');
  
  // Check if an Agent Lee card already exists
  if (document.getElementById('agent-lee-card')) {
    console.log('Agent Lee card already exists. Skipping creation.');
    return;
  }
  
  console.log('Creating Agent Lee card...');
  forceCreateAgentLee();
});

// Set up Agent Lee navigation
function setupAgentLeeNavigation(agentLeeCard) {
  // Get all navigation buttons
  const navButtons = agentLeeCard.querySelectorAll('.nav-button');
  
  // Add click event listeners to each button
  navButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Stop any ongoing speech when navigating
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      // Get the href from data attribute
      const href = this.getAttribute('data-href');
      if (href) {
        // Navigate to the specified URL without Agent Lee speaking
        window.location.href = href;
      }
    });
  });
  
  // Home button specific handling
  const homeButton = document.getElementById('home-nav-btn');
  if (homeButton) {
    homeButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Stop speech
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      window.location.href = 'index.html';
    });
  }
  
  // Books button specific handling
  const booksButton = document.getElementById('books-nav-btn');
  if (booksButton) {
    booksButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Stop speech
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      window.location.href = 'index.html#books';
    });
  }
  
  // About button specific handling
  const aboutButton = document.getElementById('about-nav-btn');
  if (aboutButton) {
    aboutButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Stop speech
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      window.location.href = 'index.html#about';
    });
  }
  
  // Resources button specific handling
  const resourcesButton = document.getElementById('resources-nav-btn');
  if (resourcesButton) {
    resourcesButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Stop speech
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      window.location.href = 'index.html#resources';
    });
  }
}
});

// Set up Agent Lee functionality
function setupAgentLee(agentLeeCard) {
  console.log("Setting up Agent Lee functionality");
  
  // Get elements
  const minimizeToggle = document.getElementById('minimize-toggle');
  const minimizeBtn = document.getElementById('minimize-btn');
  const avatar = agentLeeCard.querySelector('.avatar');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const stopButton = document.getElementById('stop-speaking');
  const chatMessages = document.getElementById('chat-messages');
  const dragHandle = document.getElementById('drag-handle');
  
  // Book control buttons
  const prevButton = document.getElementById('book-prev-btn');
  const nextButton = document.getElementById('book-next-btn');
  const readPageButton = document.getElementById('book-read-page-btn');
  const readAllButton = document.getElementById('book-read-all-btn');
  const stopReadingButton = document.getElementById('book-stop-btn');
  
  console.log("Book control buttons:", {
    prevButton: !!prevButton,
    nextButton: !!nextButton,
    readPageButton: !!readPageButton,
    readAllButton: !!readAllButton,
    stopReadingButton: !!stopReadingButton
  });
  
  // Setup speech synthesis
  const synth = window.speechSynthesis;
  
  // Basic speak function
  function speakText(text, callback) {
    try {
      // Stop any ongoing speech
      if (synth.speaking) {
        synth.cancel();
      }
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to get voices
      const voices = synth.getVoices();
      
      // Find Microsoft Emma voice specifically
      let femaleVoice = null;
      for (const voice of voices) {
        // Prioritize Microsoft Emma first
        if (voice.name.includes('Emma') && voice.name.includes('Microsoft')) {
          femaleVoice = voice;
          break;
        }
      }
      
      // Fallback to other Emma voices if Microsoft Emma not found
      if (!femaleVoice) {
        for (const voice of voices) {
          if (voice.name.includes('Emma')) {
            femaleVoice = voice;
            break;
          }
        }
      }
      
      // Final fallback to other female voices
      if (!femaleVoice) {
        for (const voice of voices) {
          if (voice.name.includes('female') || 
              voice.name.includes('Samantha') || 
              voice.name.includes('Zira')) {
            femaleVoice = voice;
            break;
          }
        }
      }
      
      // Use female voice if found
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Set rate
      utterance.rate = 0.9;
      
      // Set callback if provided
      if (typeof callback === 'function') {
        utterance.onend = callback;
      }
      
      // Error handling
      utterance.onerror = function(event) {
        console.error("Speech synthesis error:", event);
        if (typeof callback === 'function') {
          callback();
        }
      };
      
      // Speak
      synth.speak(utterance);
    } catch (error) {
      console.error("Error in speakText:", error);
      if (typeof callback === 'function') {
        callback();
      }
    }
  }
  
  // Make speak function globally available
  window.speakText = speakText;
  
  // Stop speaking function
  function stopSpeaking() {
    if (synth.speaking) {
      synth.cancel();
    }
    window.agentAutoReadBook = false;
  }
  
  // Make stop speaking function globally available
  window.stopSpeaking = stopSpeaking;
  
  // Stop button functionality
  if (stopButton) {
    stopButton.addEventListener('click', function() {
      stopSpeaking();
      addMessage("I've stopped speaking.", 'agent');
    });
  }
  
  // Toggle minimize/expand
  function toggleAgentLee() {
    agentLeeCard.classList.toggle('minimized');
    agentLeeCard.classList.toggle('expanded');
    
    if (agentLeeCard.classList.contains('minimized')) {
      if (minimizeToggle) minimizeToggle.textContent = '+';
    } else {
      if (minimizeToggle) minimizeToggle.textContent = '−';
    }
  }
  
  // Set up minimize toggle
  if (minimizeToggle) {
    minimizeToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleAgentLee();
    });
  }
  
  // Set up minimize button
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', function() {
      agentLeeCard.classList.add('minimized');
      agentLeeCard.classList.remove('expanded');
      if (minimizeToggle) minimizeToggle.textContent = '+';
    });
  }
  
  // Make avatar clickable to expand
  if (avatar) {
    avatar.addEventListener('click', function(e) {
      if (agentLeeCard.classList.contains('minimized')) {
        e.stopPropagation();
        toggleAgentLee();
      }
    });
  }
  
  // Make entire card clickable when minimized
  agentLeeCard.addEventListener('click', function(e) {
    if (agentLeeCard.classList.contains('minimized')) {
      toggleAgentLee();
    }
  });
  
  // Add message to chat
  function addMessage(text, sender) {
    if (!chatMessages) return;
    
    // Hide empty message if it exists
    const emptyMessage = document.getElementById('empty-message');
    if (emptyMessage) {
      emptyMessage.style.display = 'none';
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'agent-message');
    messageElement.textContent = text;
    
    // Add to chat
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Make addMessage available globally
  window.addAgentLeeMessage = addMessage;
  
  // Send message function
  function sendMessage() {
    if (!messageInput || !sendButton) return;
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';
    
    // Process message
    setTimeout(function() {
      // Simple response - would be more complex in a real assistant
      let response = "I'll help you with that. What else would you like to know?";
      
      // Add agent response
      addMessage(response, 'agent');
      
      // Speak response
      if (window.speakText) {
        window.speakText(response);
      }
    }, 500);
  }
  
  // Set up send button
  if (sendButton && messageInput) {
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  // Book functionality
  // Previous page
  if (prevButton) {
    prevButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Previous button clicked");
      
      if (window.pageFlip && typeof window.pageFlip.flipPrev === 'function') {
        console.log("Using pageFlip.flipPrev()");
        window.pageFlip.flipPrev();
      } else {
        console.log("PageFlip not available, using alternative navigation");
        // For static books without pageFlip
        const currentPage = parseInt(localStorage.getItem('book-current-page') || '0');
        if (currentPage > 0) {
          localStorage.setItem('book-current-page', currentPage - 1);
          location.reload();
        }
      }
    });
  }
  
  // Next page
  if (nextButton) {
    nextButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Next button clicked");
      
      if (window.pageFlip && typeof window.pageFlip.flipNext === 'function') {
        console.log("Using pageFlip.flipNext()");
        window.pageFlip.flipNext();
      } else {
        console.log("PageFlip not available, using alternative navigation");
        // For static books without pageFlip
        const currentPage = parseInt(localStorage.getItem('book-current-page') || '0');
        const totalPages = parseInt(localStorage.getItem('book-total-pages') || '10');
        if (currentPage < totalPages - 1) {
          localStorage.setItem('book-current-page', currentPage + 1);
          location.reload();
        }
      }
    });
  }
  
  // Read page
  if (readPageButton) {
    readPageButton.addEventListener('click', function() {
      if (window.speakPageContent && typeof window.speakPageContent === 'function') {
        window.speakPageContent();
      } else {
        // Default page reading if no specific function exists
        const pageContent = document.querySelector('.story-page');
        if (pageContent) {
          const headings = pageContent.querySelectorAll('h1, h2, h3');
          const paragraphs = pageContent.querySelectorAll('p');
          
          let content = '';
          if (headings.length > 0) {
            content += headings[0].textContent + '. ';
          }
          
          paragraphs.forEach(p => {
            content += p.textContent + ' ';
          });
          
          if (content) {
            window.speakText(content);
          }
        }
      }
    });
  }
  
  // Auto read
  if (readAllButton) {
    readAllButton.addEventListener('click', function() {
      console.log("Auto-read book button clicked");
      window.agentAutoReadBook = true;
      localStorage.setItem('auto-narration', 'true');
      
      // Debug to see what functions are available
      console.log("Available functions:", {
        readEntireBook: typeof window.readEntireBook === 'function',
        speakPageContent: typeof window.speakPageContent === 'function',
        pageFlip: !!window.pageFlip
      });
      
      // Use readEntireBook if available, otherwise fallback to speakPageContent
      if (window.readEntireBook && typeof window.readEntireBook === 'function') {
        console.log("Calling readEntireBook function");
        window.readEntireBook();
        addMessage("I'll read the entire book for you, turning pages as we go. Just say 'stop reading' when you want me to stop.", 'agent');
      } else if (window.speakPageContent && typeof window.speakPageContent === 'function') {
        console.log("Calling speakPageContent function (fallback)");
        window.speakPageContent();
        addMessage("I'll read the current page for you. Just say 'stop reading' when you want me to stop.", 'agent');
      } else {
        console.error("No book reading functions found");
        addMessage("I can't find the book reading function. Please make sure you're viewing a book page.", 'agent');
      }
    });
  }
  
  // Stop reading
  if (stopReadingButton) {
    stopReadingButton.addEventListener('click', function() {
      window.agentAutoReadBook = false;
      stopSpeaking();
      localStorage.setItem('auto-narration', 'false');
      
      addMessage("I've stopped reading the book.", 'agent');
    });
  }
  
  // Start minimized
  agentLeeCard.classList.add('minimized');
  
  console.log('Agent Lee starting minimized');
  
  // Initial welcome message (silent on navigation)
  setTimeout(function() {
    console.log('Adding welcome message');
    addMessage("Welcome! I'm Agent Lee, your helpful librarian. How can I assist you today?", 'agent');
    
    // Only speak welcome message if we're not just navigating
    if (window.speakText && !window.location.hash) {
      console.log('Speaking welcome message');
      window.speakText("Welcome! I'm Agent Lee, your helpful librarian. How can I assist you today?");
    }
  }, 1000);
}

// Function to speak page content - override in book pages
window.speakPageContent = function() {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    const headings = mainContent.querySelectorAll('h1, h2, h3');
    const paragraphs = mainContent.querySelectorAll('p');
    
    let content = '';
    if (headings.length > 0) {
      content += headings[0].textContent + '. ';
    }
    
    for (let i = 0; i < Math.min(paragraphs.length, 3); i++) {
      content += paragraphs[i].textContent + ' ';
    }
    
    if (content) {
      window.speakText(content);
    }
  }
};

// Try multiple times to ensure Agent Lee loads
setTimeout(function() {
  if (!document.getElementById('agent-lee-card')) {
    console.log('Agent Lee not found, trying again...');
    forceCreateAgentLee();
  }
}, 2000);

setTimeout(function() {
  if (!document.getElementById('agent-lee-card')) {
    console.log('Agent Lee still not found, force creating...');
    forceCreateAgentLee();
  }
}, 4000);