(function () {
  const engine = window.GestureEngine;
  const page = document.getElementById("basics");
  const grid = document.getElementById("bsGrid");
  const count = document.getElementById("bsCount");
  const bar = document.getElementById("bsBar");
  const msg = document.getElementById("bsMsg");
  const t = (k) => (window.Settings ? window.Settings.t(k) : k);
  const map = window.GestureMap;
  // [id, label key/fallback]; tiles follow the user's own gesture map
  const ACTS = [
    ["scrollUp", "Scroll up"],
    ["scrollDown", "Scroll down"],
    ["nextPage", "Next page"],
    ["prevPage", "Previous page"],
    ["zoomIn", "Zoom in"],
    ["zoomOut", "Zoom out"],
    ["readAloud", "Read aloud"],
    ["start", "Start / stop"],
    ["jump", "Jump (game)"],
    ["duck", "Duck (game)"],
  ];
  const items = [["Pointer", "", ""], ...ACTS.map(([a]) => [a, "", ""]), ["Pinch", "", ""]];
  const actLabel = (a, fb) => t("act_" + a) !== "act_" + a ? t("act_" + a) : fb;
  const tiles = {};
  let done = new Set();
  try {
    done = new Set(JSON.parse(localStorage.getItem("hw_basics2") || "[]"));
  } catch (e) {}
  items.forEach(([id]) => {
    const tile = document.createElement("div");
    tile.className = "bs-tile";
    tile.innerHTML = "<b></b><span></span><em></em>";
    grid.append(tile);
    tiles[id] = tile;
  });
  function labels() {
    tiles.Pointer.children[0].textContent = "Point with your index finger";
    tiles.Pointer.children[1].textContent = "Moves the air mouse pointer";
    tiles.Pinch.children[0].textContent = "Pinch thumb and index finger";
    tiles.Pinch.children[1].textContent = "Click with the air mouse";
    ACTS.forEach(([a, fb]) => {
      tiles[a].children[0].textContent = map ? map.nameOf(a) : a;
      tiles[a].children[1].textContent = actLabel(a, fb);
    });
  }
  function render() {
    labels();
    items.forEach(([id]) => {
      const learned = done.has(id);
      tiles[id].classList.toggle("done", learned);
      tiles[id].children[2].textContent = learned ? t("bsDone") : t("bsTry");
    });
    count.textContent = done.size + " " + t("bsOf") + " " + items.length;
    bar.style.width = (done.size / items.length) * 100 + "%";
    msg.textContent = done.size === items.length ? t("bsAll") : "";
  }
  const gid = (id) => (id === "Pointer" ? "Pointing_Up" : map && map.gestureOf(id));
  function mark(id) {
    if (done.has(id)) return;
    done.add(id);
    try {
      localStorage.setItem("hw_basics2", JSON.stringify([...done]));
    } catch (e) {}
    render();
    if (done.size < items.length)
      msg.textContent = tiles[id].children[0].textContent + ": " + t("bsDone");
  }
  if (engine) {
    engine.onFrame((g, held) => {
      if (!page.classList.contains("active")) return;
      Object.keys(tiles).forEach((k) =>
        tiles[k].classList.toggle("live", !!g && k !== "Pinch" && gid(k) === g),
      );
      if (g && held >= engine.holdMs)
        Object.keys(tiles).forEach((k) => k !== "Pinch" && gid(k) === g && mark(k));
    });
  }
  document.addEventListener("hw-pinch", () => {
    if (page.classList.contains("active")) mark("Pinch");
  });
  document.addEventListener("pagechange", (e) => {
    if (e.detail === "basics") render();
  });
  document.getElementById("bsReset").onclick = () => {
    done.clear();
    try {
      localStorage.removeItem("hw_basics2");
    } catch (e) {}
    render();
  };
  if (map) map.onChange(render);
  render();
})();
