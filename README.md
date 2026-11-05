# HandWave

**A more welcoming way to use a computer, powered by a webcam.**

HandWave turns an ordinary webcam into an input device. A person can point with a finger, click with a pinch or dwell, and use simple gestures to read a PDF, practise speaking and listening, and, through the browser extension, control ordinary websites. Spoken cues, adjustable visuals, keyboard controls and six interface languages offer multiple ways into the same experience. The project was built by Team Codex for the *Build for Everyone* hackathon theme.

> **Our idea:** accessibility should be a choice of interaction, not a separate version of the product. HandWave lets people begin with the method that works for them and build confidence at their own pace.

## Components

| Component | Location | Purpose |
|---|---|---|
| HandWave website | repository root | Guided practice, PDF reader and skills practice in the browser |
| HandWave browser extension | `extension/` | Gesture control, air pointer, contrast, zoom and read-aloud on ordinary web pages |

## Problem

Standard computer interfaces often assume precise clicks, steady hands, readable small text, and prior knowledge of icons and menus. Those assumptions can make a simple task feel difficult or impossible. HandWave combines alternative input, audible feedback, adaptable display settings, multilingual text and guided practice in one project.

## Who it helps and how

| Situation | HandWave use case |
|---|---|
| Fine motor difficulty, tremors, or an uncomfortable grip | Move the pointer by pointing, choose pinch or hover-to-click, and adjust the steady-hand filter. Gesture commands reduce the need for precise targeting. |
| Limited ability to use a mouse or touchscreen | Turn PDF pages, scroll, zoom and start read-aloud with hand gestures or large on-screen controls. Gestures can be reassigned to poses that feel easier. |
| Low vision or reading fatigue | Increase text size and contrast, hear descriptions of controls under the pointer, and have PDF text or web pages read aloud. The listening exercise uses spatial audio rather than relying on visual cues alone. |
| Speech practice or confidence building | Practise words and sentences with live recognition, accuracy and pace feedback in six languages. |
| Unfamiliarity with computers or new interfaces | Start with a guided gesture checklist, see the detected gesture on screen, and use clear, repeatable actions before moving on to the reader, practice tools or the extension. |
| Different access needs on a shared device | Switch between hand gestures, on-screen buttons and keyboard controls; change language and display settings without changing hardware. |

These are possible uses, not claims of suitability for every disability.

## Why this matters in a demo

One webcam supports a complete learning path: **learn a gesture, use it to navigate, read a real document, practise communication and listening, then take the same controls to other websites.** The same actions remain available through visible controls and keyboard shortcuts, so a user can change input methods as their needs change.

## Website features

### Gesture engine and air mouse
- Real-time hand tracking with ten non-overlapping gestures (the seven MediaPipe poses plus three extra finger-based poses), held briefly to confirm intent. Each action has exactly one gesture, and users can change them with **Customize gestures**. If a new gesture is already in use, the two actions swap, so gestures never overlap. Pointing with the index finger is reserved for the air mouse, and a pinch never triggers a gesture command.
- Air mouse: the index fingertip moves an on-screen pointer and a pinch clicks.
- Optional hover-to-click for users who cannot pinch.
- Steady-hand filter with adjustable strength to reduce the effect of tremors.
- Optional spoken description of the element under the pointer.

### Document reader
- Open a PDF by dialog or drag and drop.
- Gesture and on-screen controls for next and previous page, scrolling, zooming and read-aloud.

### Skills practice
- **Gesture basics:** a guided checklist that confirms each gesture and the pinch click as the user performs it, with saved progress.
- **Speaking practice:** word and sentence exercises with live recognition, words-per-minute and accuracy feedback, and a microphone level indicator.
- **Listening and reaction:** an audio-first exercise using spatial sound cues. Players change lane by moving their hand, and can use a practice mode in which nothing can end the session.

