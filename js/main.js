/* =========================================================
   ATELIER KAÏ · Aperçu
   1. Jour → nuit : on mélange deux palettes selon le scroll
   2. Scène de la marée (soleil, lune, étoiles, raie manta)
   3. Apparitions au scroll, curseur, formulaire
   ========================================================= */

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Les deux palettes ---------- */
const DAY = {
  "--bg": "#F2EDE5", "--bg-alt": "#E8E1D4", "--deep": "#263A2E", "--deep-ink": "#F2EDE5",
  "--ink": "#263A2E", "--ink-soft": "#5F6B60", "--line": "#D5CCBB", "--accent": "#C9A066",
  "--card-1": "#DFE3D4", "--card-2": "#EDE2CB", "--card-3": "#E8E1D4",
  "--sky-top": "#F4E9D8", "--sky-bottom": "#EFDCC0", "--sea-top": "#8EA38A", "--sea-bottom": "#2F4A39",
  "--hill": "#8C907E", "--sun": "#C9A066", "--palm": "#263A2E",
};
const NIGHT = {
  "--bg": "#0E1B21", "--bg-alt": "#13262E", "--deep": "#081217", "--deep-ink": "#EFE8DA",
  "--ink": "#EFE8DA", "--ink-soft": "#A7B5B0", "--line": "#2A434C", "--accent": "#5FD3C6",
  "--card-1": "#17303A", "--card-2": "#1B3640", "--card-3": "#142A33",
  "--sky-top": "#050D14", "--sky-bottom": "#12303B", "--sea-top": "#1D5560", "--sea-bottom": "#08161C",
  "--hill": "#0F2229", "--sun": "#E9DDB8", "--palm": "#050D11",
};

// Le coucher de soleil : une étape au milieu pour le paysage,
// sinon le mélange direct jour → nuit donne un gris terne
const DUSK = {
  "--sky-top": "#C97B6B", "--sky-bottom": "#F0B98A", "--sea-top": "#5E7F86", "--sea-bottom": "#1E3540",
  "--hill": "#5D5560", "--sun": "#E8875A", "--palm": "#1E2A2A",
};

// "#RRGGBB" → [r, g, b]
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Mélange deux couleurs : t = 0 → a, t = 1 → b
const mix = (a, b, t) => {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)}, ${m(g1, g2)}, ${m(b1, b2)})`;
};

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/* ---------- 2. Scène de la marée ---------- */
const tide = document.querySelector(".tide");
const sun = document.querySelector(".tide__sun");
const moon = document.querySelector(".tide__moon");
const moonGlow = document.querySelector(".tide__moon-glow");
const starsGroup = document.querySelector(".stars");
const manta = document.querySelector(".manta");
const lineDay = document.querySelector(".tide__line--day");
const lineNight = document.querySelector(".tide__line--night");
const badgeLabel = document.querySelector(".mode-badge__label");

// On sème des étoiles dans le haut du ciel
const SVG_NS = "http://www.w3.org/2000/svg";
for (let i = 0; i < 80; i++) {
  const star = document.createElementNS(SVG_NS, "circle");
  star.setAttribute("cx", Math.random() * 1440);
  star.setAttribute("cy", Math.random() * 420);
  star.setAttribute("r", Math.random() * 1.6 + 0.4);
  star.style.opacity = Math.random() * 0.7 + 0.3;
  starsGroup.appendChild(star);
}

let lastT = -1;

function update() {
  // Progression dans la section marée : 0 avant, 1 après
  const rect = tide.getBoundingClientRect();
  const t = clamp(-rect.top / (rect.height - window.innerHeight));

  if (t !== lastT) {
    // Couleurs du site
    for (const key in DAY) {
      let color;
      if (DUSK[key]) {
        // Paysage : jour → coucher de soleil → nuit
        color = t < 0.5 ? mix(DAY[key], DUSK[key], t * 2) : mix(DUSK[key], NIGHT[key], (t - 0.5) * 2);
      } else {
        color = mix(DAY[key], NIGHT[key], t);
      }
      root.style.setProperty(key, color);
    }
    root.style.setProperty("--glow", t.toFixed(3));

    // Le soleil se couche derrière la colline, la lune se lève
    sun.setAttribute("cy", 300 + t * 420);
    const moonY = 900 - clamp((t - 0.35) / 0.65) * 700;
    moon.setAttribute("cy", moonY);
    moonGlow.setAttribute("cy", moonY);
    starsGroup.style.opacity = clamp((t - 0.4) / 0.5);

    // La raie manta traverse la mer la nuit
    const swim = clamp((t - 0.45) / 0.55);
    manta.style.opacity = swim > 0 && swim < 1 ? 0.85 : 0;
    // Elle suit une courbe douce et s'incline dans le sens de la nage
    const tilt = -Math.cos(swim * Math.PI) * 8;
    manta.setAttribute("transform", `translate(${-160 + swim * 1760} ${650 - Math.sin(swim * Math.PI) * 50}) rotate(${tilt}) scale(.8)`);

    // Les deux phrases
    const night = t > 0.5;
    lineDay.style.opacity = night ? 0 : 1 - t * 1.6;
    lineDay.style.transform = `translateY(${-t * 40}px)`;
    lineNight.style.opacity = night ? clamp((t - 0.5) * 2.5) : 0;
    lineNight.style.transform = `translateY(${night ? 0 : 20}px)`;

    badgeLabel.textContent = night ? "Nuit" : "Jour";
    lastT = t;
  }
}

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { update(); ticking = false; });
};
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
update();

/* ---------- 3a. Apparitions au scroll ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el, i) => {
  // Petit décalage pour les éléments d'une même rangée
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  observer.observe(el);
});

window.addEventListener("load", () => document.body.classList.add("is-loaded"));
setTimeout(() => document.body.classList.add("is-loaded"), 300);

/* ---------- 3b. Curseur personnalisé ---------- */
const cursor = document.querySelector(".cursor");
if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  let x = 0, y = 0, cx = 0, cy = 0;
  window.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    cursor.classList.add("is-active");
  });
  // Le cercle suit la souris avec un léger retard (effet "glisse")
  const follow = () => {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(follow);
  };
  follow();
  document.querySelectorAll("a, button, summary, .chips label, .swatches span").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

/* ---------- 3c. Formulaire (aperçu, n'envoie rien) ---------- */
const form = document.querySelector(".form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  form.querySelector(".form__note").hidden = false;
});
