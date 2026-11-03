import { T } from "./translations.js";
import { toast } from "./utils.js";
let S = { lang: "en", hc: false, fs: 18, accent: "#8b9cff" };
const sw = [];
try {
  S = { ...S, ...JSON.parse(localStorage.getItem("hw_set")) };
} catch (e) {}
const OLD = { "#ffc233": "#8b9cff", "#3dd6c3": "#4fd8c4", "#ff7ab6": "#ff8fb8", "#6cb6ff": "#8b9cff", "#8be35a": "#a6e46b" };
if (OLD[S.accent]) S.accent = OLD[S.accent];
const save = () => {
  try {
    localStorage.setItem("hw_set", JSON.stringify(S));
  } catch (e) {}
};
const t = (k) => (T[S.lang] && T[S.lang][k]) || T.en[k] || k;
function apply() {
  document.documentElement.lang = S.lang;
  document.body.classList.toggle("hc", S.hc);
  document.documentElement.style.setProperty("--fs", S.fs + "px");
  document.documentElement.style.setProperty("--accent", S.accent);
  sw.forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === S.accent));
  document
    .querySelectorAll("[data-i18n]")
    .forEach((e) => (e.textContent = t(e.dataset.i18n)));
  greet();
}
const bar = document.createElement("div");
bar.id = "a11y-bar";
const add = (tag, fn, key, txt, label) => {
  const e = document.createElement(tag);
  if (key) e.dataset.i18n = key;
  if (txt) e.textContent = txt;
  if (label) e.setAttribute("aria-label", label);
  if (fn) e.onclick = fn;
  bar.append(e);
  return e;
};
export const lang = add("select");
lang.setAttribute("aria-label", "Language");
[
  ["en", "English"],
  ["hi", "हिन्दी"],
].forEach(([v, l]) => lang.add(new Option(l, v)));
lang.value = S.lang;
lang.onchange = () => {
  S.lang = lang.value;
  save();
  apply();
};
add(
  "button",
  () => {
    S.hc = !S.hc;
    save();
    apply();
  },
  "contrast",
);
add(
  "button",
  () => {
    S.fs = Math.max(14, S.fs - 3);
    save();
    apply();
  },
  null,
  "A−",
  "Smaller text",
);
add(
  "button",
  () => {
    S.fs = Math.min(36, S.fs + 3);
    save();
    apply();
  },
  null,
  "A+",
  "Larger text",
);
[
  ["#8b9cff", "Periwinkle"],
  ["#4fd8c4", "Aqua"],
  ["#ff8fb8", "Rose"],
  ["#ffc857", "Sun"],
  ["#a6e46b", "Lime"],
].forEach(([c, n]) => {
  const b = add(
    "button",
    () => {
      S.accent = c;
      save();
      apply();
      toast(n + " selected");
    },
    null,
    "",
    "Accent colour " + n,
  );
  b.className = "swatch";
  b.dataset.c = c;
  b.style.setProperty("--c", c);
  sw.push(b);
});
(document.getElementById("a11y-slot") || document.body).append(bar);
apply();
window.Settings = {
  t: t,
  get lang() {
    return S.lang;
  },
};
function greet() {
  const e = document.querySelector("#greet");
  if (!e) return;
  const h = new Date().getHours(),
    hi = S.lang === "hi";
  e.textContent = hi
    ? (h < 12 ? "सुप्रभात" : h < 17 ? "नमस्ते" : "शुभ संध्या") +
      "। आज आप क्या करना चाहेंगे?"
    : (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening") +
      ". What would you like to do?";
}
