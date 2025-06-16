# YOUWARE Agent Guidelines

This is Leola's Library - a digital library and book collection website featuring interactive storytelling, crochet instruction books, and an AI assistant named Agent Lee.

## Project Architecture

### Core Components

**Main Entry Point**: `index.html` - Homepage featuring Leola's Library with book collection cards and Agent Lee integration

**Book System**: Individual HTML files represent complete interactive books with page-flipping functionality:
- Books use StPageFlip library for realistic page turning animations
- Each book should fill the entire viewport when opened for immersive reading
- Books integrate with Agent Lee for narration capabilities

**Agent Lee AI Assistant**: 
- Core files: `js/agent-lee.js` and `css/agent-lee.css`
- Appears as a minimizable floating card in bottom-right corner
- Provides narration using Web Speech Synthesis API with Microsoft Emma voice preference
- Can read individual pages or entire books automatically with page turning

### Key Technologies
- **StPageFlip**: Page-flip animations for book interfaces
- **Web Speech Synthesis**: Text-to-speech with voice selection
- **CSS Grid/Flexbox**: Responsive layouts
- **Vanilla JavaScript**: No external frameworks

## Important Implementation Details

### Book Structure
- Books must use full viewport dimensions (`100vw` x `100vh`) for immersive experience
- Remove all UI controls from within books - Agent Lee handles all interactions
- Use `data-density="hard"` for cover pages in StPageFlip
- Implement both `window.speakPageContent()` and `window.readEntireBook()` functions

### Agent Lee Voice Configuration
- Priority: Microsoft Emma > Emma (any) > Female voices
- Voice selection happens in `js/agent-lee.js` speakText function
- Set speech rate to 0.9 for comfortable listening
- Auto-page turning with 1.5s delays between pages for full book reading

### File Organization
- **Books**: Individual `.html` files (e.g., `d6jq33mv39.html` for "Needle & Yarn")
- **Images**: Direct in src root (PNG format for book covers and illustrations)  
- **Scripts**: `js/` directory contains Agent Lee functionality
- **Styles**: `css/` directory for global styles and Agent Lee appearance

### Book Integration Requirements
- Include `css/agent-lee.css` and `js/agent-lee.js` in all book pages
- Books should have no internal navigation controls
- Click interaction: left side = previous page, right side = next page
- Store `window.pageFlip` globally for Agent Lee integration

### Content Guidelines
- This is Sister Leola Lee's personal library featuring her stories and crochet guides
- Maintain family-friendly, educational content focus
- Books include both narrative stories and instructional content
- Each book should have proper cover and back cover images

## Development Commands
- Static HTML/CSS/JS site - no build process required
- Test locally by opening `index.html` in browser
- All functionality is client-side only

## Agent Lee Behavior
- Auto-minimizes and expands based on user interaction
- Speaks welcome message on page load
- Can read current page or entire book with automatic page progression
- Stops speaking when user navigates manually
- Provides consistent narration experience across all books