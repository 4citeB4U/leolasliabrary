# MASTER BLUEPRINT: INTERACTIVE FLIPBOOK EXPERIENCES

## I. GLOBAL SETUP (Handled by `index.html` and its JavaScript)

### A. Landing Screen / Portal (`index.html`)
- **Visual:** Two distinct book cards:
  - **"Needle & Yarn":** Warm, cozy aesthetic, cover image (`NeedleandYarn.png`), subtle ambient sound
  - **"Crochet Mastery":** Clean, modern aesthetic, cover image (`CrochetMaster.png`), subtle animation
- **Interaction:** Clicking a book card launches the respective flipbook
- **Features:** Site-wide narrator ("Agent Lee" intro), support modal, video resource center, QR code, main settings modal

### B. Flipbook Viewer (Dynamically launched within `index.html`)
- A modal/overlay that takes over the screen for the flipbook
- Header with book title and close button
- Main container for `StPageFlip` instance
- Control bar for: Previous/Next Page, Play/Pause Page Narration, Page X of Y display
- (Optional) Buttons for: Table of Contents, Zoom, Toggle Auto-Read/Auto-Turn

### C. Shared JavaScript Logic (in `index.html`)
- `StPageFlip` initialization and management
- Fetching and parsing content from `_FullContent.html` files
- Web Speech API integration (core `speakText` function, voice selection, speed control)
- Logic for interactive task types (quiz, drag-drop)
- Badge unlocking system
- `localStorage` for user progress, reflections, and settings

## II. 📘 "Needle & Yarn: A Love Stitched in Time" - Flipbook Experience

- **Theme:** Warm, cozy, vintage, storybook. Soft, painterly illustrations. Gentle animations. Heartwarming background music
- **Narration Style:** "Agent Lee" with a gentle, storytelling tone. Distinct character voices for Needle & Yarn

### Page 1: Cover
- **Visual:** `NeedleandYarn.png` (Needle & Yarn with heart). Warm, textured page background. Whimsical title font
- **Narration:** "Welcome, dear friend, to a story of thread and tenderness... Come with me."
- **Interaction:** Tap/click to turn. Subtle animation on characters/heart

### Page 2: "Leola's Hands"
- **Visual:** `LeolasBasket_SistaLeeHolding.png`. Warm lighting
- **Narration:** "Leola's fingers moved like memory itself... inside her basket, magic waited quietly."
- **Sound:** Soft background music begins
- **Interaction:** Slight shimmer on basket contents

### Page 3: "The First Hello" (A Tangled Beginning)
- **Visual:** `NeedleYarn_Meeting.png`
- **Animation:** Sparkles on character speech
- **Narration:** Dialogue between Yarn (flustered) and Needle (calm)
- **Interaction:** Hover/click icons near Yarn for alternative "shy thought" audio

### Page 4: "Working Together" (The First Stitches)
- **Visual:** `NeedleYarn_FirstStitches.png` (swatch forming)
- **Animation:** Swatch subtly grows with task interaction
- **Narration:** Explaining the scene and partnership
- **Mini Task (Challenge Mode ON):** "Can you help Needle finish this chain stitch?" (Drag virtual loops into sequence)
  - **Feedback:** Positive/negative sounds, visual confirmation. Page turnable on success

### Page 5: "The Break" (A Snag in the Thread)
- **Visual:** `NeedleandYarn_Scared.png`. Dimmer, muted atmosphere. Yarn's sparkle fades
- **Narration:** Somber tone, describes Needle breaking, sound effect (*snap*). Emotional pause
- **Interaction:** "Replay this moment?" button appears after narration

### Page 6: "The Return" (Mended and Magnificent)
- **Visual:** Image showing mended Needle, joyful Yarn
- **Animation:** Yarn glows brighter. Celebratory sparkles
- **Narration:** Hopeful then joyful tone. Dialogue of reunion. Happy musical swell

### Page 7 (or Last Story Page): "You're Part of the Pattern" (A Gift Stitched with Love)
- **Visual:** Completed hat/project
- **Narration:** Reflective, on the meaning of their creation
- **Interactive Task (Quiz):** "What do you think Yarn meant by their creations being 'a gift for others'?" (Free response)
- **Badge:** "Cozy Stitcher" badge awarded on saving reflection
- **Final Narration:** Concluding thoughts, soft music fades

## III. 📗 "Crochet Mastery: A Complete Guide" - Flipbook Experience

- **Theme:** Clean, modern, instructional, clear. Well-lit, realistic photos/diagrams. Minimal, focused sound design
- **Narration Style:** "Agent Lee" with an authoritative, clear, encouraging tone

