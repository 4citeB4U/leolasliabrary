import { stateManager } from './state-manager.js';

const BOOK_TITLES = {
  'needle-and-yarn': 'Needle & Yarn: Foundations of Handcraft',
  'crochet-mastery': 'Crochet Mastery: Patterns, Tension & Form'
};

const CHAPTER_PAGES = {
  'needle-and-yarn': [
    "Welcome to Needle & Yarn. In your hands rests one of humanity's oldest technologies: looping fiber into warmth and structure.",
    "Chapter 1: The Anatomy of Fiber. Wool, cotton, alpaca, and linen each respond differently to humidity, tension, and twist.",
    "Chapter 2: Casting On. Place your slip knot gently on the needle. Do not choke the wood or metal; allow the loop room to breathe.",
    "Chapter 3: The Knit Stitch. Needle through the front door, wrap the yarn around back, pull through the window, and off jumps Jack.",
    "Chapter 4: The Purl Stitch. Bringing yarn forward, we invert the stitch architecture, creating texture and elastic ribbing.",
    "Chapter 5: Reading Your Work. Learn to inspect the rows beneath your needles. Every loop tells the story of your tension."
  ],
  'crochet-mastery': [
    "Welcome to Crochet Mastery. With a single hook and unbroken thread, geometric wonder unfolds.",
    "Chapter 1: Choosing Your Hook. Clay handles, inline hooks, and tapered tips balance weight and grip ergonomically.",
    "Chapter 2: The Foundation Chain. Keep your tension relaxed. A tight foundation chain creates an arch that resists subsequent rows.",
    "Chapter 3: Single & Double Crochet. The fundamental height steps. Notice how yarn over controls the vertical rise of the fabric.",
    "Chapter 4: Magic Ring Mastery. Pulling six single crochets into an adjustable center ring for amigurumi and circular motifs.",
    "Chapter 5: Sculpting in 3D. Increasing and invisible decreasing let you mold three-dimensional yarn characters with precision."
  ]
};

export class BookReader {
  constructor(bookId, containerElement) {
    this.bookId = bookId;
    this.container = containerElement;
    this.currentPage = 1;
    this.totalPages = 12;
    this.init();
  }

  async init() {
    await stateManager.ready;
    const savedState = stateManager.snapshot().books[this.bookId];
    if (savedState && savedState.page) {
      this.currentPage = savedState.page;
    }

    this.renderPage(this.currentPage);
    this.setupInteractions();
    this.updateGuidance();
  }

  setupInteractions() {
    document.getElementById('btn-next')?.addEventListener('click', () => this.turnPage(this.currentPage + 1));
    document.getElementById('btn-prev')?.addEventListener('click', () => this.turnPage(this.currentPage - 1));
    
    const bookmarkBtn = document.getElementById('btn-bookmark');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', async () => {
        await stateManager.setBook(this.bookId, { page: this.currentPage, bookmarked: true });
        bookmarkBtn.textContent = '★ Bookmarked!';
        setTimeout(() => {
          bookmarkBtn.textContent = 'Bookmark';
        }, 1600);
        this.updateGuidance(`Bookmark saved at page ${this.currentPage} in "${BOOK_TITLES[this.bookId] || this.bookId}".`);
      });
    }
  }

  async turnPage(newPage) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.currentPage = newPage;
    this.renderPage(this.currentPage);
    await stateManager.setBook(this.bookId, { page: this.currentPage });
  }

  renderPage(page) {
    const title = BOOK_TITLES[this.bookId] || `Book: ${this.bookId}`;
    const pages = CHAPTER_PAGES[this.bookId] || [];
    const text = pages[page - 1] || `Chapter ${page}: Continuing the study of fiber geometry, stitch repetition, and artisan methods. Every crafted row builds durable knowledge.`;

    const titleEl = document.getElementById('book-title');
    const contentEl = document.getElementById('page-content');

    if (titleEl) titleEl.textContent = title;
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; color: var(--clay-leaf); margin-bottom: 8px;">
          Section ${page} of ${this.totalPages}
        </div>
        <p style="font-size: 1.25rem; line-height: 1.7; margin: 0; color: var(--clay-wood-dark);">
          ${text}
        </p>
      `;
    }

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.disabled = (page <= 1);
    if (nextBtn) nextBtn.disabled = (page >= this.totalPages);
  }

  updateGuidance(customMessage) {
    const bubble = document.getElementById('leola-guidance');
    if (bubble) {
      const state = stateManager.snapshot();
      const guestName = state.guest?.name ? `${state.guest.name}, ` : '';
      bubble.textContent = customMessage || `${guestName}take your time turning each page. Handcraft is best learned with steady hands.`;
    }
  }
}

// Auto-init
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('book') || 'needle-and-yarn';
const container = document.getElementById('book-pages');
if (container) new BookReader(bookId, container);
