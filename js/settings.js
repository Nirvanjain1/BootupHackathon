import { T } from "./translations.js";
import { toast } from "./utils.js";
let S = { lang: "en", hc: false, fs: 18, accent: "#ffc233" };
const sw = [];
try {
  S = { ...S, ...JSON.parse(localStorage.getItem("hw_set")) };
} catch (e) {}
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
  ["#ffc233", "Amber"],
  ["#3dd6c3", "Teal"],
  ["#ff7ab6", "Pink"],
  ["#6cb6ff", "Blue"],
  ["#8be35a", "Green"],
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
  b.style.background = c;
  sw.push(b);
});
document.body.prepend(bar);
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
