import { toast, onGamePage } from "./utils.js";
import { GestureEngine } from "./gesture-engine.js";
import { speakB, announce, hoverSpeak } from "./speakaloud.js";
const ZONE = { x0: 0.2, x1: 0.8, y0: 0.15, y1: 0.75 },
  SMOOTH = 0.25,
  PINCH_ON = 0.34,
  PINCH_OFF = 0.5,
  DWELL_MS = 1200;
let dwell = false;
try {
  dwell = localStorage.getItem("hw_dwell") === "1";
} catch (e) {}
const cursor = document.createElement("div");
cursor.id = "am-cursor";
document.body.append(cursor);
const panel = document.createElement("div");
panel.id = "am-panel";
const toggle = document.createElement("button"),
  note = document.createElement("p");
note.textContent =
  "Point with your index finger to move the cursor. Pinch your thumb and finger together to click.";
const closeB = document.createElement("button");
closeB.id = "am-close";
closeB.textContent = "×";
closeB.setAttribute("aria-label", "Close air mouse panel");
const openB = document.createElement("button");
openB.id = "am-open";
openB.textContent = "Air mouse";
openB.setAttribute("aria-label", "Open air mouse panel");
const steadyB = document.createElement("button");
steadyB.className = "am-toggle";
steadyB.style.marginTop = "8px";
const gestB = document.createElement("button");
gestB.className = "am-toggle";
gestB.style.marginTop = "8px";
gestB.dataset.gedit = "1";
gestB.innerHTML = "<span>Customize gestures</span>";
panel.append(closeB, toggle, steadyB, gestB, note);
document.body.append(panel, openB);
const setMin = (v, quiet) => {
  panel.style.display = v ? "none" : "";
  openB.style.display = v ? "flex" : "none";
  try {
    localStorage.setItem("hw_panel_min", v ? "1" : "0");
  } catch (e) {}
  if (v && !quiet)
    toast("Air mouse panel hidden. Use the Air mouse button to bring it back.");
};
closeB.onclick = () => setMin(true);
openB.onclick = () => setMin(false);
let wasMin = false;
try {
  wasMin = localStorage.getItem("hw_panel_min") === "1";
} catch (e) {}
setMin(wasMin, true);
toggle.className = "am-toggle";
const label = () => {
  toggle.innerHTML =
    "<span>Hover to click: " +
    (dwell ? "ON" : "OFF") +
    '</span><span class="am-switch"></span>';
  toggle.setAttribute("aria-pressed", dwell);
};
label();
toggle.onclick = () => {
  dwell = !dwell;
  try {
    localStorage.setItem("hw_dwell", dwell ? "1" : "0");
  } catch (e) {}
  label();
};
const clamp = (v) => Math.min(1, Math.max(0, v)),
  SELECTABLE = "button,a,select,input,textarea,canvas,.card,[onclick]";
let px = innerWidth / 2,
  py = innerHeight / 2,
  pinched = false,
  hovered = null,
  dwellTarget = null,
  dwellStart = 0,
  dwellDone = false;
const STEADY = [
    null,
    { min: 1, beta: 0.01, dead: 4 },
    { min: 0.4, beta: 0.006, dead: 10 },
  ],
  STEADY_NAMES = ["Off", "Gentle", "Strong"];
let steadyLvl = 1;
try {
  const v = localStorage.getItem("hw_steady");
  if (v !== null) steadyLvl = Math.min(2, Math.max(0, +v || 0));
} catch (e) {}
const steadyLabel = () => {
  steadyB.innerHTML =
    "<span>Steady hand: " +
    STEADY_NAMES[steadyLvl] +
    '</span><span class="am-switch"></span>';
  steadyB.setAttribute("aria-pressed", steadyLvl > 0);
};
steadyLabel();
steadyB.onclick = () => {
  steadyLvl = (steadyLvl + 1) % 3;
  try {
    localStorage.setItem("hw_steady", steadyLvl);
  } catch (e) {}
  steadyLabel();
  toast("Steady hand: " + STEADY_NAMES[steadyLvl]);
};
let fInit = false,
  fx = 0,
  fy = 0,
  fdx = 0,
  fdy = 0,
  fLast = 0;
const hist = [];
const lpAlpha = (cut, dt) => {
  const r = 2 * Math.PI * cut * dt;
  return r / (r + 1);
};
panel.insertBefore(speakB, note);
let cx = px,
  cy = py,
  cInit = false,
  gone = true,
  cT = performance.now();
(function cursorLoop(t) {
  requestAnimationFrame(cursorLoop);
  const dt = Math.min(0.1, Math.max(0.001, (t - cT) / 1e3 || 0.016));
  cT = t;
  if (!cInit) {
    cx = px;
    cy = py;
    cInit = true;
  } else {
    const k = 1 - Math.exp(-dt / 0.045);
    cx += (px - cx) * k;
    cy += (py - cy) * k;
  }
  cursor.style.transform =
    "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
})(performance.now());
// Snap-to-button: when the half pinch locks the cursor, pull it to the nearest
// real control within SNAP_R pixels. Only used for deliberate UI clicking:
// never during the listening game, and never when the cursor is over a canvas
// (PDF page), so it cannot hijack aiming.
const SNAP_SEL =
    "button,a[href],input:not([type=hidden]),select,textarea,[role=button],.card,[onclick]",
  SNAP_R = 90;
