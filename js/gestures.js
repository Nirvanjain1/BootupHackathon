// Gesture map: one unique hand gesture per action, remappable by the user.
// No two actions can ever share a gesture, and Pointing_Up (the air-mouse
// pointing pose) is reserved so it can never trigger an action by accident.
import { GestureEngine } from "./gesture-engine.js";
import { toast } from "./utils.js";
import { lang } from "./settings.js";

export const RESERVED = "Pointing_Up";

// Every gesture that can be assigned (the pointer pose is deliberately absent).
export const GESTURES = {
  Thumb_Up: "Thumbs up",
  Thumb_Down: "Thumbs down",
  Victory: "Peace sign",
  Open_Palm: "Open palm",
  Closed_Fist: "Closed fist",
  ILoveYou: "Thumb, index and little finger out",
  Three_Fingers: "Three fingers up (thumb tucked)",
  Four_Fingers: "Four fingers up (thumb tucked)",
  Pinky_Up: "Little finger only",
  Call_Me: "Thumb and little finger out",
};
export const gestureName = (g) =>
  g === RESERVED ? "Point with index finger" : GESTURES[g] || "Not set";

// Ten actions, ten gestures: a one-to-one default so nothing overlaps.
export const ACTIONS = [
  ["scrollUp", "Scroll up", "Thumb_Up"],
  ["scrollDown", "Scroll down", "Thumb_Down"],
  ["nextPage", "Next page", "Victory"],
  ["prevPage", "Previous page", "Three_Fingers"],
  ["zoomIn", "Zoom in", "Open_Palm"],
  ["zoomOut", "Zoom out", "Closed_Fist"],
  ["readAloud", "Read aloud", "Four_Fingers"],
  ["start", "Start / stop (speaking, game)", "ILoveYou"],
  ["jump", "Jump (listening game, hard mode)", "Pinky_Up"],
  ["duck", "Duck (listening game, hard mode)", "Call_Me"],
];
const DEFAULTS = Object.fromEntries(ACTIONS.map(([a, , g]) => [a, g]));
const KEY = "hw_gmap_v2"; // new key so the swapped defaults apply to everyone
let map = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved && typeof saved === "object")
    for (const a in DEFAULTS)
      if (a in saved && (saved[a] === null || GESTURES[saved[a]]))
        map[a] = saved[a];
  // repair any saved duplicates so overlap is impossible
  const seen = new Set();
  for (const a in map) {
    if (map[a] && seen.has(map[a])) map[a] = null;
    else if (map[a]) seen.add(map[a]);
  }
} catch (e) {}
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {}
};

const t = (k, fb) => (window.Settings && Settings.t(k) !== k ? Settings.t(k) : fb);
const actionLabel = (a) =>
  t("act_" + a, ACTIONS.find((x) => x[0] === a)[1]);

const changeCbs = [],
  onceCbs = {},
  heldCbs = {};
let paused = false;

export const GestureMap = (window.GestureMap = {
  get paused() {
    return paused;
  },
  gestureOf: (action) => map[action] || null,
  actionOf: (g) => {
    if (paused || !g) return null;
    for (const a in map) if (map[a] === g) return a;
    return null;
  },
  nameOf: (action) => (map[action] ? t("g_" + map[action], gestureName(map[action])) : t("gNone", "Not set")),
  // fires once when the action's gesture has been held long enough
  on(action, fn) {
    (onceCbs[action] = onceCbs[action] || []).push(fn);
  },
  // fires every frame while the action's gesture is held longer than minMs
  whileHeld(action, minMs, fn) {
    (heldCbs[action] = heldCbs[action] || []).push([minMs, fn]);
  },
  onChange: (fn) => changeCbs.push(fn),
  // assign a gesture to an action; if another action had it, the two swap
  set(action, g) {
    if (g === RESERVED) {
      toast(t("gReserved", "That pose moves the pointer, so it can't be used for an action."));
      return false;
    }
    if (g && !GESTURES[g]) return false;
    const old = map[action];
    for (const a in map)
      if (a !== action && g && map[a] === g) {
        map[a] = old || null;
        toast(
          gestureName(g) + ": " + actionLabel(a) + " ⇄ " + actionLabel(action),
        );
      }
    map[action] = g || null;
    save();
    changed();
    return true;
  },
  reset() {
    map = { ...DEFAULTS };
    save();
    changed();
  },
});

function changed() {
  document.querySelectorAll("[data-gact]").forEach((e) => {
    e.textContent = GestureMap.nameOf(e.dataset.gact);
  });
  changeCbs.forEach((f) => f());
}

