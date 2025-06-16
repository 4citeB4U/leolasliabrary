// Simple Agent Lee - Direct Implementation
console.log('Loading Simple Agent Lee...');

// Create Agent Lee immediately
function createAgentLee() {
    console.log('Creating Agent Lee...');
    
    // Remove any existing Agent Lee
    const existing = document.getElementById('agent-lee-card');
    if (existing) {
        existing.remove();
    }
    
    // Create the card
    const card = document.createElement('div');
    card.id = 'agent-lee-card';
    card.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: rgba(30, 41, 59, 0.9);
        border: 2px solid #FF7F50;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        font-family: 'Georgia', serif;
        color: white;
    `;
    
    // Add avatar image
    card.innerHTML = `
        <img src="xhabe2hpi5.png" alt="Agent Lee" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
    `;
    
    // Click to expand
    card.addEventListener('click', function() {
        if (card.classList.contains('expanded')) {
            // Minimize
            card.style.width = '50px';
            card.style.height = '50px';
            card.style.borderRadius = '50%';
            card.innerHTML = `<img src="xhabe2hpi5.png" alt="Agent Lee" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            card.classList.remove('expanded');
        } else {
            // Expand
            card.style.width = '280px';
            card.style.height = 'auto';
            card.style.borderRadius = '16px';
            card.style.padding = '15px';
            card.innerHTML = `
                <div style="display: flex; flex-direction: column; width: 100%;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
                        <img src="xhabe2hpi5.png" alt="Agent Lee" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                        <div>
                            <h3 style="margin: 0; font-size: 16px;">Agent Lee</h3>
                            <p style="margin: 0; font-size: 12px; opacity: 0.8;">Your Helpful Librarian</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                        <button onclick="window.location.href='index.html'" style="background: rgba(30,41,59,0.5); border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">🏠 Home</button>
                        <button onclick="window.location.href='index.html#books'" style="background: rgba(30,41,59,0.5); border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">📚 Books</button>
                        <button onclick="window.location.href='index.html#about'" style="background: rgba(30,41,59,0.5); border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">👩‍🏫 About</button>
                        <button onclick="window.location.href='index.html#resources'" style="background: rgba(30,41,59,0.5); border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">📋 Resources</button>
                    </div>
                    
                    <div id="book-controls" style="display: none; margin-bottom: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <button onclick="if(window.pageFlip) window.pageFlip.flipPrev()" style="background: #FF7F50; border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">← Previous</button>
                            <button onclick="if(window.pageFlip) window.pageFlip.flipNext()" style="background: #FF7F50; border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">Next →</button>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                            <button onclick="if(window.speakPageContent) window.speakPageContent()" style="background: #8B4513; border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">Read Page</button>
                            <button onclick="if(window.readEntireBook) window.readEntireBook()" style="background: #8B4513; border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">Auto-Read Book</button>
                        </div>
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-bottom: 10px; min-height: 60px; max-height: 120px; overflow-y: auto;">
                        <div id="agent-messages">Welcome! I'm Agent Lee, your helpful librarian.</div>
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                        <button onclick="speakWelcome()" style="background: #FF7F50; border: none; color: white; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 12px;">Speak</button>
                        <button onclick="minimizeAgent()" style="background: rgba(30,41,59,0.5); border: none; color: white; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 12px;">Minimize</button>
                    </div>
                </div>
            `;
            card.classList.add('expanded');
            
            // Show book controls if we're on a book page
            if (window.pageFlip || document.querySelector('.story-page') || document.querySelector('.page')) {
                const bookControls = document.getElementById('book-controls');
                if (bookControls) {
                    bookControls.style.display = 'block';
                }
            }
        }
    });
    
    // Add to page
    document.body.appendChild(card);
    console.log('Agent Lee added to page');
    
    // Set up speech function
    window.speakText = function(text, callback) {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = speechSynthesis.getVoices();
            
            // Find Emma voice
            let emmaVoice = null;
            for (const voice of voices) {
                if (voice.name.includes('Emma')) {
                    emmaVoice = voice;
                    break;
                }
            }
            
            if (emmaVoice) {
                utterance.voice = emmaVoice;
            }
            
            utterance.rate = 0.9;
            if (callback) {
                utterance.onend = callback;
            }
            
            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Speech error:', error);
            if (callback) callback();
        }
    };
    
    // Global functions
    window.speakWelcome = function() {
        window.speakText("Welcome to Leola's Library! I'm Agent Lee, your helpful librarian. How can I assist you today?");
    };
    
    window.minimizeAgent = function() {
        card.click(); // Trigger the minimize
    };
    
    // Auto-speak welcome after a delay
    setTimeout(function() {
        window.speakWelcome();
    }, 2000);
}

// Try to create immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createAgentLee);
} else {
    createAgentLee();
}

// Also try after a delay in case something interferes
setTimeout(createAgentLee, 1000);
setTimeout(createAgentLee, 3000);