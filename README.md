# LIFE OF BLOCKS — V1.0

> **Keep every little thing in its own place.**

A minimal, spatial productivity web app floating over a 4K deep space environment, built with **smoked-glass tiles**, 100% **local client-side persistence** (LocalStorage + IndexedDB), tactile interactions, and zero clutter.

---

## Zero Setup Required

- **Pure Local Storage**: All Blocks, Todos, and Files are stored directly in your browser.
- **No accounts, no API keys, no configuration needed**: Works immediately out of the box offline or online.
- **IndexedDB for Files**: Store and download PDFs, documents, audio, videos, and images with no size limit issues.

---

## Visual & Interaction Highlights

- **Smoked Glass Architecture**:
  - `background: rgba(255, 255, 255, 0.06)`
  - `border: 1px solid rgba(255, 255, 255, 0.12)`
  - `backdrop-filter: blur(20px)`
  - Subtle white borders, inner highlights, soft shadows, slight depth, and smooth hover effects.
- **4K Space Environment**:
  - High-resolution deep space wallpaper with cinematic depth, stars, and cosmic clouds.
  - Subtle dark translucent overlay for optimal contrast and readability.
- **Minimal Core Workflow**:
  - **Main Screen**: `LIFE OF BLOCKS` → `+` → `BLOCKS` (Tiles with "3 / 5 completed" status).
  - **Create Block**: Small glass modal with Enter key submission and immediate display.
  - **Block View**: `←` Back button, `GATE 2027` title, `TODO` section, and `FILES` section.
- **Tactile Todo System**:
  - Small circular checkbox: Default `○`, Completed `✓` with small scale animation and subtle strike-through.
  - `+ Add Todo` inline input with Enter key submission.
  - Long-press (mobile) with animated circular progress indicator around the Todo.
  - Right-click (desktop) for the same `Edit` / `Delete` context menu.
  - Small confirmation modal before deleting a todo.
- **File Management**:
  - Compact glass file tiles with file-type icons (PDF, audio, video, image, documents, zip).
  - `+ Upload File` with small progress animation.
  - Direct local download and delete confirmation.

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) or [http://localhost:5174/](http://localhost:5174/) in your browser.
