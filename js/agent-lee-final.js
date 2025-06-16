// FINAL COMPLETE AGENT LEE - ALL ISSUES FIXED
window.speakText = null;
window.agentAutoReadBook = false;
window.agentLeeInstance = null;
window.speechQueue = [];
window.isSpeaking = false;

// Microsoft Emma Voice Configuration
function setupVoiceSelection() {
  const voices = speechSynthesis.getVoices();
  let selectedVoice = null;

  const voicePreferences = [
    "Microsoft Emma Online (Natural) - English (United States)",
    "Microsoft Emma - English (United States)", 
    "Emma",
    "Emma (Enhanced)",
    "Microsoft Zira Online (Natural) - English (United States)",
    "Microsoft Zira - English (United States)"
  ];

  for (const preference of voicePreferences) {
    selectedVoice = voices.find(voice => voice.name === preference);
    if (selectedVoice) {
      console.log('Selected voice:', selectedVoice.name);
      break;
    }
  }

  if (!selectedVoice) {
    selectedVoice = voices.find(voice => voice.name.includes('Emma'));
  }

  if (!selectedVoice) {
    selectedVoice = voices.find(voice => 
      voice.name.includes('female') || 
      voice.name.includes('Zira') ||
      voice.name.includes('Samantha')
    );
  }

  return selectedVoice;
}

// Speech function with Microsoft Emma voice and queue management
window.speakText = function(text, callback) {
  try {
    // Add to queue
    window.speechQueue.push({
      text: text,
      callback: callback
    });
    
    // If not already speaking, start the queue
    if (!window.isSpeaking) {
      processSpeechQueue();
    }
  } catch (error) {
    console.error('Speech error:', error);
    if (callback) callback();
  }
};

// Process speech queue
function processSpeechQueue() {
  if (window.speechQueue.length === 0) {
    window.isSpeaking = false;
    return;
  }
  
  window.isSpeaking = true;
  const item = window.speechQueue.shift();
  
  try {
    speechSynthesis.cancel(); // Clear any ongoing speech
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(item.text);
      const selectedVoice = setupVoiceSelection();
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = function() {
        if (item.callback) item.callback();
        setTimeout(processSpeechQueue, 300); // Process next item in queue
      };
      
      utterance.onerror = function() {
        if (item.callback) item.callback();
        setTimeout(processSpeechQueue, 300); // Process next item in queue
      };
      
      speechSynthesis.speak(utterance);
    }, 100);
    
  } catch (error) {
    console.error('Speech error during queue processing:', error);
    if (item.callback) item.callback();
    setTimeout(processSpeechQueue, 300);
  }
}

// Clear speech queue
window.clearSpeechQueue = function() {
  window.speechQueue = [];
  window.isSpeaking = false;
  speechSynthesis.cancel();
};

