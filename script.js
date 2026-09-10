(() => {
  "use strict";

  /* =========================================================
     Ambient falling petals (canvas)
  ========================================================= */
  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width, height, petals, dpr;

  const PETAL_COLORS = ["#ff9fc0", "#ffc4d9", "#c9808f", "#ffe8ea"];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePetal(randomY) {
    const size = 6 + Math.random() * 8;
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -20 - Math.random() * height * 0.3,
      size,
      speedY: 0.4 + Math.random() * 0.7,
      driftAmp: 20 + Math.random() * 30,
      driftFreq: 0.004 + Math.random() * 0.006,
      driftPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      opacity: 0.5 + Math.random() * 0.4,
    };
  }

  function initPetals() {
    const count = window.innerWidth < 600 ? 14 : 24;
    petals = Array.from({ length: count }, () => makePetal(true));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    // simple petal / leaf shape via two curves
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.4, p.size * 0.8, p.size * 0.4, 0, p.size);
    ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.4, -p.size * 0.8, -p.size * 0.4, 0, -p.size);
    ctx.fill();
    ctx.restore();
  }

  let t = 0;
  function tick() {
    ctx.clearRect(0, 0, width, height);
    t += 1;
    for (const p of petals) {
      p.y += p.speedY;
      p.x += Math.sin(t * p.driftFreq + p.driftPhase) * 0.6;
      p.rotation += p.rotSpeed;
      if (p.y > height + 20) {
        Object.assign(p, makePetal(false));
      }
      drawPetal(p);
    }
    requestAnimationFrame(tick);
  }

  resize();
  initPetals();
  window.addEventListener("resize", () => {
    resize();
    initPetals();
  });

  if (!reduceMotion) {
    requestAnimationFrame(tick);
  } else {
    // draw a single static frame so the page doesn't feel empty
    ctx.clearRect(0, 0, width, height);
    petals.forEach(drawPetal);
  }

  /* =========================================================
     Petal burst (used on wish button click)
  ========================================================= */
  function burst(x, y) {
    const burstPetals = Array.from({ length: 18 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3.5;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 4 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        life: 0,
        maxLife: 60 + Math.random() * 30,
      };
    });

    function burstTick() {
      ctx.save();
      for (let i = burstPetals.length - 1; i >= 0; i--) {
        const p = burstPetals[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        const fade = 1 - p.life / p.maxLife;
        if (fade <= 0) {
          burstPetals.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(fade, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.4, p.size * 0.8, p.size * 0.4, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.4, -p.size * 0.8, -p.size * 0.4, 0, -p.size);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      if (burstPetals.length > 0) requestAnimationFrame(burstTick);
    }
    if (!reduceMotion) requestAnimationFrame(burstTick);
  }

  /* =========================================================
     Envelope open interaction
  ========================================================= */
  const envelope = document.getElementById("envelope");
  const hero = document.getElementById("hero");
  const tapHint = document.getElementById("tapHint");
  const letterReveal = document.getElementById("letterReveal");

  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    envelope.classList.add("is-open");
    tapHint.style.opacity = "0";

    setTimeout(() => {
      hero.classList.add("is-opened");
      letterReveal.classList.add("is-visible");
      letterReveal.setAttribute("aria-hidden", "false");
      setTimeout(() => {
        letterReveal.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }, 150);
    }, 900);
  }

  envelope.addEventListener("click", openEnvelope);
  envelope.addEventListener("keydown", (e) => {
    // support multiple representations of the "space" key across browsers
    const isActivateKey = e.key === "Enter" || e.key === " " || e.key === "Spacebar" || e.code === "Space";
    if (isActivateKey) {
      e.preventDefault();
      openEnvelope();
    }
  });
  envelope.setAttribute("tabindex", "0");
  envelope.setAttribute("role", "button");
  envelope.setAttribute("aria-label", "Open the envelope to reveal your letter");

  /* =========================================================
     Wish button
  ========================================================= */
  const wishes = [
    "may every nerve turn into focus",
    "may the room feel a little kinder today",
    "may your hard work finally get to show off",
    "may you surprise yourself",
    "may today go easier than you think",
    "sending every bit of luck I have",
  ];

  const wishButton = document.getElementById("wishButton");
  const wishOutput = document.getElementById("wishOutput");
  let wishIndex = -1;

  wishButton.addEventListener("click", (e) => {
    const rect = wishButton.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2);

    wishIndex = (wishIndex + 1) % wishes.length;
    wishOutput.classList.remove("is-shown");

    window.setTimeout(() => {
      wishOutput.textContent = "\u201C" + wishes[wishIndex] + "\u201D";
      wishOutput.classList.add("is-shown");
    }, 180);
  });

  /* =========================================================
     Editable name fields: keep them tidy on blur
  ========================================================= */
  document.querySelectorAll("[contenteditable]").forEach((el) => {
    el.addEventListener("blur", () => {
      const text = el.textContent.trim();
      el.textContent = text.length ? text : el.dataset.placeholder || "You";
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        el.blur();
      }
    });
  });
})();
