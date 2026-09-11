/* ============================================================
   BURGER 'N SHAKE — FINAL
   Eén gebundelde init voor de mix-pagina. Combineert de stukken
   uit main.js (hero-sequence, reveals, marquees, kaart) met de
   hmarquee- en stripe-animaties uit concept-2.js, zonder dubbele
   globals of dubbele kaart-initialisatie.
   ============================================================ */

console.log("%cBurger 'n Shake — final.js v8 geladen", "color:#0055B8;font-weight:bold");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- mobiel menu (pill-nav) ---------- */
(function topbar() {
  const bar = document.getElementById("topbar");
  if (!bar) return;
  const toggle = bar.querySelector(".topbar__toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const open = bar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  bar.querySelectorAll(".pillnav a").forEach((a) =>
    a.addEventListener("click", () => bar.classList.remove("is-open"))
  );
})();

/* ---------- Lenis smooth scroll ---------- */
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  if (window.gsap && window.ScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

/* ---------- vestigingen kaart (Leaflet) ---------- */
(function locatorMap() {
  const mapEl = document.getElementById("loc-map");
  if (!mapEl || !window.L) return;

  const items = Array.from(document.querySelectorAll(".loc-item"));
  const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }).addTo(map);

  const markers = [];
  items.forEach((btn) => {
    const { name, street, zip, phone, lat, lng } = btn.dataset;
    const icon = L.divIcon({
      className: "loc-pin",
      html: "<span></span>",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -16],
    });
    const marker = L.marker([+lat, +lng], { icon, title: name }).addTo(map);

    const tel = phone.replace(/[^\d+]/g, "");
    const route = encodeURIComponent(name + " " + street + " " + zip);
    marker.bindPopup(
      '<div class="loc-pop">' +
        "<h3>" + name + "</h3>" +
        '<p class="loc-pop__addr">' + street + "<br>" + zip + "</p>" +
        '<a class="loc-pop__tel" href="tel:' + tel + '">' + phone + "</a>" +
        '<div class="loc-pop__actions">' +
          '<a class="loc-pop__btn" href="#bestel">Bezorgen</a>' +
          '<a class="loc-pop__btn loc-pop__btn--alt" href="#bestel">Afhalen</a>' +
        "</div>" +
        '<a class="loc-pop__route" target="_blank" rel="noopener" ' +
          'href="https://www.google.com/maps/search/?api=1&query=' + route + '">Plan je route</a>' +
      "</div>",
      { minWidth: 232 }
    );

    const activate = () => {
      items.forEach((i) => i.classList.remove("is-active"));
      btn.classList.add("is-active");
    };
    btn.addEventListener("click", () => {
      activate();
      map.flyTo([+lat, +lng], 13, { duration: 0.7 });
      marker.openPopup();
    });
    marker.on("click", activate);
    markers.push(marker);
  });

  const group = L.featureGroup(markers);
  map.fitBounds(group.getBounds().pad(0.25));
  setTimeout(() => map.invalidateSize(), 250);
})();

/* ---------- vestiging zoekfilter ---------- */
(function locationSearch() {
  const input = document.getElementById("loc-search");
  if (!input) return;
  const items = Array.from(document.querySelectorAll(".loc-item"));
  const countEl = document.querySelector(".locaties__count");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let n = 0;
    items.forEach((btn) => {
      const hay = ((btn.dataset.name || "") + " " + (btn.dataset.street || "") + " " + (btn.dataset.zip || "")).toLowerCase();
      const match = hay.includes(q);
      btn.closest("li").classList.toggle("loc-item--hidden", !match);
      if (match) n++;
    });
    if (countEl) countEl.textContent = n + (n === 1 ? " vestiging" : " vestigingen");
  });
})();

