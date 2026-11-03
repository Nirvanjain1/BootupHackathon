(function () {
  const echoPage = document.getElementById("echo");
  const $ = (id) => document.getElementById(id);
  const cv = $("cv"),
    g = cv.getContext("2d");
  let ctx,
    master,
    voice = true,
    last = 0,
    best = 0,
    diff = "normal",
    immersive = true,
    practice = false;
  try {
    best = +localStorage.getItem("echoBest") || 0;
  } catch (e) {}
  $("bs").textContent = best;
  const s = {
    run: false,
    lane: 1,
    jump: 0,
    duck: 0,
    lives: 3,
    score: 0,
    coins: 0,
    objs: [],
    t: 0,
    spawn: 1,
    speed: 1,
  };
  const TYPES = {
    block: {
      wave: "sawtooth",
      f: 110,
      lfo: 7,
      v: 0.9,
      name: "Wall. Rumble from the lane it blocks.",
      col: "#ff5d5d",
    },
    hurdle: {
      wave: "square",
      f: 350,
      lfo: 8,
      v: 0.3,
      dir: 1,
      name: "Hurdle. Beeps rising in pitch. Jump.",
      col: "#ffb13b",
    },
    overhead: {
      wave: "triangle",
      f: 1e3,
      lfo: 4,
      v: 0.6,
      dir: -1,
      name: "Low beam. Tone falling in pitch. Duck.",
      col: "#6fa8ff",
    },
    coin: {
      wave: "sine",
      f: 1500,
      lfo: 16,
      v: 0.6,
      name: "Coin. Shimmer from its lane.",
      col: "#ffd23f",
    },
  };
  function say(t) {
    $("live").textContent = t;
    if (!voice || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(t));
    } catch (e) {}
  }
  function initAudio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      ctx.onstatechange = audioStatus;
    }
    if (ctx.state !== "running")
      ctx
        .resume()
        .then(audioStatus)
        .catch(() => {});
    audioStatus();
  }
  function audioStatus() {
    $("au").textContent = "Audio: " + (ctx ? ctx.state : "not started");
  }
  function tone(f, d, type, vol, pan, f2) {
    const o = ctx.createOscillator(),
      a = ctx.createGain(),
      p = ctx.createStereoPanner(),
      n = ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, n);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + d);
    a.gain.setValueAtTime(vol, n);
    a.gain.exponentialRampToValueAtTime(0.001, n + d);
    p.pan.value = pan || 0;
    o.connect(a).connect(p).connect(master);
    o.start(n);
    o.stop(n + d + 0.05);
  }
  function noise(d, vol) {
    const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate),
      x = b.getChannelData(0);
    for (let i = 0; i < x.length; i++)
      x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
    const sN = ctx.createBufferSource(),
      a = ctx.createGain();
    a.gain.value = vol;
    sN.buffer = b;
    sN.connect(a).connect(master);
    sN.start();
  }
  function spatial(d) {
    const ad = Math.min(2, Math.abs(d)),
      sg = d < 0 ? -1 : 1;
    const pm = ad <= 0.5 ? ad * 2 * 0.8 : ad <= 1 ? 0.8 : 0.8 + 0.2 * (ad - 1);
    const at = ad <= 1 ? 1 - 0.2 * ad : 0.8 - 0.3 * (ad - 1);
    const fq = ad <= 1 ? 18e3 - 1e4 * ad : 8e3 - 7100 * (ad - 1);
    const lfoMul = ad <= 1 ? 1 : 1 - 0.5 * (ad - 1);
    return { pan: sg * pm, at: at, fq: fq, lfoMul: lfoMul };
  }
  function makeAudio(type, lane) {
    const T = TYPES[type];
    const osc = ctx.createOscillator();
    osc.type = T.wave;
    osc.frequency.value = T.f;
    const pulse = ctx.createGain();
    pulse.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = T.lfo;
    const lg = ctx.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg);
    lg.connect(pulse.gain);
    const vol = ctx.createGain();
    vol.gain.value = 0;
    const pan = ctx.createStereoPanner();
    pan.pan.value = lane == null ? 0 : (lane - 1) * 0.95;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 18e3;
    filt.Q.value = 0.3;
    osc.connect(pulse);
    pulse.connect(vol);
    vol.connect(filt);
    filt.connect(pan);
    pan.connect(master);
    osc.start();
    lfo.start();
    return { osc: osc, lfo: lfo, vol: vol, pan: pan, filt: filt, T: T };
  }
  function stopAudio(a) {
    const n = ctx.currentTime;
    a.vol.gain.cancelScheduledValues(n);
    a.vol.gain.setTargetAtTime(0, n, 0.03);
    a.osc.stop(n + 0.2);
    a.lfo.stop(n + 0.2);
  }
  function spawn() {
    const r = Math.random();
    const type =
      diff === "hard"
        ? r < 0.42
          ? "block"
          : r < 0.57
            ? "hurdle"
            : r < 0.72
              ? "overhead"
              : "coin"
        : r < 0.62
          ? "block"
          : "coin";
    const lane =
      type === "block" || type === "coin"
        ? Math.floor(Math.random() * 3)
        : null;
    s.objs.push({
      type: type,
      lane: lane,
      z: 1,
      done: false,
      a: makeAudio(type, lane),
    });
  }
  function resolve(o) {
    o.done = true;
    let hit = false;
    if (o.type === "block") hit = s.lane === o.lane;
    else if (o.type === "hurdle") hit = s.jump <= 0;
    else if (o.type === "overhead") hit = s.duck <= 0;
    else if (s.lane === o.lane) {
      s.coins++;
      s.score += 25;
      tone(1568, 0.12, "sine", 0.4, (o.lane - 1) * 0.9);
      setTimeout(
        () => s.run && tone(2093, 0.25, "sine", 0.4, (o.lane - 1) * 0.9),
        90,
      );
    }
    if (hit && practice) {
      tone(140, 0.3, "triangle", 0.3, 0, 90);
      hit = false;
    }
    if (hit) {
      s.lives--;
      noise(0.4, 0.7);
      tone(120, 0.4, "sawtooth", 0.4, 0, 40);
      if (s.lives <= 0) return over();
      say(s.lives + (s.lives === 1 ? " life left" : " lives left"));
    }
    sync();
  }
  function sync() {
    $("sc").textContent = Math.floor(s.score);
    $("co").textContent = s.coins;
    $("li").textContent = practice ? "∞" : s.lives;
  }
  function over() {
    s.run = false;
    s.objs.forEach((o) => stopAudio(o.a));
    s.objs = [];
    const sc = Math.floor(s.score);
    if (sc > best) {
      best = sc;
      try {
        localStorage.setItem("echoBest", best);
      } catch (e) {}
      $("bs").textContent = best;
    }
    sync();
    draw();
    say(
      "Game over. Your score is " +
        sc +
        ". Press space or show a peace sign to play again.",
    );
    $("start").textContent = "Play again (Space)";
  }
  function start() {
    initAudio();
    Object.assign(s, {
      run: true,
      lane: 1,
      px: 1,
      jump: 0,
      duck: 0,
      lives: 3,
      score: 0,
      coins: 0,
      objs: [],
      t: 0,
      spawn: 1.2,
      speed: 1,
    });
    sync();
    say(
      practice
        ? "Practice mode. Nothing can hurt you. Press escape to stop."
        : "Go! You are in the middle lane. Move your hand left or right to change lane.",
    );
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function loop(ts) {
    if (!s.run) return;
    const dt = Math.min(0.05, (ts - last) / 1e3);
    last = ts;
    s.t += dt;
    s.speed = practice ? 0.8 : 1 + Math.min(1.2, s.t / 90);
    s.jump = Math.max(0, s.jump - dt);
    s.duck = Math.max(0, s.duck - dt);
    s.px += (s.lane - s.px) * Math.min(1, dt * 5);
    s.spawn -= dt;
    if (s.spawn <= 0) {
      spawn();
      s.spawn = practice
        ? 2 + Math.random() * 0.6
        : 1.5 - Math.min(0.6, s.t / 120) + Math.random() * 0.4;
    }
    s.score += dt * 5;
    for (const o of s.objs) {
      o.z -= (dt * s.speed) / 2.6;
      const c = Math.max(0, Math.min(1, 1 - o.z)),
        T = o.a.T;
      let pn = o.lane == null ? 0 : (o.lane - 1) * 0.95,
        at = 1,
        fq = 18e3,
        lm = 1;
      if (immersive && o.lane != null) {
        const sp = spatial(o.lane - s.px);
        pn = sp.pan;
        at = sp.at;
        fq = sp.fq;
        lm = sp.lfoMul;
      }
      o.a.lfo.frequency.setTargetAtTime(T.lfo * lm, ctx.currentTime, 0.06);
      o.a.pan.pan.setTargetAtTime(pn, ctx.currentTime, 0.06);
      o.a.filt.frequency.setTargetAtTime(fq, ctx.currentTime, 0.06);
      o.a.vol.gain.value = (0.03 + T.v * 0.5 * c * c) * at;
      o.a.osc.frequency.value =
        T.dir === -1
          ? T.f * (1 - 0.65 * c)
          : T.f * (1 + (T.dir ? 1.5 : 0.45) * c);
      if (
        !o.said &&
        o.z < 0.42 &&
        (o.type === "hurdle" || o.type === "overhead")
      ) {
        o.said = 1;
        say(o.type === "hurdle" ? "Jump!" : "Duck!");
      }
      if (o.z <= 0 && !o.done) {
        resolve(o);
        if (!s.run) return;
      }
    }
    s.objs = s.objs.filter((o) => {
      if (o.z < -0.05) {
        stopAudio(o.a);
        return false;
      }
      return true;
    });
    sync();
    draw();
    requestAnimationFrame(loop);
  }
  function move(act) {
    if (!s.run) return;
    if (act === "L" && s.lane > 0) {
      s.lane--;
      laneCue();
    } else if (act === "R" && s.lane < 2) {
      s.lane++;
      laneCue();
    } else if (act === "U" && diff === "hard" && !s.jump) {
      s.jump = 0.7;
      s.duck = 0;
      tone(300, 0.25, "sine", 0.35, 0, 900);
    } else if (act === "D" && diff === "hard" && !s.duck) {
      s.duck = 0.7;
      s.jump = 0;
      tone(700, 0.25, "sine", 0.35, 0, 200);
    } else if (act === "L" || act === "R") {
      tone(90, 0.12, "square", 0.25, act === "L" ? -1 : 1);
    }
  }
  function laneCue() {
    const n = s.lane + 1,
      p = (s.lane - 1) * 0.9,
      f = [440, 550, 660][s.lane];
    for (let i = 0; i < n; i++)
      setTimeout(() => s.run && tone(f, 0.07, "sine", 0.35, p), i * 90);
  }
  function togglePractice() {
    if (s.run) return;
    practice = !practice;
    $("pr").textContent = "Practice: " + (practice ? "on" : "off") + " (P)";
    $("pr").setAttribute("aria-pressed", practice);
    $("start").textContent = practice
      ? "Start practice (Space)"
      : "Start game (Space)";
    say(
      practice
        ? "Practice mode on. Obstacles come slower and nothing can hurt you. A soft low thud means you would have been hit."
        : "Practice mode off.",
    );
  }
  function stopPractice() {
    if (!s.run || !practice) return;
    s.run = false;
    s.objs.forEach((o) => stopAudio(o.a));
    s.objs = [];
    draw();
    say(
      "Practice ended. Press space to practise again, or P to switch to a real game.",
    );
  }
  function toggleImm() {
    if (s.run) return;
    immersive = !immersive;
    $("imm").textContent = "Immersive: " + (immersive ? "on" : "off") + " (I)";
    $("imm").setAttribute("aria-pressed", immersive);
    say(
      immersive
        ? "Immersive mode on. Sounds play in the ear of the side they are on. A duller, quieter, slower pulse means two lanes away."
        : "Immersive mode off. Sounds are fixed to left, middle and right.",
    );
  }
  function setDiff(d) {
    if (s.run) return;
    diff = d;
    $("dn").setAttribute("aria-pressed", d === "normal");
    $("dh").setAttribute("aria-pressed", d === "hard");
    say(
      d === "normal"
        ? "Normal mode: walls and coins."
        : "Hard mode: walls, coins, hurdles and low beams.",
    );
  }
  function demo(type) {
    initAudio();
    const T = TYPES[type];
    if (type === "block" || type === "coin") {
      say(
        T.name +
          " First in your own lane, centred. Then one lane over, in your right ear. Then two lanes over, still right, but duller, softer and slower.",
      );
      [0, 1, 2].forEach((d, i) =>
        setTimeout(
          () => {
            const a = makeAudio(type, 1),
              sp = immersive
                ? spatial(d)
                : { pan: (d - 0) * 0.95, at: 1, fq: 18e3, lfoMul: 1 },
              n = ctx.currentTime;
            a.pan.pan.value = sp.pan;
            a.filt.frequency.value = sp.fq;
            a.lfo.frequency.value = T.lfo * sp.lfoMul;
            a.vol.gain.value = (0.03 + T.v * 0.3) * sp.at;
            a.osc.frequency.setValueAtTime(T.f, n);
            a.osc.frequency.linearRampToValueAtTime(T.f * 1.45, n + 1.2);
            setTimeout(() => stopAudio(a), 1200);
          },
          3200 + i * 1500,
        ),
      );
      return;
    }
    const a = makeAudio(type, null),
      n = ctx.currentTime;
    a.vol.gain.value = 0.03 + T.v * 0.3;
    a.osc.frequency.setValueAtTime(T.f, n);
    a.osc.frequency.linearRampToValueAtTime(
      T.dir === -1 ? T.f * 0.35 : T.f * (T.dir ? 2.5 : 1.45),
      n + 1.6,
    );
    setTimeout(() => stopAudio(a), 1700);
    say(T.name);
  }
  function tutorial() {
    initAudio();
    say(
      "Echo Runner. Wear headphones. Sounds come toward you. A low buzzing rumble from the left, middle or right is a wall in that lane: switch lanes with the left and right arrow keys. Beeps that rise in pitch are a hurdle, and you will hear the word Jump: press up. A tone that falls in pitch is a low beam, and you will hear the word Duck: press down. A sparkling shimmer is a coin: move into its lane. Louder means closer. In Normal mode there are only walls and coins. Hard mode adds hurdles and low beams. When you change lane you hear one beep on the left, two in the middle, and three on the right. Press N or H to choose the mode, and I for immersive mode, where sounds are positioned relative to your lane, and P for practice mode, where nothing can hurt you. Press 1 to 4 to practise each sound. Press space to start.",
    );
  }
  function draw() {
    const W = cv.width,
      H = cv.height,
      lx = [W * 0.2, W * 0.5, W * 0.8];
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(255,210,63,.08)";
    g.fillRect(lx[s.lane] - W * 0.15, 0, W * 0.3, H);
    if (practice) {
      g.fillStyle = "#7dffb0";
      g.font = "bold 16px system-ui";
      g.textAlign = "left";
      g.fillText("PRACTICE: nothing can hurt you", 10, 22);
    }
    g.strokeStyle = "#2a3140";
    g.lineWidth = 2;
    for (const x of [W * 0.35, W * 0.65]) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    for (const o of s.objs) {
      const k = 1 - o.z,
        y = 20 + k * (H - 100),
        sz = 14 + k * 34,
        T = TYPES[o.type];
      g.fillStyle = T.col;
      if (o.type === "block") g.fillRect(lx[o.lane] - sz, y, sz * 2, sz);
      else if (o.type === "coin") {
        g.beginPath();
        g.arc(lx[o.lane], y, sz * 0.5, 0, 7);
        g.fill();
      } else if (o.type === "hurdle")
        g.fillRect(W * 0.1, y + sz * 0.95, W * 0.8, sz * 0.3);
      else {
        g.fillRect(W * 0.1, y + sz * 0.4, W * 0.8, sz * 0.3);
        g.fillRect(W * 0.1, y - sz * 0.5, 8, sz * 1.2);
        g.fillRect(W * 0.9 - 8, y - sz * 0.5, 8, sz * 1.2);
      }
    }
    const base = H - 60,
      jy = s.jump > 0 ? 70 : 0,
      ph = s.duck > 0 ? 16 : 48,
      x = lx[s.lane];
    g.fillStyle = "rgba(255,255,255,.25)";
    g.beginPath();
    g.ellipse(x, base + 52, s.jump > 0 ? 14 : 24, 6, 0, 0, 7);
    g.fill();
    g.fillStyle = s.jump > 0 ? "#7dffb0" : s.duck > 0 ? "#7dc8ff" : "#fff";
    g.fillRect(x - 16, base + 50 - ph - jy, 32, ph);
    g.fillStyle = "#ffd23f";
    g.font = "bold 18px system-ui";
    g.textAlign = "center";
    g.fillText(["LEFT LANE", "MIDDLE LANE", "RIGHT LANE"][s.lane], x, H - 8);
    let msg = s.jump > 0 ? "JUMP ↑" : s.duck > 0 ? "DUCK ↓" : "";
    for (const o of s.objs)
      if (o.z < 0.5 && (o.type === "hurdle" || o.type === "overhead"))
        msg = o.type === "hurdle" ? "JUMP ↑" : "DUCK ↓";
    if (msg) {
      g.fillStyle = "#fff";
      g.font = "bold 40px system-ui";
      g.textAlign = "center";
      g.fillText(msg, W / 2, 60);
    }
  }
  addEventListener("keydown", (e) => {
    if (!echoPage.classList.contains("active")) return;
    const k = e.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(k))
      e.preventDefault();
    if (e.target.tagName === "BUTTON" && (k === " " || k === "enter")) return;
    if (k === " " || k === "enter") {
      if (!s.run) start();
    } else if (k === "arrowleft" || k === "a") move("L");
    else if (k === "arrowright" || k === "d") move("R");
    else if (k === "arrowup" || k === "w") move("U");
    else if (k === "arrowdown" || k === "s") move("D");
    else if (k === "t") tutorial();
    else if (k === "v") toggleVoice();
    else if (k === "n") setDiff("normal");
    else if (k === "h") setDiff("hard");
    else if (k === "i") toggleImm();
    else if (k === "p") togglePractice();
    else if (k === "escape") stopPractice();
    else if (!s.run && "1234".includes(k) && k)
      demo(["block", "hurdle", "overhead", "coin"][+k - 1]);
  });
  function toggleVoice() {
    voice = !voice;
    if (!voice && window.speechSynthesis) speechSynthesis.cancel();
    $("vox").textContent = "Voice: " + (voice ? "on" : "off") + " (V)";
    $("vox").setAttribute("aria-pressed", voice);
  }
  $("start").onclick = () => {
    if (!s.run) start();
  };
  $("tst").onclick = () => {
    initAudio();
    tone(660, 0.25, "sine", 0.7, -1);
    setTimeout(() => tone(880, 0.25, "sine", 0.7, 1), 300);
    say("Sound test. You should hear two beeps, left then right.");
  };
  $("tut").onclick = tutorial;
  $("vox").onclick = toggleVoice;
  $("dn").onclick = () => setDiff("normal");
  $("dh").onclick = () => setDiff("hard");
  $("imm").onclick = toggleImm;
  $("pr").onclick = togglePractice;
  $("stp").onclick = stopPractice;
  let tx, ty;
  cv.addEventListener(
    "touchstart",
    (e) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    },
    { passive: true },
  );
  cv.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx,
      dy = e.changedTouches[0].clientY - ty;
    if (!s.run) {
      start();
      return;
    }
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? "L" : "R");
    else move(dy < 0 ? "U" : "D");
  });
  draw();
  window.echoRunning = () => s.run;
  document.addEventListener("pagechange", (ev) => {
    if (ev.detail === "echo") return;
    if (s.run) {
      s.run = false;
      s.objs.forEach((o) => stopAudio(o.a));
      s.objs = [];
      draw();
      $("start").textContent = practice
        ? "Start practice (Space)"
        : "Start game (Space)";
    }
    if (window.speechSynthesis)
      try {
        speechSynthesis.cancel();
      } catch (e) {}
  });
  const engine = window.GestureEngine;
  let prevGesture = null,
    laneAt = 0;
  if (engine) {
    engine.onLandmarks((L) => {
      if (!L || !s.run || !echoPage.classList.contains("active")) return;
      const x = 1 - L[9].x,
        target = x < 0.38 ? 0 : x > 0.62 ? 2 : 1,
        now = performance.now();
      if (target !== s.lane && now - laneAt > 260) {
        laneAt = now;
        move(target < s.lane ? "L" : "R");
      }
    });
    engine.onFrame((g) => {
      if (g === prevGesture) return;
      prevGesture = g;
      if (!echoPage.classList.contains("active")) return;
      if (g === "Victory" && !s.run) start();
      else if (g === "Open_Palm") move("U");
      else if (g === "Closed_Fist") move("D");
    });
  }
})();
