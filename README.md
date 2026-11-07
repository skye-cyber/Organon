# Aristotle's Organon — Digital Book Reader

A complete, production-ready, and premium Book Reader application for Aristotle's **"Organon"** (the foundational logical treatises: *Categories*, *On Interpretation*, *Prior Analytics*, *Posterior Analytics*, *Topics*, and *On Sophistical Refutations*). Engineered as a modern publishing application inspired by Apple Books and Readwise, crafted for dense philosophical study.

---

## Features

### Distraction-Free Classical Reading
- **Golden Ratio Layout:** 65ch reading column designed for readability and focus.
- **Bekker Pagination:** Integrated Bekker numbering (e.g. `1a1`, `16a1`, `24a10`, `71a1`, `100a18`, `164a20`) alongside paragraph summaries.
- **Continuous Scroll & State Restoration:** Automatically saves and restores reading location by **Paragraph ID**, persisting exact position across sessions.
- **Sticky Sidebars & Delegated Scrolling:** Left (Table of Contents) and right (Notes & Intellect) panels stay stationary while scrolling is strictly delegated to the reading pane.
- **Custom Typography:** Full control over Typeface (Classical Serif, Modern Sans, Scholarly Mono), Font Size (14px–24px), Line Spacing (1.4–2.2x), and Column Width.
- **Refined Color Themes:**
  - **Light Mode:** Warm off-white / bookish sepia (`#F4F1EA`)
  - **Dark Mode:** Deep slate charcoal (`#1A1B1E`)
  - **Sepia Papyrus Mode:** Antique parchment (`#F7EFE2`)

### Scholarly Annotations & Highlights
- **Character-Level Anchoring:** Highlights anchor strictly to character offsets within paragraph IDs, remaining perfectly aligned across all font sizes, families, and screen dimensions.
- **Zero-Duplication Rendering:** Disjoint contiguous character mapping guarantees text never replicates or overlaps on re-highlighting.
- **Multi-Color Palettes:** Yellow, Blue, Red, and Green highlight shades.
- **Scholarly Notes:** Add inline commentaries and marginalia.
- **Academic Citations:** Single-click copy with formal Aristotelian citations (*e.g., "..." — Aristotle, Categories, Chapter 1 [1a1]*).
- **Starred Maxims:** Favorite individual paragraphs and propositions for rapid reference.

### "My Mind" Contextual Synthesis & Reading Goals
- **Unified Feed:** Chronological stream of all highlights and notes with instantaneous jump-to-context navigation.
- **My Mind Dashboard:** Automatically categorizes marginalia by treatise and chapter, providing a conceptual mind map of your thoughts.
- **Reading Goals Tracker:** Visual tracker measuring daily words read, paragraphs completed, reading streak, and minutes spent.

### Dual Search Engine
- **Local Full-Text Search (Fuse.js):** Fast fuzzy search with highlighted context snippets and treatise filtering.
- **Semantic Search (@xenova/transformers):** On-device neural search generating query embeddings and comparing cosine similarities against pre-computed paragraph vectors.

### Classical Lexicon & Inline Dictionary
- Highlighting any term and tapping **Define** brings up an inline card with:
  - Curated Aristotelian lexicon entries (*Homonym, Synonym, Paronym, Syllogism, Endoxa, Nous, Episteme, Barbara, Celarent*)
  - Free Dictionary API definitions, phonetics, and speech pronunciation
  - Encyclopedic Wikipedia context

### Zen Focus Mode
- Press `Z` or tap **Focus** to hide all toolbars and sidebars, dimming inactive paragraphs and spotlighting the active paragraph.

### Android & Mobile Optimizations
- **Mobile Gesture Navigation:**
  - **Swipe Right (L &rarr; R):** Closes Notes panel if open, otherwise opens Table of Contents.
  - **Swipe Left (R &rarr; L):** Closes Table of Contents if open, otherwise opens Notes panel.
  - **Mutually Exclusive:** Ensures only one drawer is active on mobile screens at any time.