// DETAILED SECTION INTRODUCTIONS
const sectionIntroductions = {
  home: "Welcome to Leola's Library! I'm Agent Lee, Leola's helpful librarian. This is Sister Leola's personal collection of interactive stories, crochet instruction books, and educational resources. Here you'll find heartwarming tales, detailed crafting guides, and fun games that bring the joy of reading and crochet together. Use the navigation buttons to explore different sections, or ask me questions about Sister Leola's work. I can also read books aloud for you while automatically turning pages!",
  
  books: "Welcome to our interactive book collection! Sister Leola has created beautiful flip books that you can read page by page. We have 'Needle & Yarn: A Love Stitched in Time' - a heartwarming story about the connection between crafting and family bonds. We also have 'Crochet Mastery: A Complete Guide' - a detailed instruction book with step-by-step tutorials for beginners to advanced crocheters. Click on any book cover to start reading, and I'll be there to help you navigate and read aloud if you'd like!",
  
  games: "Welcome to our interactive crochet games! These fun activities complement our books and help you practice your crochet skills. Try the 'Crochet Pattern Matcher' where you match different stitch patterns, or the 'Yarn Color Coordinator' to explore beautiful color combinations for your projects. Each game is designed to enhance your understanding of concepts covered in Sister Leola's books. Have fun while learning, and let me know if you need any help with the game instructions!",
  
  about: "Let me tell you about Sister Leola Lee! She's a master storyteller and crochet expert who has dedicated over 40 years to the craft of crochet and the art of storytelling. Born and raised in Milwaukee, Sister Leola learned crochet from her grandmother at the age of eight and has been creating beautiful pieces ever since. She founded this digital library to share her knowledge with crocheters of all skill levels and to preserve the traditional techniques while embracing modern approaches. Her passion for teaching has helped thousands of people discover the joy and therapeutic benefits of crochet.",
  
  resources: "Here you'll find Sister Leola's carefully curated collection of crochet resources! Browse through recommended yarns for different projects, explore specialized hooks for various techniques, and discover the best online communities for crochet enthusiasts. We also have printable stitch charts, gauge measurement guides, and yarn substitution tables. These resources are designed to complement the books and help you on your crochet journey. If you're looking for something specific, just ask me and I'll point you in the right direction!",
  
  tutorials: "Welcome to our comprehensive tutorial section! Sister Leola has created step-by-step video tutorials for all skill levels, from basic chain stitches to advanced lace techniques. Each tutorial corresponds to sections in her books, allowing you to see the techniques in action. We also have a Frequently Asked Questions section covering common crochet problems and their solutions. Browse through the categories or ask me about a specific technique you'd like to learn, and I'll find the perfect tutorial for you!",
  
  faq: "Welcome to Leola's Crochet Clinic: Frequently Asked Questions! This section answers the most common questions Sister Leola receives from crocheters. From choosing the right hook size to understanding pattern terminology, you'll find practical solutions to everyday crochet challenges. Click on any question to hear my detailed explanation, or use the 'Read All FAQs' button to have me go through all the questions and answers. These FAQs are based on Sister Leola's decades of teaching experience. If you have a question that's not covered here, feel free to ask me directly!",
  
  contact: "Here's how you can connect with Sister Leola! You can reach her by phone at (414) 210-4029, or visit her studio in Milwaukee, Wisconsin. Sister Leola loves hearing from fellow crochet enthusiasts and readers. Whether you have questions about her books, need help with a crochet technique, or want to share your own projects inspired by her work, she'd be delighted to hear from you. For workshop bookings and speaking engagements, please provide details about your event when you reach out.",
  
  donations: "Thank you for considering supporting Sister Leola's Library! Your generous donations help maintain this digital library and fund the creation of new books, tutorials, and interactive features. All contributions directly support Sister Leola's mission to make crochet instruction accessible to everyone. Donations at the Platinum Yarn level or higher receive special acknowledgment in upcoming publications and early access to new content. Every contribution, no matter the size, makes a difference and is deeply appreciated by Sister Leola and the entire community!",
  
  // SPECIFIC BOOK INTRODUCTIONS (for book selection pages)
  "needle-yarn": "Welcome to 'Needle & Yarn: A Love Stitched in Time'! I'm Agent Lee, and I'm delighted to guide you through this heartwarming story by Sister Leola. This beautiful tale explores the deep connection between crafting and family bonds, showing how the simple act of crocheting can weave together generations of love and memories. You'll meet characters whose lives are intertwined through the threads of yarn and the wisdom passed down through needle and hook. I can read each page aloud for you, or if you'd like, I can read the entire story automatically while turning the pages. This story will touch your heart and remind you why we love the craft of crochet so much. Let's begin this wonderful journey together!",
  
  "crochet-mastery": "Welcome to 'Crochet Mastery: A Complete Guide'! I'm Agent Lee, your personal crochet instructor for this comprehensive guide by Sister Leola. This isn't just any instruction book - it's a complete journey from beginner to advanced crocheter, filled with detailed techniques, helpful tips, and beautiful projects. Whether you're holding a crochet hook for the first time or looking to master advanced techniques, this guide has everything you need. I can read each page of instructions aloud, explain complex techniques step by step, or take you through the entire guide automatically. Sister Leola has poured decades of experience into this book, and I'm here to help you absorb every bit of wisdom she's shared. Ready to master the art of crochet? Let's dive in!",
  
  // SIMPLE BOOK READING MESSAGES (for inside the actual flipbook)
  "needle-yarn-reading": "Are you ready for me to read Needle & Yarn? I can read this page for you, or if you'd like, press the Auto-Read Book button and I'll read the entire Needle & Yarn story while automatically turning the pages for you!",
  
  "crochet-mastery-reading": "Are you ready for me to read Crochet Mastery? I can read this page of instructions for you, or if you'd like, press the Auto-Read Book button and I'll read through the entire Crochet Mastery guide while turning the pages automatically!"
};

