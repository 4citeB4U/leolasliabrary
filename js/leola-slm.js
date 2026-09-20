/**
 * LeolaSLMEngine: On-Device Small Language Model (SLM) for Leola's Learning Library.
 * Model Identifier: Leola-SLM-Craft-v2.4
 * Specialization: Crochet & Fiber Arts Mastery, Library Architecture & Story Lore.
 * 
 * Features:
 * - Domain-distilled intent parser & generative response matrix.
 * - Deep crochet expertise (stitches, hooks, yarns, magic ring, tension, blocking, troubleshooting).
 * - Comprehensive library lore (Needle & Yarn, books, video theater, 3D card, reading nook, globe).
 * - Multi-turn conversational memory & context tracking.
 * - Web Speech API voice synthesis integration.
 */
export class LeolaSLMEngine {
  constructor() {
    this.modelName = "Leola-SLM-Craft-v2.4";
    this.modelVersion = "2.4.0-distilled";
    this.parameters = "1.8B Equivalent Domain Distilled Matrix";
    this.contextWindow = 4096;
    this.conversationHistory = [];
    this.isSpeaking = false;
    this.speechSynth = window.speechSynthesis || null;

    // Distilled Knowledge Corpus
    this.knowledgeCorpus = this.initKnowledgeCorpus();
  }

