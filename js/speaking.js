import { $, toast } from "./utils.js";
import { GestureEngine } from "./gesture-engine.js";
import { lang } from "./settings.js";
import { WORDS_EN, WORDS_HI, SENT_EN, SENT_HI, SPM } from "./speaking-data.js";
const isHi = () => Settings.lang === "hi";
const M = (k) => SPM[isHi() ? "hi" : "en"][k];
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const sp = {
  mode: "words",
  dur: 30,
  words: [],
  els: [],
  idx: 0,
  running: false,
  start: 0,
  end: 0,
  correct: 0,
  wrong: 0,
  timer: 0,
  rec: null,
  rid: 0,
  sid: 0,
  consumed: {},
  quick: 0,
  recStart: 0,
  lastSound: 0,
  stream: null,
  ac: null,
  raf: 0,
  meter: false,
};
const norm = (w) =>
  String(w)
    .toLowerCase()
    .replace(/[.,!?।;:"'“”‘’()\-–—…]/g, "")
    .trim();
function genWords(n) {
  const pool = isHi() ? WORDS_HI : WORDS_EN,
    out = [];
  let last = "";
  while (out.length < n) {
    const w = pool[Math.floor(Math.random() * pool.length)];
    if (w !== last) {
      out.push(w);
      last = w;
    }
  }
  return out;
}
function genSentences(n) {
  const pool = isHi() ? SENT_HI : SENT_EN,
    out = [];
  let bag = [];
  while (out.length < n) {
    if (!bag.length) bag = [...pool].sort(() => Math.random() - 0.5);
    out.push(...bag.pop().split(/\s+/));
  }
  return out;
}
function genMore(n) {
  return sp.mode === "words" ? genWords(n) : genSentences(n);
}
function appendSpans(from) {
  const box = $("#spBox"),
    frag = document.createDocumentFragment();
  for (let i = from; i < sp.words.length; i++) {
    const e = document.createElement("span");
    e.className = "w";
    e.textContent = sp.words[i];
    sp.els[i] = e;
    frag.append(e, document.createTextNode(" "));
  }
  box.append(frag);
}
function setStatus(text, err) {
  const e = $("#spStatus");
  e.textContent = text || "";
  e.classList.toggle("err", !!err);
}
function spLabel() {
  const b = $("#spStart");
  b.textContent = sp.running ? Settings.t("spStop") : Settings.t("spStart");
  b.setAttribute("aria-pressed", sp.running);
}
function spCursor() {
  sp.els.forEach((e) => e.classList.remove("cur"));
  const e = sp.els[sp.idx],
    box = $("#spBox");
  $("#spFocus").textContent = sp.words[sp.idx] || "";
  if (e) {
    e.classList.add("cur");
    box.scrollTop = Math.max(
      0,
      e.offsetTop - box.clientHeight / 2 + e.offsetHeight / 2,
    );
  }
}
function spBuild() {
  sp.words = genMore(
    sp.mode === "words" ? (sp.dur ? 40 : 25) : sp.dur ? 45 : 30,
  );
  sp.els = [];
  sp.idx = 0;
  sp.correct = 0;
  sp.wrong = 0;
  sp.start = 0;
  sp.end = 0;
  sp.consumed = {};
  $("#spBox").textContent = "";
  $("#spBox").scrollTop = 0;
  appendSpans(0);
  spCursor();
  $("#spHeard").textContent = "";
  $("#spResult").classList.remove("show");
  $("#spResult").textContent = "";
  setStatus(SR ? M("idle") : M("nosr"), !SR);
  stats();
}
function stats() {
  const now = performance.now(),
    el = sp.start ? (sp.running ? now : sp.end) - sp.start : 0;
  const tot = sp.correct + sp.wrong;
  $("#spWpm").textContent = el
    ? Math.round(sp.correct / (Math.max(el, 3e3) / 6e4))
    : 0;
  $("#spAcc").textContent = tot
    ? Math.round((sp.correct / tot) * 100) + "%"
    : "-";
  $("#spWords").textContent = sp.correct;
  let time = "-";
  if (sp.running)
    time = sp.dur
      ? Math.max(0, Math.ceil(sp.dur - el / 1e3)) + "s"
      : Math.floor(el / 1e3) + "s";
  else if (sp.start) time = Math.round(el / 1e3) + "s";
  else if (sp.dur) time = sp.dur + "s";
  $("#spTime").textContent = time;
  const pct = sp.dur
    ? el / (sp.dur * 1e3)
    : sp.words.length
      ? sp.idx / sp.words.length
      : 0;
  $("#spBar").style.width = Math.min(100, pct * 100) + "%";
}
function mark(i, cls) {
  const e = sp.els[i];
  if (e) {
    e.classList.remove("cur");
    e.classList.add(cls);
  }
}
function advance(ok) {
  mark(sp.idx, ok ? "ok" : "bad");
  if (ok) sp.correct++;
  else sp.wrong++;
  sp.idx++;
  if (sp.dur && sp.words.length - sp.idx < 8) {
    const from = sp.words.length;
    sp.words.push(...genMore(20));
    appendSpans(from);
  }
  if (sp.idx >= sp.words.length) {
    spStop(true);
    return;
  }
  spCursor();
  stats();
}
function feed(words, final, rid) {
  let c = sp.consumed[rid] || 0;
  while (sp.running && c < words.length && sp.idx < sp.words.length) {
    const target = norm(sp.words[sp.idx]),
      j = words.indexOf(target, c);
    if (j >= 0) {
      c = j + 1;
      advance(true);
      continue;
    }
    if (!final) break;
    let hit = 0;
    for (let k = 1; k <= 2 && sp.idx + k < sp.words.length; k++)
      if (words[c] === norm(sp.words[sp.idx + k])) {
        hit = k;
        break;
      }
    c++;
    for (let k = 0; k < hit && sp.running; k++) advance(false);
    if (!sp.running) break;
    advance(hit > 0);
  }
  sp.consumed[rid] = c;
}
const spHist = () => {
  try {
    const h = JSON.parse(localStorage.getItem("hw_sp"));
    return Array.isArray(h) ? h : [];
  } catch (e) {
    return [];
  }
};
function spBestShow() {
  $("#spBest").textContent = spHist().reduce(
    (m, x) => Math.max(m, +x.wpm || 0),
    0,
  );
}
function showResult() {
  const el = sp.end - sp.start,
    tot = sp.correct + sp.wrong,
    wpm = Math.round(sp.correct / (Math.max(el, 3e3) / 6e4)),
    acc = tot ? Math.round((sp.correct / tot) * 100) : 100;
  let h = spHist();
  const prev = h.reduce((m, x) => Math.max(m, +x.wpm || 0), 0),
    isBest = sp.correct >= 5 && wpm > prev;
  if (sp.correct > 0) {
    h.push({ wpm: wpm, acc: acc });
    h = h.slice(-10);
    try {
      localStorage.setItem("hw_sp", JSON.stringify(h));
    } catch (e) {}
  }
  spBestShow();
  const msg =
    sp.correct === 0
      ? M("r0")
      : isBest
        ? M("rb")
        : acc >= 90
          ? M("r9")
          : acc >= 60
            ? M("r6")
            : M("r3");
  const max = Math.max(1, ...h.map((x) => +x.wpm || 0)),
    pts = h
      .map(
        (x, i) =>
          (h.length > 1 ? (i / (h.length - 1)) * 200 : 100).toFixed(1) +
          "," +
          (46 - ((+x.wpm || 0) / max) * 40).toFixed(1),
      )
      .join(" ");
  const res = $("#spResult");
  res.textContent = "";
  const hd = document.createElement("h2");
  hd.style.cssText = "margin:0 0 6px;color:var(--accent)";
  hd.textContent = msg + (isBest ? "" : "");
  const ln = document.createElement("p");
  ln.style.margin = "0";
  ln.innerHTML =
    "<b>" +
    wpm +
    " WPM</b> · " +
    acc +
    "% " +
    M("acc") +
    " · " +
    sp.correct +
    " " +
    M("said");
  res.append(hd, ln);
  if (h.length > 1) {
    const w = document.createElement("div");
    w.innerHTML =
      "<svg viewBox='0 0 200 50' width='240' height='60' role='img' aria-label='WPM of your last sessions'><polyline points='" +
      pts +
      "' fill='none' stroke='var(--teal)' stroke-width='3' stroke-linejoin='round' stroke-linecap='round'/></svg><span class='hint'>" +
      M("result") +
      ": " +
      h.length +
      "</span>";
    res.append(w);
  }
  res.classList.add("show");
  if (isBest)
    toast(isHi() ? "नया रिकॉर्ड!" : "A new personal best. Well done!");
}
export function spStop(show) {
  if (!sp.running) return;
  sp.running = false;
  sp.end = performance.now();
  sp.sid++;
  clearInterval(sp.timer);
  const rec = sp.rec;
  sp.rec = null;
  if (rec) {
    rec.onresult = rec.onend = rec.onerror = rec.onstart = null;
    try {
      rec.abort();
    } catch (e) {}
  }
  stopMeter();
  $("#spBox").classList.remove("live");
  $("#spLevel i").style.width = "0";
  setStatus(M("idle"));
  spLabel();
  stats();
  if (show) showResult();
}
function spFail(key) {
  spStop(false);
  setStatus(M(key), true);
}
async function startMeter(sid) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (sp.sid !== sid || !sp.running) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext,
      ac = new AC();
    sp.stream = stream;
    sp.ac = ac;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const an = ac.createAnalyser();
    an.fftSize = 512;
    ac.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize),
      bar = $("#spLevel i");
    sp.meter = true;
    sp.lastSound = performance.now();
    const loop = () => {
      if (sp.sid !== sid) return;
      sp.raf = requestAnimationFrame(loop);
      an.getByteTimeDomainData(buf);
      let m = 0;
      for (let i = 0; i < buf.length; i++) {
        const d = Math.abs(buf[i] - 128);
        if (d > m) m = d;
      }
      const lvl = m / 128;
      bar.style.width = Math.min(100, lvl * 220) + "%";
      if (lvl > 0.05) sp.lastSound = performance.now();
    };
    loop();
  } catch (e) {
    sp.meter = false;
  }
}
function stopMeter() {
  cancelAnimationFrame(sp.raf);
  sp.meter = false;
  if (sp.stream) {
    sp.stream.getTracks().forEach((t) => t.stop());
    sp.stream = null;
  }
  if (sp.ac) {
    const ac = sp.ac;
    sp.ac = null;
    try {
      ac.close().catch(() => {});
    } catch (e) {}
  }
}
function startRec() {
  const rec = new SR();
  sp.rec = rec;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.lang = isHi() ? "hi-IN" : "en-US";
  sp.recStart = performance.now();
  rec.onstart = () => {
    sp.rid++;
    sp.recStart = performance.now();
  };
  rec.onresult = (e) => {
    if (!sp.running || sp.rec !== rec) return;
    try {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i],
          words = String(r[0].transcript)
            .split(/\s+/)
            .map(norm)
            .filter(Boolean);
        feed(words, !!r.isFinal, sp.rid + ":" + i);
      }
      if (sp.running) {
        const all = [];
        for (let i = 0; i < e.results.length; i++)
          all.push(String(e.results[i][0].transcript).trim());
        $("#spHeard").textContent =
          M("heard") + ": " + all.join(" ").split(/\s+/).slice(-10).join(" ");
      }
    } catch (err) {}
  };
  rec.onerror = (ev) => {
    if (sp.rec !== rec) return;
    const er = ev && ev.error;
    if (er === "no-speech" || er === "aborted") return;
    if (er === "not-allowed" || er === "service-not-allowed") spFail("blocked");
    else if (er === "audio-capture") spFail("nomic");
    else if (er === "network") spFail("net");
    else if (er === "language-not-supported") spFail("lang");
  };
  rec.onend = () => {
    if (!sp.running || sp.rec !== rec) return;
    if (performance.now() - sp.recStart < 700) {
      if (++sp.quick >= 4) {
        spFail("restart");
        return;
      }
    } else sp.quick = 0;
    setTimeout(() => {
      if (sp.running && sp.rec === rec) {
        try {
          rec.start();
        } catch (e) {}
      }
    }, 200);
  };
  try {
    rec.start();
  } catch (e) {
    spFail("restart");
  }
}
function spBegin() {
  if (sp.running) {
    spStop(true);
    return;
  }
  if (!SR) {
    setStatus(M("nosr"), true);
    return;
  }
  spBuild();
  sp.running = true;
  sp.sid++;
  const sid = sp.sid;
  sp.start = performance.now();
  sp.end = 0;
  sp.lastSound = sp.start;
  sp.quick = 0;
  sp.rid = 0;
  sp.consumed = {};
  $("#spBox").classList.add("live");
  spLabel();
  setStatus(M("listening"));
  startRec();
  if (sp.running) {
    startMeter(sid);
    clearInterval(sp.timer);
    sp.timer = setInterval(() => {
      if (!sp.running) return;
      const now = performance.now();
      stats();
      if (sp.dur && now - sp.start >= sp.dur * 1e3) {
        spStop(true);
        return;
      }
      setStatus(
        sp.meter && now - sp.start > 4e3 && now - sp.lastSound > 4e3
          ? M("quiet")
          : M("listening"),
      );
    }, 200);
  }
}
$("#spStart").onclick = spBegin;
$("#spReset").onclick = () => {
  spStop(false);
  spBuild();
};
$("#spSkip").onclick = () => {
  if (sp.running) advance(false);
};
document.querySelectorAll(".sp-mode").forEach(
  (b) =>
    (b.onclick = () => {
      sp.mode = b.dataset.mode;
      document
        .querySelectorAll(".sp-mode")
        .forEach((x) => x.setAttribute("aria-pressed", x === b));
      spStop(false);
      spBuild();
    }),
);
document.querySelectorAll(".sp-dur").forEach(
  (b) =>
    (b.onclick = () => {
      sp.dur = +b.dataset.dur;
      document
        .querySelectorAll(".sp-dur")
        .forEach((x) => x.setAttribute("aria-pressed", x === b));
      spStop(false);
      spBuild();
    }),
);
lang.addEventListener("change", () => {
  spStop(false);
  spBuild();
  spLabel();
});
GestureEngine.onGesture((g) => {
  if (
    g === "Thumb_Up" &&
    document.querySelector("#speak").classList.contains("active")
  )
    spBegin();
});
if (!SR) $("#spStart").disabled = true;
spBuild();
spBestShow();
spLabel();
