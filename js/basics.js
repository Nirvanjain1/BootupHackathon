(function () {
  const engine = window.GestureEngine;
  const page = document.getElementById("basics");
  const grid = document.getElementById("bsGrid");
  const count = document.getElementById("bsCount");
  const bar = document.getElementById("bsBar");
  const msg = document.getElementById("bsMsg");
  const t = (k) => (window.Settings ? window.Settings.t(k) : k);
  const items = [
    ["Victory", "Peace sign", "Next page"],
    ["Pointing_Up", "Pointing up", "Previous page"],
    ["Thumb_Up", "Thumbs up", "Scroll up or start speaking"],
    ["Thumb_Down", "Thumbs down", "Scroll down"],
    ["Open_Palm", "Open palm", "Zoom in or jump"],
    ["Closed_Fist", "Closed fist", "Zoom out or duck"],
    ["ILoveYou", "Thumb, index and little finger out", "Read aloud"],
    ["Pinch", "Pinch thumb and index finger", "Click with the air mouse"],
  ];
  const tiles = {};
  let done = new Set();
  try {
    done = new Set(JSON.parse(localStorage.getItem("hw_basics") || "[]"));
  } catch (e) {}
  items.forEach(([id, name, use]) => {
    const tile = document.createElement("div");
    tile.className = "bs-tile";
    tile.innerHTML = "<b></b><span></span><em></em>";
    tile.children[0].textContent = name;
    tile.children[1].textContent = use;
    grid.append(tile);
    tiles[id] = tile;
  });
  function render() {
    items.forEach(([id]) => {
      const learned = done.has(id);
      tiles[id].classList.toggle("done", learned);
      tiles[id].children[2].textContent = learned ? t("bsDone") : t("bsTry");
    });
    count.textContent = done.size + " " + t("bsOf") + " " + items.length;
    bar.style.width = (done.size / items.length) * 100 + "%";
    msg.textContent = done.size === items.length ? t("bsAll") : "";
  }
  function mark(id) {
    if (done.has(id)) return;
    done.add(id);
    try {
      localStorage.setItem("hw_basics", JSON.stringify([...done]));
    } catch (e) {}
    render();
    if (done.size < items.length)
      msg.textContent = tiles[id].children[0].textContent + ": " + t("bsDone");
  }
  if (engine) {
    engine.onFrame((g, held) => {
      if (!page.classList.contains("active")) return;
      Object.keys(tiles).forEach((k) =>
        tiles[k].classList.toggle("live", k === g),
      );
      if (g && tiles[g] && held >= engine.holdMs) mark(g);
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
      localStorage.removeItem("hw_basics");
    } catch (e) {}
    render();
  };
  render();
})();
