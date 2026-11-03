import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
import { toast } from "./utils.js";
const BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const frameCallbacks = [],
  gestureCallbacks = [],
  landmarkCallbacks = [];
const D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Landmark-based recognition of extra hand shapes MediaPipe does not name.
function extraGesture(L) {
  const size = D(L[0], L[9]) || 1,
    up = (tip, pip) => D(L[tip], L[0]) > D(L[pip], L[0]) * 1.1,
    idx = up(8, 6),
    mid = up(12, 10),
    ring = up(16, 14),
    pinky = up(20, 18),
    thumb = D(L[4], L[5]) > size * 0.6 && D(L[4], L[17]) > D(L[3], L[17]);
  if (idx && mid && ring && !pinky && !thumb) return "Three_Fingers";
  if (idx && mid && ring && pinky && !thumb) return "Four_Fingers";
  if (pinky && !idx && !mid && !ring) return thumb ? "Call_Me" : "Pinky_Up";
  return null;
}
let current = null,
  since = 0,
  fired = false,
  seen = 0,
  lastT = -1,
  started = false;
export const GestureEngine = (window.GestureEngine = {
  holdMs: 450,
  pinching: false,
  minScore: 0.5,
  onFrame: (f) => frameCallbacks.push(f),
  onLandmarks: (f) => landmarkCallbacks.push(f),
  onGesture: (f) => gestureCallbacks.push(f),
  async start(video, canvas) {
    if (started) return;
    started = true;
    try {
      const fs = await FilesetResolver.forVisionTasks(BASE + "/wasm");
      const recognizer = await GestureRecognizer.createFromOptions(fs, {
        baseOptions: { modelAssetPath: MODEL },
        runningMode: "VIDEO",
        numHands: 1,
      });
      video.srcObject = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      await new Promise((resolve) => (video.onloadeddata = resolve));
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d"),
        drawing = new DrawingUtils(ctx);
      (function loop() {
        requestAnimationFrame(loop);
        if (video.currentTime === lastT) return;
        lastT = video.currentTime;
        const now = performance.now(),
          result = recognizer.recognizeForVideo(video, now);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let g = null;
        landmarkCallbacks.forEach((f) =>
          f(result.landmarks.length ? result.landmarks[0] : null),
        );
        if (result.landmarks.length) {
          drawing.drawConnectors(
            result.landmarks[0],
            GestureRecognizer.HAND_CONNECTIONS,
            { color: "#3dd6c3", lineWidth: 3 },
          );
          drawing.drawLandmarks(result.landmarks[0], {
            color: "#ffc233",
            radius: 3,
          });
          const L = result.landmarks[0],
            pd = D(L[4], L[8]) / (D(L[0], L[9]) || 1);
          // a pinch is the air-mouse click, never a gesture command
          GestureEngine.pinching = GestureEngine.pinching ? pd < 0.5 : pd < 0.34;
          const candidate = result.gestures[0] && result.gestures[0][0];
          if (!GestureEngine.pinching) {
            g = extraGesture(L);
            if (
              !g &&
              candidate &&
              candidate.score > GestureEngine.minScore &&
              candidate.categoryName !== "None"
            )
              g = candidate.categoryName;
          }
        } else GestureEngine.pinching = false;
        if (g) seen = now;
        if (g !== current && !(g === null && now - seen < 300)) {
          current = g;
          since = now;
          fired = false;
        }
        frameCallbacks.forEach((f) => f(current, current ? now - since : 0));
        if (current && !fired && now - since > GestureEngine.holdMs) {
          fired = true;
          gestureCallbacks.forEach((f) => f(current));
        }
      })();
    } catch (err) {
      started = false;
      throw err;
    }
  },
});
async function startCamera(button) {
  button.disabled = true;
  try {
    await GestureEngine.start(
      document.querySelector("#v"),
      document.querySelector("#c"),
    );
    document.querySelectorAll(".camera-start,#homeCamBtn").forEach((b) => {
      b.disabled = true;
      b.textContent = "Camera is on";
    });
    toast("Camera's on. Show me your hand");
  } catch (err) {
    alert(
      "Sorry, I couldn't start the camera (" +
        err.message +
        "). Please check that camera access is allowed and try again.",
    );
    button.disabled = false;
  }
}
document.querySelector("#homeCamBtn").onclick = (e) =>
  startCamera(e.currentTarget);
document
  .querySelectorAll(".camera-start")
  .forEach((b) => (b.onclick = () => startCamera(b)));
