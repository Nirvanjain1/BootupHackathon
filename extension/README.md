# HandWave browser side panel — v0.2.0

## Update your existing extension
1. Close the old HandWave camera tab.
2. Copy the files from this update into your existing **extension** folder, replacing the matching files. Keep the existing **vendor** folder.
3. Open chrome://extensions (or edge://extensions) and click Reload on HandWave. Accept its new side-panel permission if prompted.
4. Reload the webpages you want to control, so their old injected scripts are removed.
5. Open an ordinary webpage, click HandWave's toolbar icon, and its browser side panel opens. There is no separate controller tab.
6. Click Start camera, allow camera access, and keep the panel open while browsing. Start with fingers apart; pinch after the pointer appears.

If installing from the complete ZIP instead, use Developer mode → Load unpacked → select the folder containing manifest.json. Chrome 116+ is required. Edge requires support for the Side Panel API.

## Changes
- Controls and camera now run in the browser's persistent side panel.
- Every frame/action resolves the active tab in the panel's own window. A saved tab ID is no longer used.
- Content controls inject automatically when moving to another supported webpage or after page navigation.
- Injection is deduplicated so simultaneous requests cannot install duplicate controls.
- Tracking loss cancels dwell and requires fingers to open before another pinch click.
- The panel uses the submitted site's charcoal surfaces, lavender accent, teal feedback, rounded controls and visible focus outlines. Fonts use the site's font families when installed, with local system fallbacks; no Google Fonts requests are made.

## Controls
Point with your index finger to move the in-page cursor. Pinch thumb/index to click. Optional dwell click selects after 1.2 seconds. The panel offers adjustable smoothing/hold time, configurable poses, scroll, next/previous tab, contrast, zoom/reset, read/stop, browser back/forward and media play/pause.

Read aloud speaks selected text or up to 12,000 characters from the main article/page. Magnify uses browser page zoom. Stop camera or close the panel to release the camera. Pause gestures hides the pointer while retaining the stream for resumption.

## Supported pages and limitations
Use ordinary HTTP/HTTPS webpages. Browser settings, extension stores, built-in PDF viewers, native menus, closed shadow roots and embedded frames can restrict access. Native dropdown/file pickers and some canvas games require your ordinary mouse/keyboard. The pointer is inside the webpage and cannot reach the browser toolbar or side-panel controls. Contrast changes the main page; individual widgets may override parts of its appearance.

## Privacy
Frames stay within the extension panel. Only pointer coordinates and commands go to the active webpage. Hand recognition and its model use the existing bundled vendor assets; there is no application server or analytics. Settings stay in chrome.storage.local. Read aloud uses chrome.tts; voice engines can have their own network behaviour.

## Verified checks
Run `node tests.cjs` inside extension/. Tests execute the actual background and content scripts with mocked Chrome/DOM APIs: syntax, side-panel manifest/behaviour, dependency presence, active-tab routing and injection, switching tabs, zoom bounds/reset, restricted-page/sender handling, and pointer visibility/loss/recovery/stop.

A real loaded-extension camera test has not been completed in this environment. Check it on your laptop: start camera → pointer on webpage A → switch to webpage B → pointer still moves → pinch once → remove/reintroduce hand → pause/resume → stop camera. Also test contrast, zoom/reset, selection/page reading, stop reading and camera-permission denial. Report errors from the side panel's Inspect console and the extension service worker if a check fails.

## Maintenance
Nirvan: manifest, recognition and browser routing. Vedant: panel appearance and contrast. Rudra: reading and page actions. Dashrath: regression and device testing. These are suggested maintenance areas, not authorship claims.

Preserve the existing vendor assets and their Apache-2.0 license notices. This update does not modify the submitted website.

## v0.2.1 pointer repair
The page script now loads automatically on supported webpages, with on-demand injection retained as a fallback. The pointer matches the website's 60px ring and centre dot. Its overlay explicitly overrides page visibility/layout rules and is reattached if the site removes it. The panel shows hand-detection status separately from page delivery.

After replacing files, reload HandWave in chrome://extensions and reload the target webpage. Click **Test page pointer** in the panel: a large circle should appear in the centre of the webpage for four seconds without camera access. Then Start camera with **Air mouse** checked. The tracking line should say **Hand detected** and the delivery line should say **Pointer delivered**. If not, report those two exact lines; they identify whether the failure is recognition or page access.

The test circle and live pointer appear on the webpage beside the panel, not over browser toolbar controls or the panel itself. Chrome settings, extension stores and built-in PDF viewers remain restricted. Camera tracking and installed-browser behaviour still require device testing; unit checks alone do not establish that the camera works.

## v0.2.2 deliberate clicking
Pinch clicking requires an open thumb/index distance for 220 ms, then a close pinch held for 180 ms. A click has an 800 ms cooldown and cannot repeat until a full release. Missing frames or a lost hand clear pending clicks. The page holds the pointer during pinch confirmation and clicks only the control under the pointer when the pinch began.

