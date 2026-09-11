/* ============================================================
   BURGER 'N SHAKE — interactions & motion
   GSAP + ScrollTrigger + SplitText + Lenis
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- mobile nav ---------- */
(function nav() {
  const bar = document.getElementById("nav");
  const toggle = bar.querySelector(".nav__toggle");
  toggle.addEventListener("click", () => {
    const open = bar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  bar.querySelectorAll(".nav__links a").forEach((a) =>
    a.addEventListener("click", () => bar.classList.remove("is-open"))
  );
})();

/* ---------- Lenis smooth scroll (optional) ---------- */
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  if (window.gsap && window.ScrollTrigger) {
    // drive Lenis from GSAP's ticker so pin + scrub stay perfectly in sync
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

/* ---------- vestigingen map (Leaflet) ---------- */
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

/* ---------- vestiging search filter ---------- */
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

/* ---------- GSAP setup ---------- */
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  if (reduceMotion) {
    gsap.set("[data-reveal]", { clearProps: "all" });
  } else {
    /* hero headline: staggered letters on load */
    const heroTitle = document.querySelector(".hero__title");
    if (heroTitle) {
      const split = new SplitText(heroTitle, { type: "chars,words" });
      gsap.set(".hero__title", { autoAlpha: 1 });
      gsap.from(split.chars, {
        y: 60,
        opacity: 0,
        duration: 0.7,
        ease: "back.out(1.7)",
        stagger: 0.03,
        delay: 0.15,
      });
    }

    /* hero supporting elements (figure is driven by the scroll sequence below) */
    gsap.from(".hero__sub, .hero__actions", {
      y: 24, opacity: 0, duration: 0.8, ease: "power2.out", stagger: 0.1, delay: 0.5,
    });

    /* section titles — staggered letters on scroll */
    gsap.utils.toArray(".section-title").forEach((title) => {
      const split = new SplitText(title, { type: "chars,words" });
      gsap.from(split.chars, {
        y: 50,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        stagger: 0.025,
        scrollTrigger: { trigger: title, start: "top 85%" },
      });
    });

    /* generic reveals — fade + lichte y */
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 36,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* franchise stats count up when they scroll into view */
    gsap.utils.toArray(".franchise__stats strong").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const obj = { v: 0 };
      el.textContent = "0" + suffix;
      gsap.to(obj, {
        v: end,
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
      });
    });

    /* scroll-driven parallax (pixel-based so it never fights centering transforms) */
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 0.1;
      const shift = amt * window.innerHeight * 0.5;
      gsap.fromTo(
        el,
        { y: shift },
        {
          y: -shift,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });

    /* cards drift continuously with scroll via --py (composes with hover + fade) */
    gsap.utils.toArray("[data-drift]").forEach((el) => {
      const amt = parseFloat(el.dataset.drift) || 0.06;
      const shift = amt * window.innerHeight * 0.4;
      gsap.from(el, {
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
      gsap.fromTo(
        el,
        { "--py": shift + "px" },
        {
          "--py": -shift + "px",
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });
  }

  /* ---------- marquees (alternating direction, seamless) ---------- */
  gsap.utils.toArray(".marquee").forEach((wrap, i) => {
    const track = wrap.querySelector(".marquee__track");
    if (!track) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    // period = one set + the gap that separates it from the next copy
    const setWidth = track.scrollWidth + gap;
    const original = track.innerHTML;
    // duplicate enough times that the viewport stays filled at max translation
    const copies = Math.ceil(wrap.offsetWidth / setWidth) + 1;
    let html = original;
    for (let c = 1; c < copies; c++) html += original;
    track.innerHTML = html;
    const leftToRight = i % 2 === 1;
    gsap.fromTo(
      track,
      { x: leftToRight ? -setWidth : 0 },
      {
        x: leftToRight ? 0 : -setWidth,
        duration: setWidth / 70,
        ease: "none",
        repeat: -1,
      }
    );
  });

  ScrollTrigger.refresh();
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

  // reduced motion, no GSAP, or small screens: just settle on the finished burger
  const isWide = window.matchMedia("(min-width: 721px)").matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger || !isWide) {
    const showLast = () => draw(TOTAL - 1);
    if (images[TOTAL - 1].complete) showLast();
    else images[TOTAL - 1].onload = showLast;
    return;
  }

  // pin the hero and scrub the build-up quickly; page continues once it finishes.
  // the burger starts slightly tilted + smaller and grows big + straight (may bleed off-screen).
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
  // travels from upper-centre (tilted) to right-centre (big + straight); only grows, never shrinks
  tl.fromTo(
    ".hero__figure",
    { x: -200, y: -250, scale: 1, rotate: -8, yPercent: -50 },
    { x: 0, y: -140, scale: 1.5, rotate: 0, yPercent: -50, duration: 1, ease: "none" },
    0
  );

  // re-measure pin positions once everything (videos/fonts) has loaded
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