// AUTOMATIC SECTION DETECTION AND SPEAKING
function speakSectionIntroduction() {
  let currentSection = 'home';
  
  // Check for specific book pages - distinguish between selection pages and flipbook pages
  if (window.location.href.includes('needle-yarn.html')) {
    currentSection = 'needle-yarn'; // Book selection page - detailed introduction
  }
  else if (window.location.href.includes('d6jq33mv39.html')) {
    currentSection = 'needle-yarn-reading'; // Flipbook page - simple ready message
  }
  else if (window.location.href.includes('crochet-mastery.html')) {
    currentSection = 'crochet-mastery'; // Book selection page - detailed introduction
  }
  else if (window.location.href.includes('0lbzci75tc.html')) {
    currentSection = 'crochet-mastery-reading'; // Flipbook page - simple ready message
  }
  // Then check for general sections
  else if (window.location.href.includes('#books')) currentSection = 'books';
  else if (window.location.href.includes('#games')) currentSection = 'games';
  else if (window.location.href.includes('#about')) currentSection = 'about';
  else if (window.location.href.includes('#resources')) currentSection = 'resources';
  else if (window.location.href.includes('#tutorials')) currentSection = 'tutorials';
  else if (window.location.href.includes('#contact')) currentSection = 'contact';
  else if (window.location.href.includes('#faq')) currentSection = 'faq'; // Use dedicated FAQ introduction
  else if (window.location.href.includes('#faq-page-section')) currentSection = 'faq'; // Alternative ID for FAQ section
  else if (window.location.href.includes('donations.html')) currentSection = 'donations';
  
  console.log('Detected current section:', currentSection);
  
  const introduction = sectionIntroductions[currentSection];
  
  if (introduction) {
    console.log('Auto-speaking for section:', currentSection);
    window.clearSpeechQueue(); // Clear any pending speech
    addMessage(introduction, 'agent');
    
    // Make sure speech synthesis is ready
    setTimeout(() => {
      window.speakText(introduction);
    }, 300);
  } else {
    console.error('No introduction found for section:', currentSection);
  }
}

// GLOBAL FUNCTION FOR SPEAKING SECTIONS FROM ANYWHERE
window.speakAgentLeeSection = function(section) {
  if (!section || typeof section !== 'string') section = 'home';
  
  console.log('Speaking section from global function:', section);
  
  // Check if we need to detect the current book automatically
  if (section === 'books' && window.location.href.includes('.html') && !window.location.href.includes('index.html')) {
    console.log('On a book page, detecting specific book...');
    if (window.location.href.includes('needle-yarn.html')) {
      section = 'needle-yarn'; // Book selection page
      console.log('Detected Needle & Yarn selection page');
    }
    else if (window.location.href.includes('d6jq33mv39.html')) {
      section = 'needle-yarn-reading'; // Flipbook page
      console.log('Detected Needle & Yarn flipbook');
    }
    else if (window.location.href.includes('crochet-mastery.html')) {
      section = 'crochet-mastery'; // Book selection page
      console.log('Detected Crochet Mastery selection page');
    }
    else if (window.location.href.includes('0lbzci75tc.html')) {
      section = 'crochet-mastery-reading'; // Flipbook page
      console.log('Detected Crochet Mastery flipbook');
    }
  }
  
  const introduction = sectionIntroductions[section];
  
  if (introduction) {
    // Make sure Agent Lee card is visible first
    const agentLeeCard = document.getElementById('agent-lee-card');
    if (!agentLeeCard) {
      console.log('Agent Lee card not found, creating it first...');
      createAgentLeeCard();
      
      // Give it time to be created
      setTimeout(() => {
        window.clearSpeechQueue(); // Clear any pending speech
        window.speakText(introduction);
        addMessage(introduction, 'agent');
      }, 500);
      return;
    }
    
    // Clear any ongoing speech and add new speech to queue
    window.clearSpeechQueue();
    
    setTimeout(() => {
      window.speakText(introduction);
      addMessage(introduction, 'agent');
    }, 100);
  } else {
    console.error('No introduction found for section:', section);
  }
  
  // Reset FAQ intro spoken flag when changing sections
  if (section !== 'faq') {
    window.faqIntroSpoken = false;
  }
};