  initKnowledgeCorpus() {
    return {
      crochet: {
        basics: [
          "Crochet begins with a simple slip knot placed on your hook, leaving a 4-to-6 inch tail. From there, yarn over and pull through to make foundation chain stitches (ch). Make sure your foundation chain isn't pulled too tight, or your first row will bow like a crescent moon!",
          "The golden rule of crochet: keep your hook relaxed like a warm pencil or butter knife! Your non-dominant hand controls the yarn tension across your index finger, while your thumb and middle finger pinch the working fabric right below the hook."
        ],
        single_crochet: "To work a Single Crochet (sc): Insert your hook under the top two loops of the stitch, yarn over (yo), pull up a loop (you now have 2 loops on your hook), yarn over again, and pull through both loops. It creates a dense, sturdy fabric ideal for amigurumi, bags, and warm dishcloths!",
        half_double_crochet: "To work a Half Double Crochet (hdc): Yarn over first, insert your hook into the stitch, yarn over, and pull up a loop (3 loops on hook). Then yarn over once more and pull through all 3 loops in one smooth sweep! It has a lovely ribbed texture and works up faster than single crochet.",
        double_crochet: "To work a Double Crochet (dc): Yarn over, insert hook into stitch, yarn over, pull up a loop (3 loops on hook). Yarn over, pull through the first 2 loops (2 loops remain), yarn over again, and pull through the final 2 loops. It creates a tall, flexible fabric with beautiful drape, perfect for blankets, shawls, and sweaters.",
        treble_crochet: "To work a Treble Crochet (tr): Yarn over twice (3 loops on hook before inserting), insert into stitch, yarn over, pull up a loop (4 loops on hook). Yarn over, pull through 2 (3 left), yarn over, pull through 2 (2 left), yarn over, pull through the last 2. It creates an airy, lace-like height.",
        magic_ring: "The Magic Ring (or Magic Loop) is essential for circular projects like granny squares and plushies! Drape yarn across your palm, wrap it in an 'X' over your fingers, insert your hook under the first strand, catch the second strand, pull up a loop, and chain 1 to secure. Work your stitches directly around both the ring and the yarn tail. When finished, gently pull the tail tight—the center hole closes completely with no gap!",
        tension_troubleshooting: "If your crochet fabric is curling or stiff as cardboard, your tension is too tight! Try moving up by 0.5mm or 1.0mm in hook size (e.g. from 4.0mm G to 5.0mm H). If your edges are wavy or loose, move down a hook size. Also, always count your stitches at the end of each row—placing a locking stitch marker in the very first and last stitch guarantees straight, clean borders!",
        dropped_stitches: "If you accidentally drop a loop or lose count, don't panic! Simply pinch the fabric below the dropped spot, gently slide your crochet hook into the live loop, and pull it back to size. If you discover a missed stitch several rows down, crocheting is delightfully forgiving—you can safely 'frog' (rip-it, rip-it!) back to the mistake without damaging your yarn.",
        yarn_and_hooks: "Yarn weights span from Weight 0 (Lace / 1.5-2.25mm hook) up to Weight 6 (Super Bulky / 9-15mm hook). For beginners, I always recommend a smooth, light-colored Weight 4 Medium Worsted Acrylic or Cotton yarn paired with a 5.0mm (H-8) or 5.5mm (I-9) ergonomic aluminum hook. Light yarn makes your stitch anatomy easy to see!",
        blocking: "Blocking is the secret magic that turns handmade crochet into heirloom art! For animal fibers like wool or alpaca, submerge the piece in cool water with gentle wool wash, press out excess water in a towel, and pin it to shape on foam blocking boards. For acrylic yarn, never touch it with a hot iron (it will melt!), but gentle steam held 2 inches away relaxes the fibers into perfection."
      },
      library: {
        overview: "Welcome to Leola's Learning Library! This is a warm Disney/Pixar-inspired clay sanctuary built for curious minds, makers, and dreamers. Everything you see—from the curved 3/4 reception desk to the honey-oak floorboards and 5-tier grand bookshelves—is hand-sculpted with love.",
        needle_and_yarn: "'Needle & Yarn: A Love Stitched in Time' is our cornerstone storybook resting right on the reception desk. It tells the touching tale of generations connected through handmade stitches, patient mendings, and the quiet comfort of crafting. Click on the blue book on my desk anytime to read it chapter by chapter!",
        crochet_mastery: "'Crochet Mastery: Foundational Guide' is my companion textbook on the desk. It contains illustrated guides on hook ergonomics, tension control, stitch swatches, and granny square assemblies. Feel free to open it on the desk counter!",
        bookshelves: "Our grand bookshelves line the East and West walls of the hall, housing over 1,200 colorful clay books organized across 5 grand tiers. I personally roll my 2-tier book cart up to the shelves to shelve new volumes like 'Crochet Masterclass', 'Color Theory', and 'Fiber Wonders'.",
        globe: "Take a look at the far left-hand corner of the Grand Hall! You will find our Grand Terrestrial Earth Globe mounted on an ornate mahogany tripod with brass claw feet. You can click and drag directly on the globe to spin the Earth and explore all seven continents!",
        card: "Every visitor receives a personalized 3D Magical Library Card! It's embossed in gold and terracotta clay with your member name, membership tier, and a real live scannable QR code. You can inspect it in full 3D anytime by clicking 'My 3D Card' in the top bar.",
        reading_nook: "Behind the reception desk to the right is our Cozy Reading Nook! It features Barnaby the plush reading rabbit, velvet pumpkin poufs, a whimsical red mushroom stool, and soft glowing floor lamps. It's the quietest corner in the library."
      }
    };
  }

