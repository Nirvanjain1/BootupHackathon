export const $ = (s) => document.querySelector(s);
const toasts = document.createElement("div");
toasts.id = "toasts";
toasts.setAttribute("aria-live", "polite");
document.body.append(toasts);
export function toast(m) {
  const e = document.createElement("div");
  e.className = "toast";
  e.textContent = m;
  toasts.append(e);
  setTimeout(() => e.classList.add("out"), 2400);
  setTimeout(() => e.remove(), 2800);
}
export const onGamePage = () =>
  document.querySelector("#echo").classList.contains("active") &&
  !!window.echoRunning &&
  window.echoRunning();
export const onReader = () =>
  document.querySelector("#reader").classList.contains("active");
