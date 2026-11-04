import { onGamePage } from "./utils.js";
import { speechLang } from "./languages.js";
let speakOn = true;
try {
  speakOn = localStorage.getItem("hw_speak") !== "0";
} catch (e) {}
export const speakB = document.createElement("button");
speakB.className = "am-toggle";
speakB.style.marginTop = "8px";
const speakLabel = () => {
  speakB.innerHTML =
    "<span>Speak aloud: " +
    (speakOn ? "ON" : "OFF") +
    '</span><span class="am-switch"></span>';
  speakB.setAttribute("aria-pressed", speakOn);
};
speakLabel();
speakB.onclick = () => {
  speakOn = !speakOn;
  try {
    localStorage.setItem("hw_speak", speakOn ? "1" : "0");
  } catch (e) {}
  speakLabel();
  if (!speakOn && window.speechSynthesis && ours) speechSynthesis.cancel();
};
let ours = false,
  lastSaid = "",
  lastAt = 0,
  hoverTimer = 0;
const clean = (s) =>
  s
    .replace(
      /[\p{Extended_Pictographic}\uFE0F\u2713\u2715\u2191\u2193\u2190\u2192]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
function describe(el) {
  let t = "";
  if (el.id === "cv") return "Echo Runner display";
  if (el.id === "pdf") return "PDF page";
  if (el.classList.contains("card")) {
    const hh = el.querySelector("h2"),
      ss = el.querySelector("span");
    t = (hh ? hh.textContent : "") + ". " + (ss ? ss.textContent : "");
  } else if (el.classList.contains("cmd")) {
    const ss = el.querySelector("span");
    t = ss ? ss.textContent : "";
  } else if (el.tagName === "SELECT") {
    t =
      (el.getAttribute("aria-label") || "") +
      " " +
      (el.selectedOptions[0] ? el.selectedOptions[0].text : "");
  } else t = el.getAttribute("aria-label") || el.textContent || el.title || "";
  t = clean(t).slice(0, 140);
  if (
    t &&
    el.hasAttribute("aria-pressed") &&
    !el.classList.contains("am-toggle") &&
    !/\b(on|off)\b/i.test(t)
  )
    t +=
      ", " +
      Settings.t(el.getAttribute("aria-pressed") === "true" ? "sel" : "nsel");
  return t;
}
let lastHoverAt = 0;
export function announce(el, fromHover) {
  if (!speakOn || !window.speechSynthesis || !el) return;
  if (el.tagName === "CANVAS" || onGamePage()) return;
  if (window.echoRunning && window.echoRunning()) return;
  if (speechSynthesis.speaking && !ours) return;
  const text = describe(el);
  if (!text) return;
  const now = performance.now();
  if (text === lastSaid && now - lastAt < 4e3) return;
  if (fromHover && now - lastHoverAt < 2e3) return;
  lastSaid = text;
  lastAt = now;
  if (fromHover) lastHoverAt = now;
  try {
    if (ours) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang(Settings.lang);
    u.rate = 1.05;
    u.onstart = () => {
      ours = true;
    };
    u.onend = u.onerror = () => {
      ours = false;
    };
    speechSynthesis.speak(u);
  } catch (e) {}
}
export function hoverSpeak(el) {
  clearTimeout(hoverTimer);
  if (el) hoverTimer = setTimeout(() => announce(el, true), 800);
}