// FLAG TRACKING SPECIFIC CONDITIONS
window.faqIntroSpoken = false;
let previousUrl = window.location.href;

// HASH CHANGE LISTENER - Cancel speech and speak new section
window.addEventListener('hashchange', function() {
  console.log('Hash changed from', previousUrl, 'to', window.location.href);
  
  // Cancel any ongoing speech
  window.clearSpeechQueue();
  
  // Wait a moment to let the page update
  setTimeout(speakSectionIntroduction, 300);
  
  previousUrl = window.location.href;
});

// MAIN FUNCTION TO CREATE AGENT LEE CARD
function createAgentLeeCard() {
  // Check if card already exists
  if (document.getElementById('agent-lee-card')) {
    console.log('Agent Lee card already exists, skipping creation');
    return;
  }
  
  // Create the card
  const agentLeeCard = document.createElement('div');
  agentLeeCard.id = 'agent-lee-card';
  agentLeeCard.className = 'agent-lee-card';
  
  // Card HTML with proper Agent Lee image and navigation buttons
  agentLeeCard.innerHTML = `
    <button class="minimize-toggle" id="minimize-toggle">−</button>
    <!-- Card Header -->
    <div class="card-header">
      <div class="avatar">
        <img src="eynkl9wt7g.png" alt="Agent Lee - Leola's Helpful Librarian" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRjdGNTAiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNEMxNCA1LjEgMTMuMSA2IDEyIDZDMTAuOSA2IDEwIDUuMSAxMCA0QzEwIDIuOSAxMC45IDIgMTIgMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMSAxOUMxOS45IDE5IDE5IDE5LjkgMTkgMjFDMTkgMjIuMSAxOS45IDIzIDIxIDIzQzIyLjEgMjMgMjMgMjIuMSAyMyAyMUMyMyAxOS45IDIyLjEgMTkgMjEgMTlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMyAxOUMxLjkgMTkgMSAxOS45IDEgMjFDMSAyMi4xIDEuOSAyMyAzIDIzQzQuMSAyMyA1IDIyLjEgNSAyMUM1IDE5LjkgNC4xIDE5IDMgMTpaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNi4xIDEwLjFMMTIgMTZMMTcuOSAxMC4xQzE4LjMgOS43IDE4LjMgOS4xIDE3LjkgOC43QzE3LjUgOC4zIDE2LjkgOC4zIDE2LjUgOC43TDEyIDEzLjJMNy41IDguN0M3LjEgOC4zIDYuNSA4LjMgNi4xIDguN0M1LjcgOS4xIDUuNyA5LjcgNi4xIDEwLjFaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'">
      </div>
      <div class="agent-details">
        <h3>Agent Lee</h3>
        <p>Leola's Assistant</p>
      </div>
    </div>
    
    <!-- Navigation Grid -->
    <div class="navigation-grid">
      <button id="home-nav-btn" class="nav-button" data-section="home" data-href="index.html">
        <span>🏠</span>
        Home
      </button>
      <button id="books-nav-btn" class="nav-button" data-section="books" data-href="index.html#books">
        <span>📚</span>
        Books
      </button>
      <button id="games-nav-btn" class="nav-button" data-section="games" data-href="index.html#games">
        <span>🎮</span>
        Games
      </button>
      <button id="about-nav-btn" class="nav-button" data-section="about" data-href="index.html#about">
        <span>👩‍🏫</span>
        About
      </button>
    </div>
    
    <div class="agent-lee-body">
      <div id="chat-messages" class="chat-messages">
        <div id="empty-message" class="empty-message">I'm here to help! Ask me anything about Sister Leola's library.</div>
      </div>
      <div class="book-controls">
        <button id="book-prev-btn" class="control-btn" title="Previous Page">
          <span class="btn-icon">⏪</span>
          <span style="font-size:10px;">Prev</span>
        </button>
        <button id="book-read-page-btn" class="control-btn" title="Read This Page">
          <span class="btn-icon">🔊</span>
          <span style="font-size:10px;">Read</span>
        </button>
        <button id="book-read-all-btn" class="control-btn" title="Auto-Read Book">
          <span class="btn-icon">📖</span>
          <span style="font-size:10px;">Auto</span>
        </button>
        <button id="book-stop-btn" class="control-btn" title="Stop Reading">
          <span class="btn-icon">⏹️</span>
          <span style="font-size:10px;">Stop</span>
        </button>
        <button id="book-next-btn" class="control-btn" title="Next Page">
          <span class="btn-icon">⏩</span>
          <span style="font-size:10px;">Next</span>
        </button>
      </div>
      <div class="agent-input">
        <input type="text" id="message-input" placeholder="Ask Agent Lee...">
        <button id="send-button">Send</button>
      </div>
    </div>
  `;
  
  // Append card to body
  document.body.appendChild(agentLeeCard);
  console.log('Agent Lee card created and added to page');
  
  // Setup all functionality (removed draggable - card stays fixed)
  setupMinimizeButton(agentLeeCard);
  setupNavigationButtons(agentLeeCard);
  setupBookControls(agentLeeCard);
  setupChatFunctionality(agentLeeCard);
  
  // Start minimized on mobile, expanded on desktop
  if (window.innerWidth < 768) {
    agentLeeCard.classList.add('minimized');
    const minimizeBtn = document.getElementById('minimize-toggle');
    if (minimizeBtn) minimizeBtn.textContent = '+';
  }
  
  window.agentLeeInstance = agentLeeCard;
  
  return agentLeeCard;
}