/* ---------- GSAP: reveals, koppen, drift + horizontale marquees ---------- */
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  if (reduceMotion) {
    gsap.set("[data-reveal]", { clearProps: "all" });
  } else {
    /* hero headline: letters op load */
    const heroTitle = document.querySelector(".hero__title");
    if (heroTitle) {
      const split = new SplitText(heroTitle, { type: "chars,words" });
      gsap.set(".hero__title", { autoAlpha: 1 });
      gsap.from(split.chars, {
        y: 60, opacity: 0, duration: 0.7, ease: "back.out(1.7)", stagger: 0.03, delay: 0.15,
      });
    }
    gsap.from(".hero__sub, .hero__actions", {
      y: 24, opacity: 0, duration: 0.8, ease: "power2.out", stagger: 0.1, delay: 0.5,
    });

    /* sectiekoppen: letters op scroll */
    gsap.utils.toArray(".section-title").forEach((title) => {
      const split = new SplitText(title, { type: "chars,words" });
      gsap.from(split.chars, {
        y: 50, opacity: 0, duration: 0.6, ease: "back.out(1.7)", stagger: 0.025,
        scrollTrigger: { trigger: title, start: "top 85%" },
      });
    });

    /* generieke reveals */
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 36, opacity: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* parallax (pixel-based) */
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 0.1;
      const shift = amt * window.innerHeight * 0.5;
      gsap.fromTo(el, { y: shift }, {
        y: -shift, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    /* kaarten driften mee met scroll via --py */
    gsap.utils.toArray("[data-drift]").forEach((el) => {
      const amt = parseFloat(el.dataset.drift) || 0.06;
      const shift = amt * window.innerHeight * 0.4;
      gsap.from(el, {
        autoAlpha: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
      gsap.fromTo(el, { "--py": shift + "px" }, {
        "--py": -shift + "px", ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* horizontale marquees (ugc-kaarten + gele hashtags) */
  gsap.utils.toArray(".marquee").forEach((wrap, i) => {
    const track = wrap.querySelector(".marquee__track");
    if (!track) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setWidth = track.scrollWidth + gap;
    const original = track.innerHTML;
    const copies = Math.ceil(wrap.offsetWidth / setWidth) + 1;
    let html = original;
    for (let c = 1; c < copies; c++) html += original;
    track.innerHTML = html;
    const leftToRight = i % 2 === 1;
    gsap.fromTo(track, { x: leftToRight ? -setWidth : 0 }, {
      x: leftToRight ? 0 : -setWidth, duration: setWidth / 70, ease: "none", repeat: -1,
    });
  });

  ScrollTrigger.refresh();
}

/* ---------- over ons: fotokaarten waaieren open van stapel naar rij (scroll-gestuurd) ----------
   De kaarten staan als FLEXBOX-rij in de CSS (dus altijd gelijkmatig verdeeld). We animeren enkel
   x (px) van "op elkaar gestapeld in het midden" naar 0 = hun natuurlijke, symmetrische rijpositie.
   x:0 als eindstand betekent: de rust-stand is ALTIJD een nette gelijke rij. */
if (window.gsap && window.ScrollTrigger) {
  const stack = document.querySelector(".cardstack");
  const l = stack && stack.querySelector(".cardstack__item--l");
  const c = stack && stack.querySelector(".cardstack__item--c");
  const r = stack && stack.querySelector(".cardstack__item--r");
  if (l && c && r) {
    const tilt = 8;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: stack, start: "top 75%", end: "top 35%", scrub: true, invalidateOnRefresh: true },
    });
    /* function-based from-waardes: opnieuw berekend bij resize (invalidateOnRefresh) */
    tl.fromTo(l, { x: () => c.offsetLeft - l.offsetLeft, rotation: 0, y: 12 }, { x: 0, rotation: -tilt, y: 0 }, 0);
    tl.fromTo(r, { x: () => c.offsetLeft - r.offsetLeft, rotation: 0, y: 12 }, { x: 0, rotation: tilt, y: 0 }, 0);
  }
}

/* ---------- kernwaarden-kaarten: links-naar-rechts fade + slide up (scroll-gestuurd) ---------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.utils.toArray(".waarom--blue .waarom__grid").forEach((grid) => {
    const cards = grid.querySelectorAll(".reason");
    gsap.from(cards, {
      autoAlpha: 0,
      y: 44,
      ease: "none",
      stagger: 0.2,
      scrollTrigger: { trigger: grid, start: "top 85%", end: "top 45%", scrub: true },
    });
  });
}

/* ---------- halal-band: rijen scroll-gestuurd tegengesteld ---------- */
if (window.gsap && window.ScrollTrigger && !reduceMotion) {
  gsap.utils.toArray(".hmarquee-row").forEach((row, i) => {
    const track = row.querySelector(".hmarquee-track");
    if (!track) return;
    const original = track.innerHTML;
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 4 && guard < 20) {
      track.innerHTML += original;
      guard++;
    }
    const overflow = track.scrollWidth - row.offsetWidth;
    const base = -overflow / 2;
    const shift = Math.min(window.innerWidth * 0.22, overflow / 2 - 40);
    const dir = i === 0 ? 1 : -1;
    gsap.fromTo(track, { x: base + dir * shift }, {
      x: base - dir * shift, ease: "none",
      scrollTrigger: { trigger: ".hmarquee", start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

/* ---------- doorlopende stripe-marquees (diagonale tapes) ---------- */
if (window.gsap && !reduceMotion) {
  gsap.utils.toArray(".stripe").forEach((wrap, i) => {
    const track = wrap.querySelector(".stripe__track");
    if (!track) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setWidth = track.scrollWidth + gap;
    const original = track.innerHTML;
    const copies = Math.ceil(wrap.offsetWidth / setWidth) + 2;
    let html = original;
    for (let c = 1; c < copies; c++) html += original;
    track.innerHTML = html;
    const dir = i % 2 === 0 ? -1 : 1;
    gsap.fromTo(track, { x: dir < 0 ? 0 : -setWidth }, {
      x: dir < 0 ? -setWidth : 0, duration: setWidth / 60, ease: "none", repeat: -1,
    });
  });
}

/* ---------- hero image sequence (scroll-scrubbed, pinned) ---------- */
(function heroSequence() {
  const canvas = document.getElementById("hero-seq");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const TOTAL = 97;
  const pad = (n) => String(n).padStart(4, "0");
  const images = new Array(TOTAL);
  let last = -1;

  const draw = (i) => {
    i = Math.max(0, Math.min(TOTAL - 1, i));
    const img = images[i];
    if (!img || !img.complete || !img.naturalWidth) return;
    if (i === last) return;
    last = i;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  for (let i = 0; i < TOTAL; i++) {
    const img = new Image();
    img.src = "assets/hero-seq/frame-" + pad(i + 1) + ".webp";
    if (i === 0) img.onload = () => draw(0);
    images[i] = img;
  }

  const isWide = window.matchMedia("(min-width: 721px)").matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger || !isWide) {
    const showLast = () => draw(TOTAL - 1);
    if (images[TOTAL - 1].complete) showLast();
    else images[TOTAL - 1].onload = showLast;
    return;
  }

  const state = { f: 0 };
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "+=100%",
      scrub: 0.35,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  tl.to(state, { f: TOTAL - 1, duration: 1, ease: "none", onUpdate: () => draw(Math.round(state.f)) }, 0);
  tl.fromTo(
    ".hero__figure",
    { x: -200, y: -250, scale: 1, rotate: -8, yPercent: -50 },
    { x: 0, y: -140, scale: 1.5, rotate: 0, yPercent: -50, duration: 1, ease: "none" },
    0
  );
})();

/* ---------- voordelen-kaarten: actieve kaart scherp, rest blurry (volgt de scroll) ---------- */
(function benefitFocus() {
  const cards = Array.from(document.querySelectorAll(".benefitcard"));
  if (!cards.length) return;
  let ticking = false;
  const pick = () => {
    ticking = false;
    /* op mobiel/tablet geen blur: kaarten moeten leesbaar blijven */
    if (window.innerWidth <= 860) {
      cards.forEach((card) => { card.style.filter = "none"; card.classList.remove("is-active"); });
      return;
    }
    const mid = window.innerHeight / 2;
    let activeIndex = 0, bestDist = Infinity;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (dist < bestDist) { bestDist = dist; activeIndex = i; }
    });
    cards.forEach((card, i) => {
      const steps = Math.abs(i - activeIndex);
      const blur = Math.min(steps * 3, 9); // 0 -> 3 -> 6 -> 9px, geleidelijk
      card.style.filter = blur ? "blur(" + blur + "px)" : "none";
      card.classList.toggle("is-active", i === activeIndex);
    });
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(pick);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  pick();
})();

/* ---------- stappenplan slider (horizontaal, loopt van rechts uit beeld) ---------- */
(function stepSlider() {
  const track = document.querySelector("[data-stepslider]");
  if (!track) return;
  const section = track.closest(".stepslider");
  const prev = section && section.querySelector('[data-dir="prev"]');
  const next = section && section.querySelector('[data-dir="next"]');

  const stepSize = () => {
    const card = track.querySelector(".stepcard");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
    return card ? card.offsetWidth + gap : 320;
  };
  const update = () => {
    if (!prev || !next) return;
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };
  if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -stepSize(), behavior: "smooth" }));
  if (next) next.addEventListener("click", () => track.scrollBy({ left: stepSize(), behavior: "smooth" }));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  /* sleep-to-scroll met de muis */
  let down = false, startX = 0, startLeft = 0, moved = 0;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch scrollt native
    down = true; startX = e.clientX; startLeft = track.scrollLeft; moved = 0;
    track.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    moved = e.clientX - startX;
    track.scrollLeft = startLeft - moved;
  });
  window.addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    track.classList.remove("is-dragging");
  });
  /* voorkom dat een sleep een klik op een link/knop in de kaart triggert */
  track.addEventListener("click", (e) => {
    if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); }
  }, true);
})();

/* ---------- formulieren (contact / franchise match / brochure) ---------- */
(function forms() {
  const forms = Array.from(document.querySelectorAll("form[data-form]"));
  if (!forms.length) return;
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const ok = form.querySelector(".form__ok");
      form.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = true));
      if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
    });
  });
})();

/* ---------- ScrollTrigger herberekenen na laden fonts/beeld/video ---------- */
if (window.gsap && window.ScrollTrigger) {
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  // late-ladende media (foto's/video's) verschuiven de layout: herbereken posities
  document.querySelectorAll("img, video").forEach((m) => {
    if (m.tagName === "VIDEO") m.addEventListener("loadeddata", refresh, { once: true });
    else if (!m.complete) m.addEventListener("load", refresh, { once: true });
  });
  setTimeout(refresh, 1200);
}
