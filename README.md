# Paper

A minimalist, distraction-free writing application designed for focus, clarity, and typographic elegance.

No setup, no accounts, and no extraneous chrome. Just an open page and your words.

---

## Overview

Paper is a lightweight, browser-based writing canvas crafted with a restrained black, white, and light grey aesthetic. Built for writers, note-takers, and thinkers who value clarity over clutter, Paper eliminates visual distractions so you can enter a state of deep flow.

The interface adheres to a text-first philosophy: icon-heavy toolbars have been replaced with quiet, typographic actions, and chrome elements automatically fade away into complete stillness the moment you begin typing.

---

## Key Features

### Distraction-Free Writing Canvas
- Dedicated Document Title: A prominent title field (`Title...`) sits atop the writing space, followed by the canvas (`Start Writing...`).
- Clean Minimal Interface: Navigation headers and metrics remain calm and uncluttered, with quiet grey controls and high-contrast tooltips.
- Auto-Hiding UI on Typing: Headers, footers, metrics, and floating bars fade out smoothly as soon as you type, and instantly reappear when pausing or moving the mouse.
- Smart Auto-Capitalization: Automatically capitalizes sentence starts, words following terminal punctuation, standalone "I", and common contractions like "I'll", "I'm", and "I'd".
- Zen Mode: Enter true full-screen isolation using `F11` or `Alt + Z`.

### Pure Typography
- Curated Font Families: Switch seamlessly between Sans (`Poppins`), Mono (`Cousine`), and Serif (`Lora`) typography.
- Proportional Layout: Text columns are bounded to optimal line-lengths (66 to 70 characters) for natural readability and typing rhythm.
- Scalable Canvas: Adjust font size across Small, Normal, Medium, and Large without breaking line height or rhythm.
- Dynamic Tab Title and Favicon: Browser tab reflects your document title in real time, and the favicon dynamically switches between a blank sheet and lined paper based on content presence.

### Writing Tools and Markdown
- Dual Mode Editing: Toggle effortlessly between visual rich-text and raw Markdown mode (`Ctrl + Shift + M`).
- Live Markdown Syntax:
  - Headings: `# `, `## `, `### `, `#### `
  - Lists: `- `, `* `, `+ `, `1. `
  - Checklists: `[ ] ` or `[x] ` for interactive task items
  - Quotes: `> `
  - Code blocks: ```` ``` ````
  - Horizontal rules: `---` or `***`
- Slash Command Menu: Press `/` at any time to open a quick-insert block menu.
- Floating Formatting Toolbar: Highlights selections to allow rapid styling without keyboard gymnastics.
- Audio Feedback: Optional subtle typewriter mechanical key click sounds generated via Web Audio API.

### Metrics and Goals
- Live Metric Pill: Displays word count, character count, and estimated reading time.
- Target Word Goal: Set a daily or per-document word target and track progress via an SVG ring progress indicator.

### Speech to Text
- Built-in Voice Dictation: Dictate your thoughts hands-free (`Ctrl + D`) with real-time waveform visualization and elapsed timer.

### Export and Portability
- Markdown (`.md`): Clean standard Markdown with front heading.
- Plain Text (`.txt`): Unformatted pure text.
- Standalone HTML (`.html`): Self-contained styled HTML file ready for publishing or sharing.
- PDF Document: Print-optimized layout that strips all interface elements and formats cleanly for paper.
- One-Click Clipboard Copy: Instantly copies entire document text.

### Privacy and Persistence
- 100% Client-Side: All notes and settings persist automatically to browser local storage.
- Zero Tracking: No telemetry, no external database dependencies, and no account requirements.

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Bold | `Ctrl + B` |
| Italic | `Ctrl + I` |
| Underline | `Ctrl + U` |
| Strikethrough | `Ctrl + Shift + X` |
| Inline Code | `Ctrl + E` |
| Insert Link | `Ctrl + K` |
| Slash Command Menu | `/` |
| New Document | `Ctrl + Alt + N` |
| Zen Mode | `Alt + Z` or `F11` |
| Toggle Dark/Light Theme | `Alt + T` |
| Toggle Markdown Mode | `Ctrl + Shift + M` |
| Editor Settings | `Ctrl + ,` |
| Export Document | `Ctrl + S` |
| Voice Dictation | `Ctrl + D` |
| Dismiss Modals / Close Menus | `Esc` |

---

## File Structure

```
Paper/
├── index.html     # Application markup, modals, and pre-paint theme script
├── styles.css     # Minimalist design tokens, responsive typography, print stylesheet
├── app.js         # Reactive state engine, Markdown parser, audio, and shortcuts
├── favicon.svg    # Vector icon for application tabs
└── README.md      # Project documentation
```

---

## Getting Started

Because Paper is built with vanilla web technologies, no build tools or package managers are required.

### Option 1: Direct File
Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Static Server
You can serve the directory using Python:

```bash
python -m http.server 3000
```

Then navigate to `http://localhost:3000` in your browser.

---

## License

This project is licensed under the MIT License.