// Minimize/maximize button
function setupMinimizeButton(agentLeeCard) {
  const minimizeBtn = document.getElementById('minimize-toggle');
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      agentLeeCard.classList.toggle('minimized');
      this.textContent = agentLeeCard.classList.contains('minimized') ? '+' : '−';
    });
  }
  
  // Click minimized card to expand
  agentLeeCard.addEventListener('click', function(e) {
    if (this.classList.contains('minimized')) {
      e.stopPropagation();
      this.classList.remove('minimized');
      const minimizeBtn = document.getElementById('minimize-toggle');
      if (minimizeBtn) {
        minimizeBtn.textContent = '−';
      }
    }
  });
}

// Agent Lee is now FIXED in position - no dragging functionality

// Setup navigation buttons
function setupNavigationButtons(agentLeeCard) {
  const navButtons = agentLeeCard.querySelectorAll('.nav-button');
  
  navButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const section = this.getAttribute('data-section');
      const url = this.getAttribute('data-href');
      
      if (url) {
        console.log('Navigating to:', url, 'section:', section);
        
        // Cancel any ongoing speech
        window.clearSpeechQueue();
        
        // Navigate to the URL
        window.location.href = url;
        
        // If we're already on the page but just changing hash
        if (url.includes('#') && window.location.pathname === url.split('#')[0]) {
          setTimeout(() => {
            window.speakAgentLeeSection(section);
          }, 300);
        }
      }
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
  
  // FIXED function to get page content properly without duplicates
  function getCurrentPageContent() {
    let content = '';
    
    // Try for PageFlip books first
    if (window.pageFlip) {
      const currentPageIndex = window.pageFlip.getCurrentPageIndex();
      const pages = document.querySelectorAll('.page');
      
      console.log('PageFlip detected, current page index:', currentPageIndex, 'total pages:', pages.length);
      
      // Make sure currentPageIndex is valid
      if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
        const currentPage = pages[currentPageIndex];
        console.log('Current page element:', currentPage);
        
        if (currentPage) {
          // Look for the actual content container in the current page
          const contentContainer = currentPage.querySelector('.story-page, .cover-page, .page-content') || currentPage;
          
          // Get text content without duplicating titles
          const textElements = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote, .text, .paragraph');
          
          console.log('Found text elements on page:', textElements.length);
          
          textElements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 2) {
              // Don't add duplicate content
              if (!content.includes(text)) {
                content += text + '. ';
              }
            }
          });
          
          // If no structured content found, try getting all visible text
          if (content.length < 20) {
            const allText = extractVisibleText(contentContainer);
            if (allText && !content.includes(allText)) {
              content = allText;
            }
          }
        }
      }
    } else {
      // For non-PageFlip books, get visible content
      console.log('No PageFlip detected, getting visible content');
      content = extractVisibleText(document.body);
    }
    
    // Helper function to extract visible text without Agent Lee content
    function extractVisibleText(element) {
      const textNodes = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            const parent = node.parentElement;
            // Skip Agent Lee content
            if (parent.closest('#agent-lee-card')) {
              return NodeFilter.FILTER_REJECT;
            }
            // Skip hidden elements
            if (parent.offsetParent === null || window.getComputedStyle(parent).display === 'none') {
              return NodeFilter.FILTER_REJECT;
            }
            // Only include substantial text
            if (node.textContent.trim().length > 5) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text && !textNodes.includes(text)) {
          textNodes.push(text);
        }
      }
      
      return textNodes.join('. ');
    }
    
    // Clean up the content
    content = content.replace(/\s+/g, ' ').trim();
    content = content.replace(/\.+\s*/g, '. '); // Fix multiple periods
    content = content.replace(/\.\s*\./g, '.'); // Remove duplicate periods
    
    console.log('Final content length:', content.length);
    if (content.length > 0) {
      console.log('Final content preview:', content.substring(0, 100) + '...');
    }
    
    return content || "This page contains no readable text content.";
  }
  
  // Direct reading function - works for all book formats
  function readCurrentPage() {
    const content = getCurrentPageContent();
    window.speakText(content);
    addMessage("I'll read this page for you.", 'agent');
  }
  
  // FIXED navigation - single page at a time
  function goToNextPage() {
    if (window.pageFlip) {
      const currentIndex = window.pageFlip.getCurrentPageIndex();
      const totalPages = window.pageFlip.getPageCount();
      
      console.log('Current page index:', currentIndex, 'Total pages:', totalPages);
      
      // Move to the very next page (not jumping chapters)
      if (currentIndex < totalPages - 1) {
        window.pageFlip.flip(currentIndex + 1);
        console.log('Moved to page:', currentIndex + 1);
      } else {
        console.log('Already at last page');
      }
    } else {
      // Try alternative navigation methods
      const nextButtons = document.querySelectorAll('.next-page, .page-next, [data-action="next"]');
      if (nextButtons.length > 0) {
        nextButtons[0].click();
      }
    }
  }
  
  function goToPrevPage() {
    if (window.pageFlip) {
      const currentIndex = window.pageFlip.getCurrentPageIndex();
      
      console.log('Current page index:', currentIndex);
      
      // Move to the very previous page (not jumping chapters)
      if (currentIndex > 0) {
        window.pageFlip.flip(currentIndex - 1);
        console.log('Moved to page:', currentIndex - 1);
      } else {
        console.log('Already at first page');
      }
    } else {
      // Try alternative navigation methods
      const prevButtons = document.querySelectorAll('.prev-page, .page-prev, [data-action="prev"]');
      if (prevButtons.length > 0) {
        prevButtons[0].click();
      }
    }
  }
  
  // FIXED Auto-read entire book - no duplicate titles
  function startAutoReading() {
    window.isAutoReading = true;
    window.agentAutoReadBook = true;
    
    let lastPageContent = ''; // Track last content to avoid duplicates
    
    function readNextPageInBook() {
      if (!window.isAutoReading) return;
      
      const content = getCurrentPageContent();
      
      // Skip if this is the same content as last time (avoid duplicate readings)
      if (content === lastPageContent) {
        console.log('Skipping duplicate content, moving to next page');
        setTimeout(function() {
          if (window.isAutoReading) {
            goToNextPage();
            setTimeout(readNextPageInBook, 800);
          }
        }, 500);
        return;
      }
      
      lastPageContent = content;
      
      console.log('Auto-reading page content:', content.substring(0, 50) + '...');
      
      window.speakText(content, function() {
        if (window.isAutoReading) {
          // Wait for speech to complete, then move to next page
          setTimeout(function() {
            if (window.isAutoReading) {
              const currentIndex = window.pageFlip ? window.pageFlip.getCurrentPageIndex() : 0;
              const totalPages = window.pageFlip ? window.pageFlip.getPageCount() : 1;
              
              console.log('Finished reading page', currentIndex, 'of', totalPages);
              
              // Check if we're at the last page
              if (currentIndex >= totalPages - 1) {
                console.log('Reached end of book, stopping auto-read');
                stopAutoReading();
                addMessage("I've finished reading the entire book!", 'agent');
                return;
              }
              
              // Move to next page and continue reading
              goToNextPage();
              setTimeout(readNextPageInBook, 1200); // Give time for page flip animation
            }
          }, 1000);
        }
      });
    }
    
    // Start reading current page
    readNextPageInBook();
  }
  
  // Stop auto-reading
  function stopAutoReading() {
    window.isAutoReading = false;
    window.agentAutoReadBook = false;
    window.clearSpeechQueue();
  }
  
  // Add event listeners
  if (prevButton) {
    prevButton.addEventListener('click', function() {
      goToPrevPage();
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', function() {
      goToNextPage();
    });
  }
  
  if (readPageButton) {
    readPageButton.addEventListener('click', function() {
      readCurrentPage();
    });
  }
  
  if (readAllButton) {
    readAllButton.addEventListener('click', function() {
      if (window.readEntireBook) {
        window.readEntireBook();
        // Check if reading started or stopped
        if (window.isReading) {
          addMessage("I'll read word by word with highlighting, starting from the current page. Double-click any word to start reading from there!", 'agent');
        } else {
          addMessage("I've stopped reading. Double-click any word to start reading from that point.", 'agent');
        }
      } else {
        startAutoReading();
        addMessage("I'll read the entire book for you, turning pages as we go.", 'agent');
      }
    });
  }
  
  if (stopReadingButton) {
    stopReadingButton.addEventListener('click', function() {
      // Stop the new audiobook reading
      if (window.isReading) {
        window.isReading = false;
      }

      // Stop any auto-reading
      if (window.isAutoReading) {
        window.isAutoReading = false;
      }

      // Stop speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Clear highlights
      const highlights = document.querySelectorAll('.reading-highlight');
      highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.innerHTML = parent.textContent;
      });

      // Call other stop functions if available
      if (window.stopAutoReading && typeof window.stopAutoReading === 'function') {
        window.stopAutoReading();
      }

      if (window.clearSpeechQueue && typeof window.clearSpeechQueue === 'function') {
        window.clearSpeechQueue();
      }

      if (window.stopSpeaking && typeof window.stopSpeaking === 'function') {
        window.stopSpeaking();
      }

      window.agentAutoReadBook = false;
      addMessage("I've stopped reading the book. Double-click any word to start reading from that point.", 'agent');
    });
  }
  
  // Global functions for book reading
  window.speakPageContent = readCurrentPage;
  window.readEntireBook = startAutoReading;
  window.stopReading = stopAutoReading;
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
      
      // Auto-expand card when sending a message
      if (agentLeeCard.classList.contains('minimized')) {
        agentLeeCard.classList.remove('minimized');
        const minimizeBtn = document.getElementById('minimize-toggle');
        if (minimizeBtn) minimizeBtn.textContent = '−';
      }
      
      setTimeout(() => {
        let response = "I'm here to help you explore Sister Leola's library. You can ask me about the books, games, crochet techniques, or request me to read books aloud for you.";
        
        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
          response = "Hello! I'm delighted to welcome you to Sister Leola's digital library. How can I enhance your experience today?";
        } else if (text.toLowerCase().includes('book')) {
          response = "Sister Leola has created two wonderful interactive books: 'Needle & Yarn: A Love Stitched in Time' and 'Crochet Mastery: A Complete Guide'. Would you like me to tell you more about either book?";
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
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Auto-expand card when new message arrives
    const agentLeeCard = document.getElementById('agent-lee-card');
    if (agentLeeCard && agentLeeCard.classList.contains('minimized')) {
      agentLeeCard.classList.remove('minimized');
      const minimizeBtn = document.getElementById('minimize-toggle');
      if (minimizeBtn) minimizeBtn.textContent = '−';
    }
  }
}

