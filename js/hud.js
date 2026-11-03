import { GestureEngine } from "./gesture-engine.js";
const hud = document.createElement("div");
hud.id = "hud";
hud.innerHTML = '<span class="n"></span><i class="hb"></i>';
document.body.append(hud);
GestureEngine.onFrame((g, held) => {
  if (!g) {
    hud.style.display = "none";
    return;
  }
  hud.style.display = "flex";
  hud.querySelector(".n").textContent = g.replace("_", " ");
  hud.querySelector(".hb").style.width =
    Math.min(100, (held / GestureEngine.holdMs) * 100) + "%";
});