Dwell and pinch are separate modes. With Dwell mode checked, pinching does not click. Dwell requires staying within a 14px area of the same control for 1.2 seconds; moving resets its timer. For testing deliberate pinch clicking, uncheck Dwell mode.

Run `node click-tests.cjs` for jitter, startup, repeated-hold, release and tracking-gap regression checks. These pass alongside tests.cjs. Real camera accuracy still depends on lighting and the user's movement.

Update: copy all patch files (including pinch-gate.mjs) into extension/, reload the extension and refresh the webpage. Start camera, keep Dwell mode OFF, open thumb/index briefly, then pinch and hold for a moment. The ring turns white during the pinch. Release fully before the next click.

## v0.2.3 hover events
The air pointer now sends pointer/mouse move, over/out and enter/leave events at the actual page element underneath it, including video areas rather than only clickable controls. Parent boundaries are preserved while moving between a video and its child controls. Tracking loss, pause and stop send exit events. Hover does not click or focus the element.

This enables JavaScript-driven hover interactions, including compatible video control bars. It does not move the OS pointer, activate native browser tooltips, or change CSS :hover matching. Websites that reject synthetic events and browser-native video controls may still require the real mouse. YouTube behaviour has not been verified in a live browser with this patch; test by moving the air pointer into the video, then toward its bottom controls, and then away.

Reload the extension and refresh all target pages after installing this update. Run node hover-tests.cjs for hover lifecycle regression checks.

## v0.3.0 — comfort and feedback
- Compact side panel with sticky Pause/Resume, a clear camera state dot and collapsible camera preview.
- The submitted site's dark/lavender/teal styling, gentle entrance animations, button feedback and optional motion. System reduced-motion preferences are respected.
- Pointer sizes (36/48/60 px), target outlines, lavender movement / teal target / white pinch feedback, confirmation progress ring and a short click pulse.
- Optional quiet click confirmation tone (off by default); starts after your physical Start camera click so the browser can enable audio.
- Pinch/stay-still click-method buttons with method-specific instructions.
- Responsive/Balanced/Extra steady comfort presets, with manual smoothing and hold time under Advanced settings. Pointer size, sound, preview visibility and preferences are saved.
- Reset appearance restores page zoom to 100% and removes HandWave contrast styling on the current page.
- Guided point → select → scroll practice opens as a small card on the active webpage. Completion is saved. Use a scrollable webpage for the final step.
- Gesture assignments and troubleshooting live in collapsible sections.

Install this patch by copying its files into your existing extension folder, preserving vendor/. Reload the extension and refresh target webpages. To use a complete installation instead, load the complete extension folder as unpacked.

Verification: tests.cjs, click-tests.cjs, hover-tests.cjs and qol-tests.cjs pass. These are automated tests with mocked Chrome/DOM APIs; they cover routing, pointer visibility, pinch timing, hover boundaries, panel initialisation and saved settings/presets. They do not substitute for a loaded-extension camera/visual/audio check on your laptop. Check Start/Stop, pause, each size, both click methods, progress feedback, sound, practice, reset appearance and persistence across reopening the panel.

## v0.4.0 — controls on the webpage
The floating **HandWave · controls** button opens a large menu that the air pointer can select using the existing pinch or dwell method. It includes contrast, magnification, reading/stop, reset appearance, practice, click methods, size, sound and comfort presets. The live gesture guide shows saved assignments and the fixed system gestures. Gesture assignments remain editable in the setup side panel.

System gestures:
- Thumb and little finger extended, other three fingers folded (call-me shape): hold to open/close the menu. Keep the thumb away from the index finger. This is reserved for menu access.
- When paused, hold an open palm for 1.2 seconds to resume. Pausing keeps camera recognition active for wake-up; Stop camera or closing the side panel releases it.
- Menu scanning (optional): choose Scanning in the page menu. Controls highlight in sequence; hold a closed fist to select the outlined control. Normal page gestures are suppressed while the menu is open, apart from scroll gestures. While scanning, pinch clicks are disabled. Turn Scanning off to return to pointing and pinch.

The movement filter and deliberate-pinch timing are unchanged. Setup/install/camera permission still require keyboard or assistance as needed. Keep the side panel open to maintain camera tracking, but use the page menu for everyday controls. Browser-restricted pages remain unsupported. The page menu cannot restart a camera after its side panel has been closed.

Install: replace this patch's files in extension/, keeping vendor/ and pinch-gate.mjs. Reload the extension and refresh all webpages. This refresh is required to replace the previously injected scripts. Run node menu-tests.cjs plus the previous regression checks. Tests cover menu state, live guide, command messages and scanning selection. Live hand recognition for the new call-me and wake poses still needs a camera test on your device.