// Create a persistent, cross-page instance of Agent Lee using localStorage
function createPersistentAgentLee() {
  try {
    // Check if we've already created Agent Lee on this page load
    if (window.agentLeeCreated) {
      return;
    }
    
    window.agentLeeCreated = true;
    
    // Check if Agent Lee card exists
    if (!document.getElementById('agent-lee-card')) {
      console.log('Creating persistent Agent Lee...');
      const card = createAgentLeeCard();
      
      // After creation, check if we need to speak a section introduction
      setTimeout(speakSectionIntroduction, 500);
      
      return card;
    }
  } catch (error) {
    console.error('Error creating persistent Agent Lee:', error);
  }
}

// ON PAGE LOAD
document.addEventListener('DOMContentLoaded', function() {
  // Initialize speech synthesis
  if ('speechSynthesis' in window) {
    console.log('Speech synthesis supported');
    
    // Force voice list population
    speechSynthesis.getVoices();
    
    // Wait for voices to load on Chrome
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = function() {
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
      };
    }
  } else {
    console.warn('Speech synthesis not supported');
  }
  
  // Create persistent Agent Lee
  createPersistentAgentLee();
});

// Catch errors and reset Agent Lee if needed
window.addEventListener('error', function(e) {
  if (e.filename && e.filename.includes('agent-lee')) {
    console.error('Agent Lee error:', e.error);
    
    // Try to recreate Agent Lee if there's an error
    setTimeout(function() {
      if (!document.getElementById('agent-lee-card')) {
        console.log('Recreating Agent Lee after error...');
        createPersistentAgentLee();
      }
    }, 1000);
  }
});

