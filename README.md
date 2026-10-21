# Life of Blocks

> **"Your life. In blocks."**  
> An ultra-premium spatial operating system and life-management platform built around the philosophy that life is best lived and achieved by organizing priorities into focused visual workspaces.

---

## 🌟 Philosophy & Vision

Instead of a monolithic, uninspiring todo list, **Life of Blocks** divides a person's life into distinct visual rooms called **Blocks** (e.g., *GATE 2027*, *Music & Sound*, *Projects & Systems*, *Fitness & Vitality*).

Each Block acts as its own dedicated workspace containing:
- **Tasks & Micro-Progressions** (Priorities, Due Dates, Smooth morphing check animations, Velocity tracking)
- **Knowledge Notes & Briefs** (Markdown editor, instant preview, rich formulas & code blocks)
- **Files & Media Attachments** (PDFs, Images, Video, Audio, Source Code, Documents)
- **Custom Immersive Fullscreen Viewers** (Pan/zoom images, interactive multi-page PDF document viewer, HTML5 video controls, waveform audio player, syntax-highlighted code inspector)
- **Visual Analytics & Overview** (Completion rate, pending metrics, storage footprint)

---

## 🎨 Visual Identity & Aesthetic

- **Spatial Glass & Liquid Surfaces**: Layered translucent surfaces with soft specular rim highlights, dynamic backdrop blur, and custom atmospheric glow.
- **Cosmic Environment Engine**: Live animated starfield particle engine drifting across high-resolution cosmic nebulae (Nebula Aurora, Deep Cosmos, Supernova Core, Cosmic Void, Emerald Galaxy).
- **Spatial Sound & Haptic Feedback**: Zero-latency synthesized Web Audio API spatial chime chords and tactile mobile vibrations on completions.
- **Apple iOS / visionOS Inspired Typography**: Clean sans-serif hierarchy, compact metadata pills, minimal noise.

---

## 📱 Deliverables & Build Artifacts

This project delivers both the **production-ready web platform** and the **native Android application (APK & AAB)**:

| Artifact | Location | Size | Description |
|---|---|---|---|
| **Android APK** | [`release/LifeOfBlocks.apk`](./release/LifeOfBlocks.apk) | ~3.9 MB | Standalone Android APK ready to install on any Android phone / emulator. |
| **Android App Bundle (AAB)** | [`release/LifeOfBlocks.aab`](./release/LifeOfBlocks.aab) | ~3.3 MB | Optimized Google Play Store distribution bundle. |
| **Production Website Build** | [`dist/`](./dist/) | ~360 KB | Production-ready, tree-shaken static web build for any static host. |

---

## 🚀 Running & Developing Locally

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20.18.0)
- **npm**: 10+
- **JDK**: Java 21+
- **Android SDK**: API 34+

### 2. Website Development Server
```bash
# Start local Vite development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Website Production Build
```bash
npm run build
```
Generates production assets in `dist/`.

### 4. Android Build via Capacitor & Gradle
```bash
# Sync web build to Android project
npm run cap:sync

# Build standalone Android APK
cd android
gradle assembleDebug
```
The resulting APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔒 Privacy & Offline Capabilities

- **100% Local-First Storage**: Powered by browser `IndexedDB`. All blocks, tasks, notes, files, and settings persist locally on your device across sessions.
- **Zero Third-Party Trackers**: No analytics, telemetry, or external server telemetry.
- **Full Data Portability**: Instant one-click JSON backup export and restore in Settings.

---

## 📁 Project Architecture

```
Blocks Of Life/
├── android/                   # Native Android Studio / Gradle Project
│   ├── app/                   # Android App Module (Package: com.msr.lifeofblocks)
│   │   ├── build/outputs/     # Generated APK & AAB builds
│   │   └── src/main/          # Native Java, AndroidManifest.xml, Res
│   └── build.gradle           # Top-level Gradle configuration
├── dist/                      # Production compiled web assets
├── release/                   # Release artifacts
│   ├── LifeOfBlocks.apk       # Android APK installer
│   └── LifeOfBlocks.aab       # Android Play Bundle
├── src/
│   ├── components/
│   │   ├── attachments/       # FullscreenViewer, AttachmentCard, UploadModal
│   │   ├── blocks/            # BlockCard, BlockList, BlockModal
│   │   ├── layout/            # CosmicBackground, Header, MobileNavBar
│   │   ├── search/            # GlobalSearchModal (⌘K spotlight)
│   │   ├── settings/          # SettingsModal (Wallpapers, Audio, Backup)
│   │   ├── ui/                # GlassCard, GlassButton, CircularProgress
│   │   └── workspace/         # BlockWorkspace, TasksSection, NotesSection, etc.
│   ├── services/              # SoundService, HapticsService, PlatformService
│   ├── storage/               # db.ts (IndexedDB, Seed Data, JSON Import/Export)
│   ├── types/                 # TypeScript interfaces
│   └── utils/                 # Formatters, icons, accent configurations
├── capacitor.config.ts        # Capacitor mobile native configuration
├── tailwind.config.js         # Spatial glass utilities & animations
└── package.json
```

---

## 🏆 Feature Checklist

- [x] **Spatial Life Blocks**: Create, edit, customize accent color, icon, and wallpaper for each life area.
- [x] **Block Workspaces**: Dedicated focused rooms with Tasks, Files, Notes, and Analytics.
- [x] **Task Engine**: Fast inline creation (`Enter`), priority tags (Urgent, High, Medium, Low), due dates, completion sounds, confetti milestone animation.
- [x] **File & Media Manager**: Drag & drop custom liquid glass attachment picker supporting Images, PDFs, Videos, Audio, and Code.
- [x] **Custom Fullscreen Viewer**:
  - Image pan, pinch-zoom, and 90° rotation controls.
  - Interactive PDF document viewer with page navigation and zoom.
  - Video player with glass controls, scrubber, and time indicator.
  - Audio player with track slider and waveform visualizer.
  - Code/Text viewer with line numbers and copy-to-clipboard.
- [x] **Global Command Palette**: Instant cross-block search for Blocks, Tasks, Notes, and Files with keyboard navigation (`⌘K`).
- [x] **Cosmic Atmosphere**: 5 cinematic cosmic wallpapers + custom wallpaper option + 60 FPS drifting starfield canvas.
- [x] **Settings & Backups**: JSON export, JSON restore, data reset, sound effects toggle, haptics toggle, glass intensity selector.
- [x] **Responsive Mobile Layout**: Apple-inspired bottom glass dock, edge-to-edge layout, safe-area insets.
- [x] **Android Hardware Integration**: Hardware back button interceptor, native sharing, status bar transparency.
- [x] **Real Production Artifacts**: Both `dist/` web output and `release/LifeOfBlocks.apk` tested and built.
