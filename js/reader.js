import { $, toast, onReader } from "./utils.js";
import { GestureEngine } from "./gesture-engine.js";
import { GestureMap } from "./gestures.js";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
let pdfDoc = null,
  pageNum = 1,
  scale = 1.3;
const DPR = Math.min(2, window.devicePixelRatio || 1);
let renderedScale = scale,
  cssK = 1,
  rendering = false,
  rerender = false,
  zoomTimer = 0;
function fitCss() {
  const c = $("#pdf");
  c.style.width = (c.width / cssK) * (scale / renderedScale) + "px";
}
async function renderPDF() {
  if (!pdfDoc) return;
  if (rendering) {
    rerender = true;
    return;
  }
  rendering = true;
  try {
    const page = await pdfDoc.getPage(pageNum),
      used = scale;
    let k = used * DPR,
      vp = page.getViewport({ scale: k });
    const area = vp.width * vp.height;
    if (area > 16e6) {
      k *= Math.sqrt(16e6 / area);
      vp = page.getViewport({ scale: k });
    }
    const oc = document.createElement("canvas");
    oc.width = Math.floor(vp.width);
    oc.height = Math.floor(vp.height);
    await page.render({ canvasContext: oc.getContext("2d"), viewport: vp })
      .promise;
    const canvas = $("#pdf");
    canvas.width = oc.width;
    canvas.height = oc.height;
    canvas.getContext("2d").drawImage(oc, 0, 0);
    renderedScale = used;
    cssK = k / used;
    fitCss();
    $("#info").textContent = pageNum + " / " + pdfDoc.numPages;
    $("#view").classList.add("has");
    $("#pgBar").style.width = (pageNum / pdfDoc.numPages) * 100 + "%";
  } finally {
    rendering = false;
    if (rerender) {
      rerender = false;
      renderPDF();
    }
  }
}
export function goPage(delta) {
  if (pdfDoc && pageNum + delta >= 1 && pageNum + delta <= pdfDoc.numPages) {
    pageNum += delta;
    $("#view").scrollTop = 0;
    renderPDF();
  }
}
export function zoomBy(f) {
  if (!pdfDoc) return;
  const v = $("#view"),
    old = scale;
  scale = Math.min(3, Math.max(0.5, scale * f));
  const r = scale / old;
  if (r === 1) return;
  const cx = v.scrollLeft + v.clientWidth / 2,
    cy = v.scrollTop + v.clientHeight / 2;
  fitCss();
  v.scrollLeft = cx * r - v.clientWidth / 2;
  v.scrollTop = cy * r - v.clientHeight / 2;
  clearTimeout(zoomTimer);
  zoomTimer = setTimeout(renderPDF, 160);
}
function zoomPDF(delta) {
  zoomBy(delta > 0 ? 1.2 : 1 / 1.2);
}
export async function readPage() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    return;
  }
  if (!pdfDoc) return;
  const content = await (await pdfDoc.getPage(pageNum)).getTextContent();
  const utterance = new SpeechSynthesisUtterance(
    content.items.map((i) => i.str).join(" "),
  );
  utterance.lang = Settings.lang === "hi" ? "hi-IN" : "en-US";
  speechSynthesis.speak(utterance);
}
$("#open").onclick = () => $("#file").click();
async function loadPDF(file) {
  if (!file) return;
  if (file.type !== "application/pdf") {
    toast("That doesn't look like a PDF. Mind trying another?");
    return;
  }
  try {
    pdfDoc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() })
      .promise;
    pageNum = 1;
    await renderPDF();
    toast("Opened " + file.name + "");
  } catch (err) {
    toast("Hmm, I couldn't open that one. Try another PDF?");
  }
}
$("#file").onchange = (e) => loadPDF(e.target.files[0]);
const viewEl = $("#view");
["dragenter", "dragover"].forEach((ev) =>
  viewEl.addEventListener(ev, (e) => {
    e.preventDefault();
    viewEl.classList.add("drag");
  }),
);
["dragleave", "drop"].forEach((ev) =>
  viewEl.addEventListener(ev, (e) => {
    e.preventDefault();
    viewEl.classList.remove("drag");
  }),
);
viewEl.addEventListener("drop", (e) => loadPDF(e.dataTransfer.files[0]));
$("#prev").onclick = () => goPage(-1);
$("#next").onclick = () => goPage(1);
$("#zin").onclick = () => zoomPDF(0.2);
$("#zout").onclick = () => zoomPDF(-0.2);
$("#read").onclick = readPage;
// Reader actions come from the shared gesture map (one gesture per action).
GestureMap.on("nextPage", () => onReader() && goPage(1));
GestureMap.on("prevPage", () => onReader() && goPage(-1));
GestureMap.on("readAloud", () => onReader() && readPage());
const CMDS = {
  next: { once: () => goPage(1) },
  prev: { once: () => goPage(-1) },
  up: {
    once: () => {
      $("#view").scrollTop -= 140;
    },
    rep: () => {
      $("#view").scrollTop -= 14;
    },
  },
  down: {
    once: () => {
      $("#view").scrollTop += 140;
    },
    rep: () => {
      $("#view").scrollTop += 14;
    },
  },
  zin: { once: () => zoomBy(1.2), rep: () => zoomBy(1.03) },
  zout: { once: () => zoomBy(1 / 1.2), rep: () => zoomBy(1 / 1.03) },
  read: { once: readPage },
};
document.querySelectorAll("[data-cmd]").forEach((b) => {
  const c = CMDS[b.dataset.cmd];
  let t = 0,
    iv = 0,
    repeating = false;
  const stop = () => {
    clearTimeout(t);
    clearInterval(iv);
  };
  b.addEventListener("pointerdown", () => {
    repeating = false;
    if (!c.rep) return;
    t = setTimeout(() => {
      repeating = true;
      iv = setInterval(c.rep, 33);
    }, 350);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    b.addEventListener(ev, stop),
  );
  b.addEventListener("click", () => {
    if (repeating) {
      repeating = false;
      return;
    }
    c.once();
  });
});
function scrollBy(step) {
  if (onReader() && $("#view").scrollHeight > $("#view").clientHeight + 2) {
    $("#view").scrollTop += step;
  } else {
    window.scrollBy({ top: step, left: 0, behavior: "auto" });
  }
}
// scrolling works on every page (universal); zoom only in the reader
GestureMap.whileHeld("scrollUp", 150, () => scrollBy(-14));
GestureMap.whileHeld("scrollDown", 150, () => scrollBy(14));
GestureMap.whileHeld("zoomIn", 250, () => onReader() && zoomBy(1.02));
GestureMap.whileHeld("zoomOut", 250, () => onReader() && zoomBy(1 / 1.02));
const CMD_ACTION = {
  next: "nextPage",
  prev: "prevPage",
  up: "scrollUp",
  down: "scrollDown",
  zin: "zoomIn",
  zout: "zoomOut",
  read: "readAloud",
};
GestureEngine.onFrame((g) => {
  document
    .querySelectorAll(".cmd")
    .forEach((b) =>
      b.classList.toggle(
        "on",
        !!g && GestureMap.gestureOf(CMD_ACTION[b.dataset.cmd]) === g,
      ),
    );
  $("#readerGesture").textContent = g ? g.replace(/_/g, " ") : "-";
});