// On window resize, minimize Agent Lee on mobile but maintain state on desktop
window.addEventListener('resize', function() {
  const agentLeeCard = document.getElementById('agent-lee-card');
  
  if (agentLeeCard) {
    if (window.innerWidth < 768) {
      agentLeeCard.classList.add('minimized');
      const minimizeBtn = document.getElementById('minimize-toggle');
      if (minimizeBtn) minimizeBtn.textContent = '+';
    }
  }
});

// Ensure Agent Lee is created even if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPersistentAgentLee);
} else {
  createPersistentAgentLee();
}

// Final fallback - create Agent Lee after a delay
setTimeout(createPersistentAgentLee, 1000);

// Special handling for donations page
if (window.location.href.includes('donations.html')) {
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (!document.getElementById('agent-lee-card')) {
        console.log('Donations page - forcing Agent Lee creation...');
        createPersistentAgentLee();
        
        // Force specific introduction for donations
        setTimeout(function() {
          window.speakAgentLeeSection('donations');
        }, 800);
      }
    }, 1500);
  });
}

// Special handling for book pages
if (window.location.href.includes('.html') && 
    !window.location.href.includes('index.html') && 
    !window.location.href.includes('donations.html')) {
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (!document.getElementById('agent-lee-card')) {
        console.log('Book page - forcing Agent Lee creation...');
        createPersistentAgentLee();
      }
      
      // After card is created, wait and then check if we need to speak a section intro
      setTimeout(speakSectionIntroduction, 800);
    }, 1500);
  });
}