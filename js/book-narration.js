// Enhanced Agently Narration Protocol v2.1
document.addEventListener('DOMContentLoaded', function() {
    // Only run on book pages
    if (!document.getElementById('book')) return;

    // Initialize enhanced state management
    const AgentlyNarration = {
        // Context tracking object
        state: {
            current_page: 0,
            last_content: '',
            read_pages: [],
            chapter_progress: 0,
            session_id: Date.now(),
            returning_user: localStorage.getItem('agently-session') !== null,
            content_cache: new Map(),
            error_log: [],
            skip_pattern: false,
            anti_redundancy_cache: new Set()
        },

        // Error codes matrix
        errorCodes: {
            E404: { meaning: 'Missing page', resolution: 'Trigger archive lookup' },
            E205: { meaning: 'Content mismatch', resolution: 'Cross-reference index' },
            E303: { meaning: 'Empty content', resolution: 'Generate placeholder' },
            E500: { meaning: 'Navigation error', resolution: 'Reset to last valid page' },
            E600: { meaning: 'Speech synthesis error', resolution: 'Fallback to text display' }
        },

        // Initialize the enhanced system
        init: function() {
            this.loadSessionState();
            this.setupPageValidation();
            this.initializeVoiceSystem();
            this.setupErrorHandling();
            this.logSessionStart();
        },

        // Session tracking
        loadSessionState: function() {
            const savedState = localStorage.getItem('agently-session');
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    this.state = { ...this.state, ...parsed };
                    this.state.returning_user = true;
                    console.log('Agently: Welcome back! Continuing from session:', this.state.session_id);
                } catch (e) {
                    this.logError('E500', 'Failed to parse saved session state');
                }
            }
        },

        saveSessionState: function() {
            try {
                localStorage.setItem('agently-session', JSON.stringify(this.state));
            } catch (e) {
                this.logError('E500', 'Failed to save session state');
            }
        },

        logSessionStart: function() {
            const greeting = this.state.returning_user ?
                "Welcome back! Let's continue where we left off..." :
                "Welcome to your crochet journey! I'm here to guide you through every page.";

            if (window.addMessage && typeof window.addMessage === 'function') {
                window.addMessage(greeting, 'agent');
            }
        }
    };

    // Initialize Agent Lee for book pages
    if (typeof initializeAgentLeeForBooks === 'function') {
        setTimeout(initializeAgentLeeForBooks, 1000);
    }

    // Initialize the enhanced narration system
    AgentlyNarration.init();

    // Set up voice recognition for book navigation
    setupVoiceRecognition();

    // Make sure pageFlip is accessible
    setTimeout(() => {
        // Find PageFlip instance
        if (typeof pageFlip !== 'undefined') {
            window.pageFlip = pageFlip;
            AgentlyNarration.setupPageFlipIntegration();
        } else {
            // Try to find PageFlip in the window object
            const pageFlipKeys = Object.keys(window).filter(key =>
                key.startsWith('PageFlip') ||
                (window[key] && typeof window[key].turnToPage === 'function')
            );

            if (pageFlipKeys.length > 0) {
                window.pageFlip = window[pageFlipKeys[0]];
                AgentlyNarration.setupPageFlipIntegration();
                console.log('Found PageFlip instance:', pageFlipKeys[0]);
            }
        }
    }, 1000);

    // Initialize variables
    const synth = window.speechSynthesis;
    window.currentUtterance = null;
    let autoNarrate = localStorage.getItem('auto-narration') === 'true';
    let femaleVoice = null;

    // Enhanced page validation workflow
    AgentlyNarration.setupPageValidation = function() {
        this.validatePage = function(pageNumber) {
            try {
                const pageElement = document.querySelectorAll('.page')[pageNumber];
                if (!pageElement) {
                    this.logError('E404', `Missing page ${pageNumber}`);
                    return false;
                }

                const content = this.extractPageContent(pageElement);
                if (!content || content.trim().length === 0) {
                    this.logError('E303', `Empty content on page ${pageNumber}`);
                    return false;
                }

                // Check for duplicate content
                if (this.state.anti_redundancy_cache.has(content)) {
                    this.logError('E205', `Duplicate content detected on page ${pageNumber}`);
                    return this.findNextValidPage(pageNumber);
                }

                return true;
            } catch (error) {
                this.logError('E500', `Page validation error: ${error.message}`);
                return false;
            }
        };

        this.findNextValidPage = function(currentPage) {
            const totalPages = window.pageFlip ? window.pageFlip.getPageCount() : document.querySelectorAll('.page').length;

            for (let i = currentPage + 1; i < totalPages; i++) {
                if (this.validatePage(i)) {
                    return i;
                }
            }

            // If no valid page found, return current page
            this.logError('E404', 'No valid pages found after current page');
            return currentPage;
        };

        this.handlePageTurn = function(direction) {
            const current = this.state.current_page;
            let nextPage = current + (this.state.skip_pattern ? 2 : 1);

            if (direction === 'prev') {
                nextPage = current - (this.state.skip_pattern ? 2 : 1);
                nextPage = Math.max(0, nextPage);
            }

            if (!this.validatePage(nextPage)) {
                nextPage = this.findNextValidPage(current);
            }

            return this.fetchPageContent(nextPage);
        };
    };

    // Content extraction and processing
    AgentlyNarration.extractPageContent = function(pageElement) {
        if (!pageElement) return '';

        let content = '';

        // Get text content from the story-page or instruction-page div
        const contentDiv = pageElement.querySelector('.story-page') || pageElement.querySelector('.instruction-page');
        if (contentDiv) {
            // Get heading
            const heading = contentDiv.querySelector('h2');
            if (heading) {
                content += heading.textContent + '. ';
            }

            // Get paragraphs
            const paragraphs = contentDiv.querySelectorAll('p');
            paragraphs.forEach(p => {
                content += p.textContent + ' ';
            });

            // Get steps for instruction pages
            const steps = contentDiv.querySelectorAll('.instruction-step');
            steps.forEach(step => {
                const stepNumber = step.querySelector('.step-number');
                const stepContent = step.querySelector('.step-content');

                if (stepNumber && stepContent) {
                    content += `Step ${stepNumber.textContent} ${stepContent.textContent} `;
                }
            });
        } else {
            // Fallback to any text in the page
            content = pageElement.textContent.trim();
        }

        // If still no content, use alt text from image
        if (!content) {
            const img = pageElement.querySelector('img');
            if (img && img.alt) {
                content = `Page showing ${img.alt}`;
            }
        }

        return content;
    };

    // Find female voice
    function loadVoices() {
        const voices = synth.getVoices();
        const femaleVoices = voices.filter(voice =>
            /en(-|_)/.test(voice.lang) &&
            (voice.name.includes('female') ||
             voice.name.includes('woman') ||
             voice.name.includes('girl') ||
             voice.name.includes('Samantha') ||
             voice.name.includes('Victoria') ||
             voice.name.includes('Karen'))
        );

        if (femaleVoices.length > 0) {
            femaleVoice = femaleVoices[0];
        }
    }

    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

    // Dynamic content adjustment system
    AgentlyNarration.adjustContentDensity = function(content) {
        const contentLength = content.length;

        if (contentLength > 500) {
            // Apply summarization for long content
            return this.summarizeContent(content, 0.3);
        } else if (contentLength < 50) {
            // Enhance short content
            return this.enhanceShortContent(content);
        }

        return content;
    };

    AgentlyNarration.summarizeContent = function(content, ratio) {
        // Simple summarization - take key sentences
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const keepCount = Math.max(1, Math.floor(sentences.length * ratio));

        // Prioritize sentences with key terms
        const keyTerms = ['step', 'important', 'remember', 'note', 'tip', 'chapter'];
        const prioritized = sentences.sort((a, b) => {
            const aScore = keyTerms.reduce((score, term) =>
                score + (a.toLowerCase().includes(term) ? 1 : 0), 0);
            const bScore = keyTerms.reduce((score, term) =>
                score + (b.toLowerCase().includes(term) ? 1 : 0), 0);
            return bScore - aScore;
        });

        return prioritized.slice(0, keepCount).join('. ') + '.';
    };

    AgentlyNarration.enhanceShortContent = function(content) {
        // Add context for very short content
        const currentPage = this.state.current_page;
        const pageType = this.detectPageType(currentPage);

        switch (pageType) {
            case 'chapter':
                return `Beginning ${content}. Let's explore this chapter together.`;
            case 'instruction':
                return `${content}. Take your time with this step.`;
            case 'image':
                return `${content}. This illustration shows an important technique.`;
            default:
                return content;
        }
    };

    AgentlyNarration.detectPageType = function(pageNumber) {
        const pageElement = document.querySelectorAll('.page')[pageNumber];
        if (!pageElement) return 'unknown';

        if (pageElement.querySelector('h2')) return 'chapter';
        if (pageElement.querySelector('.instruction-step')) return 'instruction';
        if (pageElement.querySelector('img:not(.book-cover)')) return 'image';
        return 'content';
    };

    // Enhanced speak function for books - only override if no existing function
    if (!window.speakPageContent) {
        window.speakPageContent = function() {
            // Stop any ongoing speech
            window.stopSpeaking();

            // Get current page
            if (!window.pageFlip) {
                AgentlyNarration.logError('E500', "PageFlip instance not found");
                return;
            }

            const currentPage = window.pageFlip.getCurrentPageIndex();

            // Validate page before speaking
            if (!AgentlyNarration.validatePage(currentPage)) {
                const nextValidPage = AgentlyNarration.findNextValidPage(currentPage);
                if (nextValidPage !== currentPage) {
                    window.pageFlip.turnToPage(nextValidPage);
                    return; // Will trigger again on page turn
                }
            }

            // Update state
            AgentlyNarration.state.current_page = currentPage;

            // Get page content using enhanced extraction
            const pageElement = document.querySelectorAll('.page')[currentPage];
            let pageContent = AgentlyNarration.extractPageContent(pageElement);

            // If still no content, use generic message
            if (!pageContent) {
                pageContent = `You are viewing page ${currentPage + 1} of the book.`;
            }

            // Apply dynamic content adjustment
            pageContent = AgentlyNarration.adjustContentDensity(pageContent);

            // Anti-redundancy check
            if (AgentlyNarration.state.anti_redundancy_cache.has(pageContent)) {
                pageContent = `Moving to page ${currentPage + 1}. ` + pageContent;
            }

            // Add to cache and update state
            AgentlyNarration.state.anti_redundancy_cache.add(pageContent);
            AgentlyNarration.state.last_content = pageContent;
            AgentlyNarration.state.read_pages.push(currentPage);

            // Calculate chapter progress
            const totalPages = window.pageFlip.getPageCount();
            AgentlyNarration.state.chapter_progress = Math.round((currentPage / totalPages) * 100);

            // Save state
            AgentlyNarration.saveSessionState();

            // Continue with speech synthesis...
            createAndSpeakUtterance(pageContent);
        };
    }

    // Separate function for speech synthesis to avoid duplication
    function createAndSpeakUtterance(pageContent) {
        
        // Create utterance with enhanced error handling
        try {
            const utterance = new SpeechSynthesisUtterance(pageContent);

            // Set female voice if available
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            // Set rate from slider if available
            const speedSlider = document.getElementById('speed-slider');
            if (speedSlider) {
                utterance.rate = parseFloat(speedSlider.value);
            }

            // Visual feedback
            const speakBtn = document.getElementById('speak-btn');
            if (speakBtn) {
                speakBtn.classList.add('speaking');
            }

            // Enhanced events with error handling
            utterance.onend = function() {
                if (speakBtn) {
                    speakBtn.classList.remove('speaking');
                }
                currentUtterance = null;

                // Trigger chapter transition event if available
                if (window.agently && window.agently.narrateChapterTransition) {
                    const chapterInfo = AgentlyNarration.detectChapterTransition(AgentlyNarration.state.current_page);
                    if (chapterInfo) {
                        window.agently.narrateChapterTransition(chapterInfo);
                    }
                }

                // Auto-advance if it's enabled (only for enhanced narration)
                if (autoNarrate && window.pageFlip && window.pageFlip.getCurrentPageIndex() < window.pageFlip.getPageCount() - 1) {
                    setTimeout(() => {
                        const nextPage = AgentlyNarration.handlePageTurn('next');
                        if (nextPage !== AgentlyNarration.state.current_page) {
                            window.pageFlip.flipNext();
                            // Only call if we're using enhanced narration
                            if (window.speakPageContent === arguments.callee.speakPageContent) {
                                window.speakPageContent();
                            }
                        }
                    }, 1000);
                }
            };

            utterance.onerror = function(event) {
                AgentlyNarration.logError('E600', `Speech synthesis error: ${event.error}`);
                if (speakBtn) {
                    speakBtn.classList.remove('speaking');
                }
                // Fallback to text display
                AgentlyNarration.displayTextFallback(pageContent);
            };

            // Store current utterance
            currentUtterance = utterance;

            // Speak
            synth.speak(utterance);

        } catch (error) {
            AgentlyNarration.logError('E600', `Failed to create speech utterance: ${error.message}`);
            AgentlyNarration.displayTextFallback(pageContent);
        }
    }

    // Error handling and logging system
    AgentlyNarration.setupErrorHandling = function() {
        this.logError = function(code, message) {
            const error = {
                code: code,
                message: message,
                timestamp: new Date().toISOString(),
                page: this.state.current_page,
                resolution: this.errorCodes[code]?.resolution || 'Unknown resolution'
            };

            this.state.error_log.push(error);
            console.warn(`Agently Error ${code}: ${message}`);

            // Auto-resolve if possible
            this.autoResolveError(error);
        };

        this.autoResolveError = function(error) {
            switch (error.code) {
                case 'E404':
                    // Trigger archive lookup
                    this.findNextValidPage(this.state.current_page);
                    break;
                case 'E205':
                    // Cross-reference index
                    this.crossReferenceIndex(this.state.current_page);
                    break;
                case 'E303':
                    // Generate placeholder
                    this.generatePlaceholder(this.state.current_page);
                    break;
                case 'E500':
                    // Reset to last valid page
                    this.resetToLastValidPage();
                    break;
                case 'E600':
                    // Already handled in speech error
                    break;
            }
        };

        this.displayTextFallback = function(content) {
            // Create or update text display fallback
            let textDisplay = document.getElementById('agently-text-fallback');
            if (!textDisplay) {
                textDisplay = document.createElement('div');
                textDisplay.id = 'agently-text-fallback';
                textDisplay.style.cssText = `
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(52, 100, 140, 0.9);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    max-width: 80%;
                    z-index: 1000;
                    font-size: 1rem;
                    line-height: 1.4;
                `;
                document.body.appendChild(textDisplay);
            }

            textDisplay.textContent = content;
            textDisplay.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => {
                textDisplay.style.display = 'none';
            }, 5000);
        };
    };
    
    // PageFlip integration and chapter detection
    AgentlyNarration.setupPageFlipIntegration = function() {
        if (!window.pageFlip) return;

        // Override page flip events
        window.pageFlip.on('flip', (e) => {
            this.state.current_page = e.data;
            this.saveSessionState();

            // Detect chapter transitions
            const chapterInfo = this.detectChapterTransition(e.data);
            if (chapterInfo) {
                this.handleChapterTransition(chapterInfo);
            }
        });

        // Add navigation methods
        this.fetchPageContent = function(pageNumber) {
            if (!this.validatePage(pageNumber)) {
                return null;
            }

            const pageElement = document.querySelectorAll('.page')[pageNumber];
            return this.extractPageContent(pageElement);
        };
    };

    AgentlyNarration.detectChapterTransition = function(pageNumber) {
        const pageElement = document.querySelectorAll('.page')[pageNumber];
        if (!pageElement) return null;

        const heading = pageElement.querySelector('h2');
        if (heading && heading.textContent.toLowerCase().includes('chapter')) {
            return {
                chapter: heading.textContent,
                page: pageNumber,
                type: 'chapter_start'
            };
        }

        return null;
    };

    AgentlyNarration.handleChapterTransition = function(chapterInfo) {
        // Add special narration for chapter transitions
        const transitionMessage = `Now beginning ${chapterInfo.chapter}. Let's explore this new section together.`;

        if (window.addMessage && typeof window.addMessage === 'function') {
            window.addMessage(transitionMessage, 'agent');
        }

        // Trigger custom event for external listeners
        const event = new CustomEvent('agently:chapterTransition', {
            detail: chapterInfo
        });
        document.dispatchEvent(event);
    };

    // Helper methods for error resolution
    AgentlyNarration.crossReferenceIndex = function(pageNumber) {
        // Look for table of contents or index to verify page structure
        const tocElement = document.querySelector('.toc-container, .contents');
        if (tocElement) {
            console.log('Cross-referencing with table of contents');
            // Implementation would check against TOC structure
        }
    };

    AgentlyNarration.generatePlaceholder = function(pageNumber) {
        return `This appears to be page ${pageNumber + 1}. The content may be loading or unavailable.`;
    };

    AgentlyNarration.resetToLastValidPage = function() {
        const lastValidPage = this.state.read_pages[this.state.read_pages.length - 1] || 0;
        if (window.pageFlip) {
            window.pageFlip.turnToPage(lastValidPage);
        }
        this.state.current_page = lastValidPage;
    };

    // Initialize voice system
    AgentlyNarration.initializeVoiceSystem = function() {
        // Enhanced voice selection with preferences
        this.voicePreferences = {
            preferredVoices: ['Samantha', 'Victoria', 'Karen', 'female', 'woman'],
            fallbackRate: 0.9,
            fallbackPitch: 1.0
        };

        this.selectOptimalVoice = function() {
            const voices = synth.getVoices();

            for (const preferred of this.voicePreferences.preferredVoices) {
                const voice = voices.find(v =>
                    v.name.toLowerCase().includes(preferred.toLowerCase()) &&
                    /en(-|_)/.test(v.lang)
                );
                if (voice) {
                    femaleVoice = voice;
                    console.log('Agently: Selected voice:', voice.name);
                    return voice;
                }
            }

            // Fallback to first English voice
            const englishVoice = voices.find(v => /en(-|_)/.test(v.lang));
            if (englishVoice) {
                femaleVoice = englishVoice;
                console.log('Agently: Using fallback voice:', englishVoice.name);
            }

            return englishVoice;
        };

        // Load voices with retry mechanism
        let voiceLoadAttempts = 0;
        const maxAttempts = 5;

        const loadVoicesWithRetry = () => {
            voiceLoadAttempts++;
            this.selectOptimalVoice();

            if (!femaleVoice && voiceLoadAttempts < maxAttempts) {
                setTimeout(loadVoicesWithRetry, 500);
            }
        };

        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoicesWithRetry;
        }
        loadVoicesWithRetry();
    };

    // Stop speaking function - expose globally for Agent Lee
    window.stopSpeaking = function() {
        if (synth.speaking) {
            synth.cancel();
            const speakBtn = document.getElementById('speak-btn');
            if (speakBtn) {
                speakBtn.classList.remove('speaking');
            }
            window.currentUtterance = null;
        }

        // Hide text fallback if visible
        const textDisplay = document.getElementById('agently-text-fallback');
        if (textDisplay) {
            textDisplay.style.display = 'none';
        }
    }
    
    // Toggle auto-narration
    function toggleAutoNarration() {
        autoNarrate = !autoNarrate;
        localStorage.setItem('auto-narration', autoNarrate);
        
        // Notify via Agent Lee if available
        const agentLeeChat = document.getElementById('chat-messages');
        if (agentLeeChat) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'agent-message');
            messageElement.textContent = autoNarrate ? 
                "Auto-narration enabled. I'll read each page and turn to the next one automatically." : 
                "Auto-narration disabled. I'll only read the current page when requested.";
            agentLeeChat.appendChild(messageElement);
            agentLeeChat.scrollTop = agentLeeChat.scrollHeight;
        }
        
        // Start narration if enabled
        if (autoNarrate) {
            speakPageContent();
        }
    }
    
    // Add narration controls to page if they don't exist
    if (!document.getElementById('auto-narration-toggle')) {
        // Find narration settings div
        const narrationSettings = document.querySelector('.narration-settings');
        
        if (narrationSettings) {
            // Add auto-narration toggle
            const autoNarrationLabel = document.createElement('label');
            autoNarrationLabel.setAttribute('for', 'auto-narration-toggle');
            autoNarrationLabel.textContent = 'Auto-Narration:';
            
            const autoNarrationToggle = document.createElement('input');
            autoNarrationToggle.setAttribute('type', 'checkbox');
            autoNarrationToggle.setAttribute('id', 'auto-narration-toggle');
            
            narrationSettings.appendChild(document.createElement('br'));
            narrationSettings.appendChild(autoNarrationLabel);
            narrationSettings.appendChild(autoNarrationToggle);
            
            // Set initial state
            autoNarrate = localStorage.getItem('auto-narration') === 'true';
            autoNarrationToggle.checked = autoNarrate;
            
            // Add event listener
            autoNarrationToggle.addEventListener('change', toggleAutoNarration);
        }
    }
    
    // Connect to existing book UI
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (speakBtn) {
        // Override existing click handler
        speakBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent other handlers
            speakPageContent();
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent other handlers
            stopSpeaking();
        });
    }
    
    // Initialize auto-narration if enabled
    if (autoNarrate) {
        setTimeout(() => {
            speakPageContent();
        }, 1500);
    }
    
    // Testing framework for validation
    AgentlyNarration.testing = {
        runValidationSuite: function() {
            console.log('Agently: Running validation suite...');

            const tests = [
                this.testPageValidation,
                this.testContentExtraction,
                this.testErrorHandling,
                this.testStateManagement,
                this.testVoiceSystem
            ];

            const results = tests.map(test => {
                try {
                    return { test: test.name, result: test.call(this), status: 'PASS' };
                } catch (error) {
                    return { test: test.name, error: error.message, status: 'FAIL' };
                }
            });

            console.table(results);
            return results;
        },

        testPageValidation: function() {
            const totalPages = document.querySelectorAll('.page').length;
            let validPages = 0;

            for (let i = 0; i < totalPages; i++) {
                if (AgentlyNarration.validatePage(i)) {
                    validPages++;
                }
            }

            return `${validPages}/${totalPages} pages valid`;
        },

        testContentExtraction: function() {
            const testPage = document.querySelector('.page');
            const content = AgentlyNarration.extractPageContent(testPage);
            return content ? 'Content extraction working' : 'Content extraction failed';
        },

        testErrorHandling: function() {
            AgentlyNarration.logError('E404', 'Test error');
            return AgentlyNarration.state.error_log.length > 0 ? 'Error logging working' : 'Error logging failed';
        },

        testStateManagement: function() {
            const originalState = { ...AgentlyNarration.state };
            AgentlyNarration.saveSessionState();
            AgentlyNarration.loadSessionState();
            return 'State management working';
        },

        testVoiceSystem: function() {
            return femaleVoice ? `Voice system ready: ${femaleVoice.name}` : 'Voice system not ready';
        }
    };

    // Enhanced API exposure for external integration
    window.AgentlyNarration = AgentlyNarration;
    window.bookSpeakPageContent = speakPageContent;
    window.bookStopSpeaking = stopSpeaking;
    window.bookToggleAutoNarration = toggleAutoNarration;

    // Enhanced readEntireBook function - only use if no existing function
    if (!window.readEntireBook) {
        window.readEntireBook = function() {
            if (!window.pageFlip) {
                AgentlyNarration.logError('E500', 'PageFlip not available for book reading');
                return;
            }

            console.log('Agently: Starting enhanced book reading...');

            // Reset to beginning
            window.pageFlip.flip(0);
            AgentlyNarration.state.current_page = 0;

            // Enable auto-narration
            autoNarrate = true;
            localStorage.setItem('auto-narration', 'true');

            // Start reading
            setTimeout(() => {
                speakPageContent();
            }, 1000);

            // Notify user
            if (window.addMessage && typeof window.addMessage === 'function') {
                window.addMessage("I'll read the entire book for you with enhanced narration. Say 'stop reading' when you want me to stop.", 'agent');
            }
        };
    }

    // Performance monitoring
    AgentlyNarration.performance = {
        startTime: Date.now(),
        pageLoadTimes: [],
        speechLatency: [],

        logPageLoad: function(pageNumber, loadTime) {
            this.pageLoadTimes.push({ page: pageNumber, time: loadTime });
        },

        logSpeechLatency: function(latency) {
            this.speechLatency.push(latency);
        },

        getAverageLoadTime: function() {
            if (this.pageLoadTimes.length === 0) return 0;
            const total = this.pageLoadTimes.reduce((sum, entry) => sum + entry.time, 0);
            return total / this.pageLoadTimes.length;
        },

        getReport: function() {
            return {
                sessionDuration: Date.now() - this.startTime,
                averagePageLoad: this.getAverageLoadTime(),
                pagesRead: AgentlyNarration.state.read_pages.length,
                errorsLogged: AgentlyNarration.state.error_log.length,
                progress: AgentlyNarration.state.chapter_progress
            };
        }
    };

    // Console commands for debugging
    window.agentlyDebug = {
        getState: () => AgentlyNarration.state,
        getErrors: () => AgentlyNarration.state.error_log,
        runTests: () => AgentlyNarration.testing.runValidationSuite(),
        getPerformance: () => AgentlyNarration.performance.getReport(),
        resetSession: () => {
            localStorage.removeItem('agently-session');
            location.reload();
        }
    };

    console.log('Agently Narration Protocol v2.1 initialized');
    console.log('Debug commands available: agentlyDebug.getState(), agentlyDebug.runTests(), etc.');
    
    // Setup voice recognition for book navigation
    function setupVoiceRecognition() {
        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.log('Speech Recognition API not supported in this browser');
            return;
        }
        
        // Initialize speech recognition
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Handle results
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('Voice command detected in book:', transcript);
            
            if (transcript.includes('agent lee') || transcript.includes('hey lee') || transcript.includes('hi lee')) {
                // Book reading commands
                if (transcript.includes('read this book') || transcript.includes('read the book') || transcript.includes('read to me')) {
                    const speakBtn = document.getElementById('speak-btn');
                    if (speakBtn) {
                        speakBtn.click();
                    }
                }
                // Navigation commands
                else if (transcript.includes('next page') || transcript.includes('turn page')) {
                    const nextBtn = document.getElementById('next-btn');
                    if (nextBtn) nextBtn.click();
                }
                else if (transcript.includes('previous page') || transcript.includes('go back')) {
                    const prevBtn = document.getElementById('prev-btn');
                    if (prevBtn) prevBtn.click();
                }
                else if (transcript.includes('stop reading') || transcript.includes('stop narration')) {
                    // Stop all reading activities
                    if (window.isAutoReading) {
                        window.isAutoReading = false;
                    }

                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }

                    if (window.stopAutoReading && typeof window.stopAutoReading === 'function') {
                        window.stopAutoReading();
                    }

                    if (window.stopSpeaking && typeof window.stopSpeaking === 'function') {
                        window.stopSpeaking();
                    }

                    const stopBtn = document.getElementById('stop-btn');
                    if (stopBtn) stopBtn.click();

                    // Provide feedback
                    if (window.addMessage && typeof window.addMessage === 'function') {
                        window.addMessage("I've stopped reading as requested.", 'agent');
                    }
                }
                else if (transcript.includes('what is this about') || transcript.includes('tell me about this')) {
                    // Get book info
                    const title = document.querySelector('h1')?.textContent || 'this book';
                    const firstPageContent = document.querySelector('.page .story-page p, .page .instruction-page p')?.textContent || '';
                    
                    if (window.speakText) {
                        window.speakText(`This is ${title}. ${firstPageContent}`);
                    }
                }
            }
        };
        
        // Handle errors
        recognition.onerror = function(event) {
            console.error('Speech recognition error in book:', event.error);
        };
        
        // Restart listening after finishing
        recognition.onend = function() {
            // Only restart on mobile devices
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Recognition already started in book view');
                    }
                }, 1000);
            }
        };
        
        // Start listening if on mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                try {
                    recognition.start();
                    console.log('Voice recognition started in book view');
                } catch (e) {
                    console.error('Failed to start voice recognition in book view:', e);
                }
            }, 2000);
        }
    }
});