### Languages and display settings
- Interface language selector with six languages: English, Hindi, Bengali, Tamil, Telugu and Marathi.
- Language, speech-recognition and read-aloud settings share one definition per language, so adding a language is a single entry plus its text.
- Noto Sans fonts for Devanagari, Bengali, Tamil and Telugu scripts.
- High-contrast mode, adjustable text size and selectable accent colour, saved between visits.
- Keyboard navigation, skip link, visible focus states and screen-reader announcements.

#### Language coverage

| Language | Interface text | Speaking practice |
|---|---|---|
| English | Complete | Full word and sentence lists |
| Hindi | Complete | Word and sentence lists |
| Bengali, Tamil, Telugu, Marathi | Navigation, home page and core reader controls; other text appears in English | Starter word and sentence lists |

## Browser extension

The extension in `extension/` brings the website's hand tracking to ordinary web pages. It is a Manifest V3 extension for Chrome 116 or later and for Edge versions that support the Side Panel API. Setup and camera controls live in the browser's side panel, and an air pointer and controls menu appear on the web page.

### Features
- Air pointer driven by the index finger, with pinch or stay-still (dwell) clicking, adjustable smoothing and hold time, and Responsive, Balanced and Extra steady presets.
- Deliberate-click timing: a pinch must be held briefly, has a cooldown, and requires a full release before the next click.
- Configurable gestures for scrolling, switching tabs, browser back and forward, zoom, reading aloud and media play and pause.
- Contrast and page zoom (magnify) with a reset-appearance option.
- Read aloud for selected text or the main content of a page, using the browser's text-to-speech.
- On-page controls menu that the air pointer can operate, opened and closed by a reserved gesture, with an optional scanning mode that uses a closed fist to select.
- Pause and resume gestures, pointer size options, optional click confirmation tone and a short guided practice of point, select and scroll.

### Installation
1. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
2. Choose **Load unpacked** and select the `extension/` folder (the folder that contains `manifest.json`).
3. Open an ordinary web page and click the HandWave toolbar icon to open the side panel.
4. Select **Start camera**, allow camera access, and keep the side panel open while browsing.

Hand tracking runs in the side panel using the bundled MediaPipe files in `extension/vendor/`. Only pointer coordinates and commands are sent to the active page. Detailed notes and version history are in [`extension/README.md`](extension/README.md).

### Extension limitations
- Works on ordinary HTTP and HTTPS pages. Browser settings pages, extension stores, built-in PDF viewers and some embedded frames are restricted by the browser.
- The pointer exists inside the web page and cannot reach the browser toolbar or the side panel.
- Native dropdown menus and file pickers still need the regular mouse or keyboard.
- The side panel must stay open to keep the camera running.
- Automated tests use mocked browser APIs and are complemented by manual testing of the loaded extension. Results can still vary with the device, lighting and camera, so check each new setup.

## Privacy

On the website, hand tracking and PDF rendering run in the browser; the project does not upload camera frames or documents to its own server. The site loads fonts, PDF.js and MediaPipe files from public CDNs. Speech recognition uses the browser's Web Speech API, whose processing and network behaviour depend on the browser. Preferences and practice progress are stored locally in the browser.

In the extension, camera frames stay inside the side panel, the recognition model is bundled with the extension, and there is no application server or analytics. Settings are stored with `chrome.storage.local`. Read-aloud uses `chrome.tts`, and the voice engine may have its own network behaviour.

## Technology

| Area | Technology |
|---|---|
| Interface | HTML, CSS, JavaScript (no framework) |
| Hand tracking | MediaPipe Tasks Vision, Gesture Recognizer |
| PDF rendering | PDF.js |
| Speech | Web Speech API (website), `chrome.tts` (extension) |
| Audio | Web Audio API |
| Extension platform | Manifest V3, Side Panel API, content scripts |

## Getting started: website

Requirements: a recent version of Google Chrome or Microsoft Edge, a webcam, and an internet connection (libraries and the hand-tracking model load from a CDN on first use). Speaking practice also requires microphone access.