- **Ergonomic Bottom Bar:** Single-thumb access to Contents, Search, Focus, and Notes.
- **Safe-Area Insets:** Edge-to-edge support with notch and status bar padding (`viewport-fit=cover`).
- **Resilient Offline Storage:** Canonical Aristotelian data compiled directly into the binary with zero network dependencies.

### 🖥️ Desktop System Tray & Global Shortcuts
- **System Tray:** Minimized background tray icon with *Show Organon*, *Toggle Focus Mode*, and *Quit*.
- **Close-to-Tray:** Window close button hides to system tray rather than killing the app.
- **Global Shortcuts:**
  - `F11`: Toggle Fullscreen
  - `F12`: Toggle Web Inspector / Devtools (debug builds)
  - `Ctrl+Alt+O` / `Cmd+Alt+O`: Quick summon Organon window

---

## In-App Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl` / `⌘` + `F` | Open Search Dialog (Full-Text & Semantic) |
| `Ctrl` / `⌘` + `\` | Toggle Table of Contents drawer |
| `Ctrl` / `⌘` + `M` | Toggle Notes & Marginalia drawer |
| `Z` | Toggle Zen Focus Mode |
| `J` / `K` | Scroll to Next / Previous paragraph |
| `T` | Open Typography & Theme Popover |
| `Esc` | Close open modals or exit Zen Mode |
| `?` | Open Keyboard Shortcuts Reference |

---

## Architecture & Project Structure

```
Organon/
├── data/
│   ├── organon.json            # Canonical hierarchical schema mock
│   ├── organon_english.json    # Complete 6 treatises with paragraph IDs
│   └── embeddings.json         # Dense semantic vectors for search
├── src/
│   ├── components/             # React modular UI components
│   │   ├── Header.tsx
│   │   ├── Reader.tsx
│   │   ├── SidebarTOC.tsx
│   │   ├── NotesPanel.tsx
│   │   ├── SelectionPopover.tsx
│   │   ├── SearchModal.tsx
│   │   ├── TypographyPopover.tsx
│   │   ├── DictionaryModal.tsx
│   │   ├── ZenModeControls.tsx
│   │   ├── ReadingProgress.tsx
│   │   └── KeyboardShortcutsModal.tsx
│   ├── lib/
│   │   ├── tauriApi.ts         # IPC bridge with fallback
│   │   ├── semanticSearch.ts   # @xenova/transformers cosine similarity
│   │   └── dictionaryApi.ts    # Lexicon & Wikipedia lookup
│   ├── store/
│   │   └── readerStore.ts      # Zustand state store
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx
│   └── index.css               # TailwindCSS v4 with theme variables
├── src-tauri/
│   ├── capabilities/           # Tauri v2 permission capabilities
│   ├── icons/                  # Application icons
│   ├── src/
│   │   ├── main.rs             # Tauri runner
│   │   ├── lib.rs              # Tauri setup, system tray, global shortcuts
│   │   ├── commands.rs         # JSON dataset loader & search handlers
│   │   └── db.rs               # Bundled SQLite database persistence
│   ├── Cargo.toml
│   └── tauri.conf.json         # Tauri v2 configuration
├── package.json
└── vite.config.ts
```

---

## Building & Running

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (v1.77+)
- For Android: [Android Studio / SDK](https://developer.android.com/studio) & NDK

### 1. Web Development
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

### 2. Desktop Application (Linux, macOS, Windows)
```bash
# Run in desktop development mode
npm run dev:tauri

# Build desktop release binary
cargo build --release --manifest-path src-tauri/Cargo.toml
```

### 3. Android Build (APK & AAB)
```bash
# Set Android SDK and NDK environment variables
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/27.1.12297006"

# Initialize Android target (if not already initialized)
npx tauri android init

# Build APK (Debug or Release)
npx tauri android build --apk
```
The output `.apk` file will be generated in `src-tauri/gen/android/app/build/outputs/apk/`.

---

## License
    Copyright (C) <2026>  <wambua>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