function snapToControl() {
  const here = document.elementFromPoint(px, py);
  if (here && (here.closest(SNAP_SEL) || here.closest("canvas"))) return;
  let best = null,
    bd = SNAP_R;
  document.querySelectorAll(SNAP_SEL).forEach((el) => {
    if (el.disabled || el.closest("[hidden],[inert]")) return;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.width * r.height > innerWidth * innerHeight * 0.4) return;
    const d = Math.hypot(
      Math.max(r.left - px, 0, px - r.right),
      Math.max(r.top - py, 0, py - r.bottom),
    );
    if (d >= bd) return;
    const mx = r.left + r.width / 2,
      my = r.top + r.height / 2,
      top = document.elementFromPoint(mx, my);
    if (!top || !(top === el || el.contains(top))) return; // hidden or covered
    best = { el, mx, my };
    bd = d;
  });
  if (best) {
    px = best.mx;
    py = best.my;
  }
}
function clickAt(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return;
  const target = el.closest(SELECTABLE) || el;
  target.focus && target.focus();
  target.click && target.click();
  setTimeout(() => announce(target), 40);
}
GestureEngine.onLandmarks((L) => {
  if (!L) {
    cursor.style.display = "none";
    fInit = false;
    gone = true;
    hist.length = 0;
    return;
  }
  cursor.style.display = "block";
  const tip = L[8],
    thumb = L[4],
    now = performance.now();
  const nx = clamp((1 - tip.x - ZONE.x0) / (ZONE.x1 - ZONE.x0)),
    ny = clamp((tip.y - ZONE.y0) / (ZONE.y1 - ZONE.y0));
  const tx = nx * innerWidth,
    ty = ny * innerHeight,
    cfg = STEADY[steadyLvl];
  if (gone) {
    px = tx;
    py = ty;
    cInit = false;
    gone = false;
  }
  if (!cfg) {
    px += (tx - px) * SMOOTH;
    py += (ty - py) * SMOOTH;
    fInit = false;
  } else if (!pinched) {
    const dt = Math.min(0.1, Math.max(0.005, (now - fLast) / 1e3));
    fLast = now;
    if (!fInit) {
      fx = tx;
      fy = ty;
      fdx = 0;
      fdy = 0;
      fInit = true;
    } else {
      const ad = lpAlpha(1, dt);
      fdx += ((tx - fx) / dt - fdx) * ad;
      fdy += ((ty - fy) / dt - fdy) * ad;
      const a = lpAlpha(cfg.min + cfg.beta * Math.hypot(fdx, fdy), dt);
      fx += (tx - fx) * a;
      fy += (ty - fy) * a;
    }
    const ddx = fx - px,
      ddy = fy - py,
      d = Math.hypot(ddx, ddy);
    if (d > cfg.dead) {
      const k = (d - cfg.dead) / d;
      px += ddx * k;
      py += ddy * k;
    }
    hist.push({ t: now, x: px, y: py });
    while (hist.length && now - hist[0].t > 400) hist.shift();
  }
  cursor.style.pointerEvents = "none";
  const under = document.elementFromPoint(px, py),
    target = under && under.closest(SELECTABLE);
  if (target !== hovered) {
    hovered && hovered.classList.remove("am-hover");
    hovered = target && !panel.contains(target) ? target : null;
    hovered && hovered.classList.add("am-hover");
    hoverSpeak(hovered);
  }
  const size = Math.hypot(L[0].x - L[9].x, L[0].y - L[9].y) || 1,
    dist = Math.hypot(tip.x - thumb.x, tip.y - thumb.y) / size;
  if (!pinched && dist < PINCH_ON) {
    pinched = true;
    cursor.classList.add("pinched");
    document.dispatchEvent(new CustomEvent("hw-pinch"));
    if (steadyLvl > 0) {
      const h = hist.find((e) => e.t >= now - 150);
      if (h) {
        px = h.x;
        py = h.y;
      }
    }
    if (onGamePage()) {
      const el = document.elementFromPoint(px, py),
        ctl = el && el.closest("button,a,select,input,.card");
      if (ctl) clickAt(px, py);
    } else {
      snapToControl();
      clickAt(px, py);
    }
  } else if (pinched && dist > PINCH_OFF) {
    pinched = false;
    cursor.classList.remove("pinched");
  }
  let progress = 0;
  if (dwell && target && !pinched && !onGamePage()) {
    if (target !== dwellTarget) {
      dwellTarget = target;
      dwellStart = now;
      dwellDone = false;
    } else if (!dwellDone) {
      progress = (now - dwellStart) / DWELL_MS;
      if (progress >= 1) {
        clickAt(px, py);
        dwellDone = true;
        progress = 0;
      }
    }
  } else dwellTarget = null;
  cursor.style.setProperty("--p", progress);
});
