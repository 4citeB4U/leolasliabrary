const CACHE_NAME = 'leolas-library-cache-v2'; // Updated cache name for new content
// Initialize Agent Lee welcoming behavior
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Ensure Agent Lee welcomes visitors when they enter the library
        if (!window.agentLeeHasGreeted && 
            (window.location.pathname.includes('index.html') || 
             window.location.pathname.endsWith('/'))) {
            window.agentLeeHasGreeted = true;
            setTimeout(() => {
                // Find the Agent Lee chat area and add the welcome message
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    const emptyMessage = document.getElementById('empty-message');
                    if (emptyMessage) {
                        emptyMessage.style.display = 'none';
                    }
                    
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message');
                    messageElement.classList.add('agent-message');
                    messageElement.textContent = "Welcome to Leola's Library. I am your helpful librarian, Agent Lee.";
                    
                    chatMessages.appendChild(messageElement);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Instead of directly speaking here, we'll rely on the agent-lee.js implementation
                    // which has more robust voice handling and fallbacks
                    window.pendingWelcomeMessage = `Welcome to Leola's Library. I am your helpful librarian, Agent Lee.
Here, every page holds a purpose — and every stitch, a story.

Today, you're entering a world lovingly woven by the hands and heart of Miss Leola, Sister Lee — a mother, grandmother, great-grandmother, artist, and teacher whose wisdom is stitched into every chapter.

In this special collection, you'll find two powerful journeys:

'Needle & Yarn: A Love Story Stitched Through Time' – an emotional, poetic tale that threads faith, healing, and soul-deep connection into a beautiful narrative of love and legacy.

'Crochet Mastery: A Complete Guide' – your personal workshop with Sister Lee herself. Whether you're just learning your first chain stitch or mastering advanced techniques, this book will guide you step-by-step with clear instructions, warm encouragement, and even interactive badges to celebrate your growth.

Here at Leola's Library, you'll feel at home — whether you're turning the pages of a heartfelt story, picking up a new skill, or simply looking for inspiration.

So relax, take your time, and let me guide you through.
If you ever need help, just tap or call for Agent Lee. I'll be right here with you, every step of the way.

Let's begin this journey together — welcome to the family.`;
                    
                    // If we already have a speakText function defined, use it
                    if (typeof window.speakText === 'function') {
                        window.speakText(window.pendingWelcomeMessage);
                        window.pendingWelcomeMessage = null;
                    }
                    // Otherwise agent-lee.js will pick it up when it loads
                }
            }, 2000); // Slight delay to ensure DOM is ready
        }
    });
}
const urlsToCache = [
    './', // Or index.html
    './index.html',
    './js/agent-lee.js',
    './js/book-narration.js',
    './needle-yarn.html',
    './crochet-mastery.html',
    './games/crochet-simulator.html',
    './games/stitch-match.html',
    './wredcgkz8w.html',
    // CSS
    './css/agent-lee.css',
    // Images that are used in the website
    './bmmq6xrkp3.png', // Logo
    './ruu3udr62d.png', // Needle & Yarn Cover
    './jva31043ou.png', // Crochet Mastery Cover
    './bhxud9qhuc.png', // Crochet Adventures Game
    './pqodhiogec.png', // Stitch Match Game
    './n5j7pqx39a.png', // Sister Lee in Glass
    './gdpjskd0z4.png', // Sister Lee outdoors
    './0mvlpz8gmx.png', // Sister Lee smiling
    './9ckfdwxdq0.png', // Sister Lee with coffee
    './xhabe2hpi5.png', // Sister Lee in coat
    './u8eqt4ylp2.png', // The First Hello
    './itj0aomnfz.png', // Working Together
    './9k1ycnd7fw.png', // The Break
    './rr18389x35.png', // The Return
    './v1t33f8eyx.png', // You're Part of the Pattern
    // CDNs - use no-cors if there are issues, but try direct caching first
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18/umd/react.development.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.js',
    'https://cdn.jsdelivr.net/npm/page-flip/dist/css/page-flip.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // For CDN assets, 'no-cors' might be needed if they don't support CORS for caching
                // However, try without it first as 'no-cors' responses are opaque and less useful
                const requests = urlsToCache.map(url => {
                    if (url.startsWith('https://picsum.photos')) { // picsum often has issues with SW caching due to redirects or CORS
                        return new Request(url, { mode: 'no-cors' });
                    }
                    return new Request(url);
                });
                return cache.addAll(requests);
            })
            .catch(err => {
                console.error('Failed to open cache or add URLs: ', err);
                urlsToCache.forEach(url => { // Log individual failures
                    fetch(new Request(url, url.startsWith('https://picsum.photos') ? {mode: 'no-cors'} : {} ))
                        .catch(e => console.error(`Failed to fetch ${url} during pre-cache:`, e));
                });
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    // For navigation requests (HTML), try network first, then cache.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.ok) { // Check if response is valid
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                    // If network fails or returns an error, try the cache
                    return caches.match(event.request).then(cachedResponse => {
                        return cachedResponse || fetch(event.request); // Fallback to network again if not in cache (e.g. initial load error)
                    });
                })
                .catch(() => {
                    return caches.match(event.request).then(cachedResponse => {
                         // If not in cache and network failed, this will be undefined.
                         // Consider returning a custom offline page here if event.request.url is index.html
                        return cachedResponse;
                    });
                })
        );
        return;
    }

    // For other requests (CSS, JS, images), use CacheFirst strategy
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) { // Cache hit
                    return response;
                }
                // Not in cache - fetch from network, then cache it
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response (even for no-cors, check basic presence)
                        if (!networkResponse || networkResponse.status !== 200 && networkResponse.type !== 'opaque') {
                             // Don't cache error responses or invalid opaque responses
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Fetching failed for:', event.request.url, error);
                    // Optionally return a fallback asset, e.g., a placeholder image
                });
            })
    );
});