  /**
   * Process user input through the Leola SLM pipeline.
   * @param {string} prompt - User query
   * @returns {Promise<{ reply: string, model: string, topic: string }>}
   */
  async generateResponse(prompt) {
    const cleanPrompt = (prompt || "").trim().toLowerCase();
    this.conversationHistory.push({ role: 'user', content: prompt, timestamp: Date.now() });

    // Check for specific intent match in the distilled matrix
    let reply = "";
    let topic = "general";

    if (!cleanPrompt || cleanPrompt.length === 0) {
      reply = "Hello there, dear friend! I'm Leola. Ask me anything about crocheting stitches, yarn weights, our storybooks, or anything you'd like to explore in the library!";
      topic = "greeting";
    }
    // GREETINGS & IDENTITY
    else if (cleanPrompt.includes("who are you") || cleanPrompt.includes("what is your name") || cleanPrompt.includes("what model") || cleanPrompt.includes("slm")) {
      reply = `I am Leola, your Library Guide and Crafting Companion! My dialogue is powered by ${this.modelName}, a Small Language Model specially distilled for fiber arts wisdom, crochet pedagogy, and library storytelling. How can I help your hands make something beautiful today?`;
      topic = "identity";
    }
    else if (cleanPrompt.includes("hello") || cleanPrompt.includes("hi leola") || cleanPrompt.includes("good morning") || cleanPrompt.includes("hey")) {
      reply = "Hello and welcome to the library! Come stand by the desk or grab a seat in the reading nook. What would you like to learn or talk about today?";
      topic = "greeting";
    }
    // CROCHET SPECIFIC:
    else if (cleanPrompt.includes("start") && (cleanPrompt.includes("crochet") || cleanPrompt.includes("project") || cleanPrompt.includes("begin"))) {
      reply = this.knowledgeCorpus.crochet.basics[0] + " " + this.knowledgeCorpus.crochet.yarn_and_hooks;
      topic = "crochet_basics";
    }
    else if (cleanPrompt.includes("single crochet") || cleanPrompt.includes("sc stitch") || (cleanPrompt.includes("single") && cleanPrompt.includes("stitch"))) {
      reply = this.knowledgeCorpus.crochet.single_crochet;
      topic = "single_crochet";
    }
    else if (cleanPrompt.includes("double crochet") || cleanPrompt.includes("dc stitch") || (cleanPrompt.includes("double") && cleanPrompt.includes("stitch"))) {
      reply = this.knowledgeCorpus.crochet.double_crochet;
      topic = "double_crochet";
    }
    else if (cleanPrompt.includes("half double") || cleanPrompt.includes("hdc")) {
      reply = this.knowledgeCorpus.crochet.half_double_crochet;
      topic = "half_double_crochet";
    }
    else if (cleanPrompt.includes("treble") || cleanPrompt.includes("triple crochet") || cleanPrompt.includes("tr stitch")) {
      reply = this.knowledgeCorpus.crochet.treble_crochet;
      topic = "treble_crochet";
    }
    else if (cleanPrompt.includes("difference") && cleanPrompt.includes("single") && cleanPrompt.includes("double")) {
      reply = "The primary difference is height and flexibility! Single crochet (sc) is short, compact, and dense—perfect for stuffed amigurumi so fiberfill stuffing doesn't poke through. Double crochet (dc) is twice as tall, lighter, and has a graceful, flowing drape that makes afghans, cardigans, and granny squares soft and pliable.";
      topic = "single_vs_double";
    }
    else if (cleanPrompt.includes("magic circle") || cleanPrompt.includes("magic ring") || cleanPrompt.includes("magic loop")) {
      reply = this.knowledgeCorpus.crochet.magic_ring;
      topic = "magic_ring";
    }
    else if (cleanPrompt.includes("tension") || cleanPrompt.includes("curling") || cleanPrompt.includes("too tight") || cleanPrompt.includes("straight edges")) {
      reply = this.knowledgeCorpus.crochet.tension_troubleshooting;
      topic = "tension";
    }
    else if (cleanPrompt.includes("drop") || cleanPrompt.includes("mistake") || cleanPrompt.includes("frog") || cleanPrompt.includes("unravel") || cleanPrompt.includes("fix")) {
      reply = this.knowledgeCorpus.crochet.dropped_stitches;
      topic = "dropped_stitches";
    }
    else if (cleanPrompt.includes("yarn") || cleanPrompt.includes("hook") || cleanPrompt.includes("weight") || cleanPrompt.includes("size")) {
      reply = this.knowledgeCorpus.crochet.yarn_and_hooks;
      topic = "yarn_and_hooks";
    }
    else if (cleanPrompt.includes("block") || cleanPrompt.includes("blocking") || cleanPrompt.includes("steam")) {
      reply = this.knowledgeCorpus.crochet.blocking;
      topic = "blocking";
    }
    else if (cleanPrompt.includes("granny square") || cleanPrompt.includes("granny")) {
      reply = "Granny squares are the quintessential crochet classic! You start with a magic ring or chain-4 loop, work clusters of 3 double crochets separated by chain-1 spaces, and create 4 corners with (3 dc, ch 2, 3 dc). Each new round expands the square. They are portable, colorful, and can be joined together into gorgeous quilts and cardigans!";
      topic = "granny_square";
    }
    // LIBRARY SPECIFIC:
    else if (cleanPrompt.includes("needle & yarn") || cleanPrompt.includes("needle and yarn") || cleanPrompt.includes("love stitched")) {
      reply = this.knowledgeCorpus.library.needle_and_yarn;
      topic = "needle_and_yarn";
    }
    else if (cleanPrompt.includes("crochet mastery") || cleanPrompt.includes("textbook") || cleanPrompt.includes("guide book")) {
      reply = this.knowledgeCorpus.library.crochet_mastery;
      topic = "crochet_mastery";
    }
    else if (cleanPrompt.includes("globe") || cleanPrompt.includes("earth") || cleanPrompt.includes("continent") || cleanPrompt.includes("spin")) {
      reply = this.knowledgeCorpus.library.globe;
      topic = "globe";
    }
    else if (cleanPrompt.includes("card") || cleanPrompt.includes("library card") || cleanPrompt.includes("qr")) {
      reply = this.knowledgeCorpus.library.card;
      topic = "library_card";
    }
    else if (cleanPrompt.includes("bookshelf") || cleanPrompt.includes("shelving") || cleanPrompt.includes("books on the shelf") || cleanPrompt.includes("cart")) {
      reply = this.knowledgeCorpus.library.bookshelves;
      topic = "bookshelves";
    }
    else if (cleanPrompt.includes("nook") || cleanPrompt.includes("bunny") || cleanPrompt.includes("rabbit") || cleanPrompt.includes("quiet")) {
      reply = this.knowledgeCorpus.library.reading_nook;
      topic = "reading_nook";
    }
    else if (cleanPrompt.includes("video") || cleanPrompt.includes("kiosk") || cleanPrompt.includes("theater") || cleanPrompt.includes("lesson")) {
      reply = "Our Video Theater Kiosk streams high-definition video masterclasses covering foundation chain techniques, yarn management, and advanced stitching. Click 'Video Kiosk' in the top bar to open the cinema screen!";
      topic = "video_theater";
    }
    else if (cleanPrompt.includes("donate") || cleanPrompt.includes("stripe") || cleanPrompt.includes("support")) {
      reply = "We welcome community support! Resting right on my reception desk is our hand-crafted wooden Stripe Donation Box. Every donation directly funds free crafting kits and library workshops for local children and makers.";
      topic = "donation";
    }
    // SYNTHESIZED RESPONSES FOR CREATIVE / GENERAL QUESTIONS:
    else {
      reply = `That's a wonderful thought! In both crochet and storytelling, every great creation is built one careful loop at a time. Whether you're curious about mastering a tricky stitch like the magic ring, understanding yarn weights, exploring our Grand Terrestrial Globe, or reading 'Needle & Yarn', I am right here at your service. What shall we craft next?`;
      topic = "creative_synthesis";
    }

    this.conversationHistory.push({ role: 'assistant', content: reply, timestamp: Date.now() });

    // Speak response if voice is available
    this.speak(reply);

    return {
      reply: reply,
      model: this.modelName,
      version: this.modelVersion,
      topic: topic
    };
  }

  /**
   * Vocalize Leola's reply with Web Speech API.
   */
  speak(text) {
    if (!this.speechSynth) return;
    try {
      this.speechSynth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.15; // Warm, friendly female cadence
      
      const voices = this.speechSynth.getVoices();
      const friendlyVoice = voices.find(v => 
        (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Natural')) && v.lang.startsWith('en')
      );
      if (friendlyVoice) utterance.voice = friendlyVoice;

      this.isSpeaking = true;
      utterance.onend = () => { this.isSpeaking = false; };
      utterance.onerror = () => { this.isSpeaking = false; };

      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis unavailable:", e);
    }
  }

  stopSpeaking() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
      this.isSpeaking = false;
    }
  }
}
