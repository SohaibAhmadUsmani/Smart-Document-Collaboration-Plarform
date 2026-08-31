# Document Editor Module (DocSync Pro Frontend)

**Owner:** Muzammil  
**Architecture:** Modern React 19 + TipTap (ProseMirror AST) WYSIWYG Editor Suite with headless hooks, atomic Optimistic Concurrency Control (OCC) debounced autosave, and multi-tier fuzzy comment anchoring.

---

### English Architecture Overview
The Document Editor module provides a collaborative rich-text authoring experience:
- **Canvas & Sheet Architecture:** Fluid, tactile paper document sheet (`PaperDocumentSheet.jsx`) with responsive padding, drag-and-drop file ingestion, automatic object URL garbage collection, and StrictMode hydration guards.
- **TipTap / ProseMirror Schema:** Custom extensions for Tables, Callouts, Code Blocks with syntax highlights, File Attachments, User Mentions, and Inline Comment Marks.
- **Debounced Autosave Engine (`useAutosave.js`):** 1500ms debounce interval with an offline `localStorage` queue that automatically syncs on network recovery and detects 409 OCC version conflicts.
- **Fuzzy Comment Anchoring (`fuzzyAnchorMatcher.js`):** 3-stage heuristic matching (exact offset, prefix/suffix context, and closest occurrence) preventing anchor loss during concurrent edits.
- **Contextual Ribbons & Palettes:** Floating formatting toolbar (`FormattingToolbar.jsx`), slash command palette (`SlashCommandMenu.jsx`), table cell action menu (`TableCellMenu.jsx`), and selection bubble menu (`BubbleFloatingMenu.jsx`).

---

### [ROMAN URDU]: Roman Urdu Architecture Overview
Yeh module DocSync Pro ke rich-text editor ka frontend architecture handle karta hai:
- **Paper Document Canvas:** Responsive tactile paper sheet jo mobile aur desktop dono par flawless render hoti hai. Drag & drop file uploads aur blob URL memory cleanup handle karta hai.
- **TipTap Extensions:** Tables, Callouts (> [!INFO]), Preformatted Code Blocks, File Attachments, User Mentions, aur Comment Marks ka customized ProseMirror schema.
- **Atomic Autosave Engine:** 1500ms debounce ke sath changes save karta hai. Internet disconnect hone par browser `localStorage` mein queue banata hai aur 409 version mismatch par collision detect karta hai.
- **3-Stage Fuzzy Comment Anchoring:** Text edit hone par comment highlights ko unke sahi maqam par barkarar rakhta hai (Prefix/Suffix Context + Nearest Match).
- **Floating Menus:** Text select karne par Bubble Menu, `/` dabane par Slash Command Palette, aur table cells ke liye Table Action Ribbon.