### Page 1: Cover
- **Visual:** Elegant layout, `CrochetMaster.png` (grid of crochet samples). Clean background. Modern title font
- **Narration:** "Welcome to Crochet Mastery... Your journey into the heart of crochet begins now."
- **Interaction:** Subtle animation on title/swatches

### Page 2: Tools & Materials ("Getting Started: Your Essential Toolkit")
- **Visual:** Organized flat lay of tools/yarns with numbered callouts (hooks, yarn types, notions)
- **Narration:** Explaining the toolkit
- **Interactive Task (Drag-and-Drop):** "Match the Hook to its Yarn Weight."
- **Badge:** "Ready to Stitch" badge on completion

### Page 3: First Stitches – Chain & Single Crochet ("The Foundation: Ch & SC")
- **Visual:** Clear, step-by-step photos/illustrations for Slip Knot, Chain Stitch, and Single Crochet
- **Narration:** Slow, clear, step-by-step instructions for each
- **Interactive Task (Typing Practice):** "Type the stitch abbreviations: `ch, sc, ch, sc…`"

### Page 4: Exploring Basic Stitches
- **Visual:** Grid of clearly labeled crocheted swatches (sc, hdc, dc, tr)
- **Interaction:** Tap swatch for narration and a pop-up showing a looping GIF/video of the stitch

### Page 5: Stitch Knowledge Check!
- **Narration:** Recap of stitch properties, leading to quiz
- **Interactive Task (Mini Quiz):** "Which stitch makes the [densest/warmest] fabric?" (Multiple choice)
  - **Feedback:** Correct/incorrect messages

### Page 6: Adding Flair: Colorwork
- **Visual:** Examples of Fair Isle & Intarsia. Diagrams for changing colors, floats, bobbins
- **Narration:** Explaining Fair Isle vs. Intarsia, how to change colors

### Page 7: Creating Dimension: Textured Stitches
- **Visual:** Swatches of Bobbles, Popcorns, Post stitches. Step-by-step for one (e.g., Bobble)
- **Narration:** Explaining textured stitches
- **Interactive Task (Digital Swatch Coloring):** Simple line drawing of a swatch, user clicks palette to color sections

### Page 8: Bringing Characters to Life: Amigurumi
- **Visual:** Collection of finished amigurumi. Icons/text for Magic Ring, Working in Rounds, Invisible Decrease, Stuffing
- **Narration:** Introduction to amigurumi

### Page 9: Your Next Adventure: Advanced Projects
- **Visual:** Inspiring images of lace shawls, cabled sweaters. "Download Pattern" button for a beginner amigurumi PDF
- **Interaction:** Download button
- **Badge:** "Amigurumi Apprentice" badge on download

### Page 10: Review & Glossary ("Crochet Wisdom: Key Terms")
- **Visual:** Clickable/flippable "cards," each with a crochet term on the front
- **Interaction:** Click card to flip, revealing definition on the back
- **Narration:** Mini voice explanation for each term when flipped

### Page 11 (or relevant pages): Yarn Guide Resource
- **Content:** Yarn Fibers, Yarn Weights (with chart)
- **Interactive Tool: "Yarn Weight & Hook Matcher"**
- **Visual:** Yarn label explained with callouts

### Page 12 (or relevant pages): Hook Sizes Resource
- **Content:** Hook Anatomy, Sizing Systems (Metric, US, UK chart), Materials
- **Interactive Tool: "Hook Conversion Tool"**

### Page 13+ (or integrated): Stitch Library Resource
- **Content:** Detailed step-by-step for individual stitches
- **Visual:** Step-by-step photos/diagrams AND short looping video/GIF for each stitch
- **Quick Info:** "Common Uses" list for each stitch

### Page 14 (or integrated): Understanding Crochet Patterns Resource
- **Content:** Common Abbreviations, Decoding Instructions, Reading Charts
- **Interactive Tool: "Abbreviation Lookup Tool"**

### Page 15 (or integrated): FAQ Resource
- **Content:** Common Q&A, Troubleshooting Tips
- **Interaction (Optional):** Icons linking back to relevant instructional pages

### Page 16 (or near end): Quick Reference Sheets
- **Content:** Links to download printable PDFs
- **Interaction:** "Download PDF" buttons

### Final Page: Certificate & Share Prompt
- **Visual:** Celebratory design, confetti animation, "Certificate of Crochet Mastery" image
- **Narration:** Congratulatory message
- **Interaction:** Optional name input, download certificate button, share buttons
- **Badge:** "Crochet Explorer" badge awarded