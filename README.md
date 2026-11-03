# HandWave

**Gesture-controlled access to documents, practice tools and the web.**

HandWave turns an ordinary webcam into an input device. People who find a mouse, keyboard or touchscreen difficult to use can read documents, practise essential skills and navigate with simple hand gestures. The project was built by Team Codex for the *Build for Everyone* hackathon theme.

## Problem

Standard computer interfaces assume fine motor control, steady hands and familiarity with pointing devices. This excludes people with limited hand mobility or tremors, people with low vision, and first-time technology users. HandWave offers an alternative input method that requires only a camera and a hand.

## Features

### Gesture engine and air mouse
- Real-time hand tracking with ten non-overlapping gestures (the seven MediaPipe poses plus three extra finger-count poses), held briefly to confirm intent. Each action has exactly one gesture, and users can change them with **Customize gestures**; if a new gesture is already in use the two actions swap, so gestures never overlap. Pointing with the index finger is reserved for the air mouse, and a pinch never triggers a gesture command.
- Air mouse: the index fingertip moves an on-screen pointer and a pinch clicks.
- Optional hover-to-click for users who cannot pinch.
- Steady-hand filter with adjustable strength to reduce the effect of tremors.
- Optional spoken description of the element under the pointer.

### Document reader
- Open a PDF by dialog or drag and drop.
- Gesture and on-screen controls for next and previous page, scrolling, zooming and read-aloud.

### Skills practice
- **Gesture basics:** a guided checklist that confirms each gesture and the pinch click as the user performs it, with saved progress.
- **Speaking practice:** word and sentence exercises with live recognition, words-per-minute and accuracy feedback, and a microphone level indicator. Available in English and Hindi.
- **Listening and reaction:** an audio-first exercise using spatial sound cues. Players change lane by moving their hand, and can use a practice mode in which nothing can end the session.

### Accessibility settings
- English and Hindi interface.
- High-contrast mode, adjustable text size and selectable accent colour, saved between visits.
- Keyboard navigation, skip link, visible focus states and screen-reader announcements.

## Privacy

Video is processed locally in the browser. No camera frames, audio or documents are uploaded or stored by this project.

## Technology

| Area | Technology |
|---|---|
| Interface | HTML, CSS, JavaScript (no framework) |
| Hand tracking | MediaPipe Tasks Vision, Gesture Recognizer |
| PDF rendering | PDF.js |
| Speech | Web Speech API (recognition and synthesis) |
| Audio | Web Audio API |

## Getting started

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
├── index.html        Application shell and page markup
├── css/
│   └── style.css     Layout, theme and component styles
└── js/
    ├── app.js            Entry point that loads the modules below
    ├── translations.js   Interface text for English and Hindi
    ├── settings.js       Language, contrast, text size and accent colour
    ├── utils.js          Shared helpers and notifications
    ├── gesture-engine.js Camera and MediaPipe gesture recognition
    ├── airmouse.js       Air mouse, steady-hand filter and hover-click
    ├── gestures.js       Gesture-to-action map and Customize gestures dialog
    ├── speakaloud.js     Spoken descriptions of controls
    ├── hud.js            On-screen gesture indicator
    ├── reader.js         PDF reader and reader gestures
    ├── speaking-data.js  Word lists, sentences and speaking messages
    ├── speaking.js       Speaking practice
    ├── navigation.js     Page routing and keyboard shortcuts
    ├── echo.js           Listening and reaction exercise
    └── basics.js         Gesture basics checklist
```

## Known limitations

- Browser security rules require a physical click or tap to open the file dialog, so the reader's open button cannot be triggered by pinch. Drag and drop and the on-screen controls are unaffected.
- Native dropdown menus, including the language selector, cannot be opened by the air mouse.
- Speech recognition depends on browser support and an internet connection.
- Recognition accuracy varies with lighting and camera quality.

## Roadmap

- Browser extension that brings the air mouse and gesture navigation to any website.
- Face and head gestures for users with limited hand movement.
- User-recorded custom gestures and saved profiles.
- Additional interface languages.

## Team

| Member | Contribution |
|---|---|
| Nirvan | Gesture engine, air mouse, interface integration and repository management |
| Rudra | Document reader and speaking practice |
| Dashrath | Listening and reaction exercise |
| Vedant | Language, contrast and display settings, and visual design |

AI-assisted development tools were used during implementation. Product decisions, testing and review were carried out by the team.