// --- dispatch -------------------------------------------------------------
GestureEngine.onGesture((g) => {
  if (listening) return captured(g);
  const a = GestureMap.actionOf(g);
  if (a && onceCbs[a]) onceCbs[a].forEach((f) => f());
});
GestureEngine.onFrame((g, held) => {
  const a = GestureMap.actionOf(g);
  if (a && heldCbs[a])
    heldCbs[a].forEach(([ms, f]) => {
      if (held > ms) f();
    });
});

// --- customise dialog -----------------------------------------------------
let listening = null;
const overlay = document.createElement("div");
overlay.id = "gm-overlay";
overlay.hidden = true;
overlay.setAttribute("role", "dialog");
overlay.setAttribute("aria-modal", "true");
overlay.setAttribute("aria-labelledby", "gm-title");
const box = document.createElement("div");
box.id = "gm-box";
const title = document.createElement("h2");
title.id = "gm-title";
const help = document.createElement("p");
help.className = "hint";
const list = document.createElement("div");
list.id = "gm-list";
const status = document.createElement("p");
status.id = "gm-status";
status.setAttribute("role", "status");
const foot = document.createElement("div");
foot.className = "tools";
const resetB = document.createElement("button"),
  closeB = document.createElement("button");
closeB.className = "primary";
foot.append(resetB, closeB);
box.append(title, help, list, status, foot);
overlay.append(box);
document.body.append(overlay);

const rows = {};
ACTIONS.forEach(([a]) => {
  const row = document.createElement("div");
  row.className = "gm-row";
  const label = document.createElement("span"),
    cur = document.createElement("b"),
    chg = document.createElement("button"),
    clr = document.createElement("button");
  chg.onclick = () => listen(a);
  clr.onclick = () => GestureMap.set(a, null);
  row.append(label, cur, chg, clr);
  list.append(row);
  rows[a] = { row, label, cur, chg, clr };
});

function labels() {
  title.textContent = t("gTitle", "Customize gestures");
  help.textContent = t(
    "gHelp",
    "Each action has its own gesture, and no two actions can share one. Choose Change, then show the new gesture and hold it. If another action already uses it, the two swap places. Pointing with your index finger always moves the pointer.",
  );
  resetB.textContent = t("gReset", "Reset to defaults");
  closeB.textContent = t("gClose", "Done");
  ACTIONS.forEach(([a]) => {
    const r = rows[a];
    r.label.textContent = actionLabel(a);
    r.cur.textContent = GestureMap.nameOf(a);
    r.chg.textContent = listening === a ? t("gCancel", "Cancel") : t("gChange", "Change");
    r.clr.textContent = t("gClear", "Clear");
    r.chg.setAttribute("aria-label", t("gChange", "Change") + ": " + actionLabel(a));
    r.clr.setAttribute("aria-label", t("gClear", "Clear") + ": " + actionLabel(a));
    r.row.classList.toggle("listening", listening === a);
  });
}
function listen(a) {
  if (listening === a) {
    listening = null;
    status.textContent = "";
    return labels();
  }
  listening = a;
  labels();
  status.textContent =
    t("gListen", "Show the new gesture for") + " “" + actionLabel(a) + "” " +
    t("gHold", "and hold it. The camera must be on.");
}
function captured(g) {
  if (!g || g === RESERVED) {
    status.textContent = t("gReserved", "That pose moves the pointer, so it can't be used for an action.");
    return;
  }
  if (!GESTURES[g]) {
    status.textContent = t("gUnknown", "That gesture can't be assigned. Try another.");
    return;
  }
  const a = listening;
  listening = null;
  if (GestureMap.set(a, g))
    status.textContent = actionLabel(a) + " → " + GestureMap.nameOf(a);
  labels();
}
resetB.onclick = () => {
  GestureMap.reset();
  listening = null;
  status.textContent = t("gWasReset", "Gestures are back to the defaults.");
  labels();
};
let opener = null;
export function openGestureEditor() {
  opener = document.activeElement;
  paused = true;
  overlay.hidden = false;
  status.textContent = "";
  labels();
  closeB.focus();
}
function closeEditor() {
  listening = null;
  paused = false;
  overlay.hidden = true;
  opener && opener.focus && opener.focus();
}
closeB.onclick = closeEditor;
addEventListener("keydown", (e) => {
  if (!overlay.hidden && e.key === "Escape") {
    e.stopPropagation();
    closeEditor();
  }
}, true);
// show the live gesture inside the dialog so users can see what is detected
GestureEngine.onFrame((g) => {
  if (!overlay.hidden && !listening)
    status.textContent = g ? t("gSeeing", "Seeing") + ": " + gestureName(g) : "";
});
GestureMap.onChange(labels);
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-gedit]");
  if (b) openGestureEditor();
});
lang.addEventListener("change", changed);
changed();
