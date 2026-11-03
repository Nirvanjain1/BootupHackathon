import { toast, onReader } from "./utils.js";
import { spStop } from "./speaking.js";
import { goPage, zoomBy, readPage } from "./reader.js";
function showPage(id) {
  if (id !== "speak") spStop(false);
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.toggle("active", p.id === id));
  document.dispatchEvent(new CustomEvent("pagechange", { detail: id }));
  history.replaceState(null, "", "#" + id);
  window.scrollTo({ top: 0 });
  document.querySelectorAll(".nav-btn").forEach((b) => {
    if (b.dataset.page === id) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
}
document
  .querySelectorAll(".nav-btn")
  .forEach((b) => b.addEventListener("click", () => showPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    showPage(a.dataset.go);
  }),
);
addEventListener("keydown", (e) => {
  if (e.target.matches && e.target.matches("input,textarea,select")) return;
  const pages = ["home", "reader", "basics", "speak", "echo", "extension"];
  if (e.key === "Escape") spStop(true);
  if (
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !document.querySelector("#echo").classList.contains("active") &&
    pages[+e.key - 1]
  )
    showPage(pages[+e.key - 1]);
  if (onReader() && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const k = e.key;
    if (k === "ArrowRight" || k === "PageDown") goPage(1);
    else if (k === "ArrowLeft" || k === "PageUp") goPage(-1);
    else if (k === "+" || k === "=") zoomBy(1.2);
    else if (k === "-") zoomBy(1 / 1.2);
    else if (k === "r" || k === "R") readPage();
  }
  if (e.key === "?")
    toast(
      "Keys: 1 Home, 2 Reader, 3 Gesture basics, 4 Speaking, 5 Listening, 6 Extension, Esc to stop. Reader: arrow keys for pages, + and - to zoom, R to read aloud",
    );
});
const validPage = (id) => {
  const e = document.getElementById(id);
  return e && e.classList.contains("page") ? id : "home";
};
showPage(validPage(location.hash.slice(1)));
addEventListener("hashchange", () =>
  showPage(validPage(location.hash.slice(1))),
);