1. Clone the repository.
2. Serve the project folder over HTTP. Either:
   - open the folder in Visual Studio Code, install the **Live Server** extension, and choose **Open with Live Server**, or
   - run `python -m http.server 8000` in the project folder and open `http://localhost:8000`.
3. Select **Turn on camera** and allow access.

The site can also be published with GitHub Pages, which provides the HTTPS connection browsers require for camera access.

## Project structure

```
.
├── index.html            Application shell and page markup
├── css/
│   └── style.css         Layout, theme and component styles
├── js/
│   ├── app.js            Entry point that loads the modules below
│   ├── languages.js      Language list, speech tags and greetings
│   ├── translations.js   Interface text per language
│   ├── settings.js       Language, contrast, text size and accent colour
│   ├── utils.js          Shared helpers and notifications
│   ├── gesture-engine.js Camera and MediaPipe gesture recognition
│   ├── airmouse.js       Air mouse, steady-hand filter and hover-click
│   ├── gestures.js       Gesture-to-action map and Customize gestures dialog
│   ├── speakaloud.js     Spoken descriptions of controls
│   ├── hud.js            On-screen gesture indicator
│   ├── reader.js         PDF reader and reader gestures
│   ├── speaking-data.js  Word lists, sentences and messages per language
│   ├── speaking.js       Speaking practice
│   ├── navigation.js     Page routing and keyboard shortcuts
│   ├── echo.js           Listening and reaction exercise
│   └── basics.js         Gesture basics checklist
└── extension/
    ├── manifest.json     Extension manifest (Manifest V3)
    ├── background.js     Active-tab routing and page injection
    ├── controller.html   Side panel markup
    ├── controller.css    Side panel styles
    ├── controller.js     Camera, recognition, settings and presets
    ├── content.js        Air pointer, clicks, contrast, zoom and reading on the page
    ├── page-menu.js      On-page controls menu
    ├── pinch-gate.mjs    Deliberate pinch timing
    ├── *-tests.cjs       Automated checks with mocked browser APIs
    └── vendor/           Bundled MediaPipe files, model and licence notices
```

## Testing the extension

From the `extension/` folder, run the automated checks with Node.js:

```
node tests.cjs
node click-tests.cjs
node menu-tests.cjs
node qol-tests.cjs
```

These cover routing, pointer behaviour, pinch timing, menu state and saved settings. They are complemented by manual testing of the loaded extension with a camera, which should be repeated on each new device.

## Known limitations

- Browser security rules require a physical click or tap to open the file dialog, so the reader's open button cannot be triggered by pinch. Drag and drop and the on-screen controls are unaffected.
- Native dropdown menus, including the language selector, cannot be opened by the air mouse.
- Bengali, Tamil, Telugu and Marathi translate only part of the interface and have short speaking-practice lists. They have not yet been reviewed by fluent speakers.
- Speech recognition depends on browser support, the selected language and an internet connection.
- Recognition accuracy varies with lighting and camera quality.

## Roadmap

- Complete and review the interface translations for Bengali, Tamil, Telugu and Marathi, and extend the speaking lists.
- Add more regional languages, for example Gujarati and Malayalam.
- Face and head gestures for users with limited hand movement.
- User-recorded custom gestures and saved profiles.
- Share one gesture engine between the website and the extension.
- Publish the extension through browser stores and test with more users and devices.

## Team

| Member | Contribution |
|---|---|
| Nirvan | Gesture engine, air mouse, interface integration and repository management; extension manifest, recognition and browser routing |
| Rudra | Document reader and speaking practice; extension reading and page actions |
| Dashrath | Listening and reaction exercise; extension regression and device testing |
| Vedant | Language, contrast and display settings, and visual design; extension panel appearance and contrast |

Extension roles follow the maintenance areas listed in `extension/README.md`. AI-assisted development tools were used during implementation. Product decisions, testing and review were carried out by the team.
