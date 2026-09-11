/* ============================================================
   BURGER 'N SHAKE — CONCEPT 2
   Diagonale smash-marquees + mobiel menu
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ---------- mobiel menu ---------- */
(function topbar() {
  const bar = document.getElementById("topbar");
  if (!bar) return;
  const toggle = bar.querySelector(".topbar__toggle");
  toggle.addEventListener("click", () => {
    const open = bar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  bar.querySelectorAll(".pillnav a").forEach((a) =>
    a.addEventListener("click", () => bar.classList.remove("is-open"))
  );
})();

/* ---------- burger: zwevend + simpele scroll-parallax ---------- */
(function heroBurger() {
  const burger = document.querySelector(".hero2__burger");
  if (!burger || !window.gsap || reduceMotion) return;

  // idle float: zachte op-en-neer + subtiele kanteling (compose via y + rotation)
  gsap.to(burger, { y: -22, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });
  gsap.to(burger, { rotation: 2.6, duration: 4, ease: "sine.inOut", repeat: -1, yoyo: true });

  // parallax: bij scrollen naar beneden drijft de burger omhoog en wordt iets groter
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(
      burger,
      { yPercent: 0, scale: 1 },
      {
        yPercent: -34,
        scale: 1.16,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero2",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }
})();

/* ---------- story: foto's reveal + parallax omhoog, kop wisselt subtiel van hoek ---------- */
(function storyFrames() {
  if (!window.gsap || reduceMotion || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray(".story__frame").forEach((el, i) => {
    gsap.fromTo(
      el,
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
      }
    );
    // parallax: foto's drijven omhoog tijdens scrollen, wisselende diepte
    const amt = 20 + (i % 2) * 12;
    gsap.fromTo(
      el,
      { yPercent: amt },
      {
        yPercent: -amt,
        ease: "none",
        scrollTrigger: { trigger: ".story", start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  // 'het verhaal / achter de grill' wisselt heel subtiel van hoek tijdens scrollen
  const title = document.querySelector(".story__title");
  if (title) {
    gsap.fromTo(
      title,
      { rotation: 2 },
      {
        rotation: -2,
        ease: "none",
        scrollTrigger: { trigger: ".story", start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  }
})();

/* ---------- hero dambord: schuift naar links tijdens scrollen ---------- */
(function heroChecker() {
  const el = document.querySelector(".checker--hero");
  if (!el || !window.gsap || reduceMotion || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.fromTo(
    el,
    { backgroundPosition: "0px 0px" },
    {
      backgroundPosition: "-480px 0px",
      ease: "none",
      scrollTrigger: { trigger: ".hero2", start: "top top", end: "bottom top", scrub: true },
    }
  );
})();

/* ---------- ons menu: carousel met grotere middenkaart ---------- */
(function menuCarousel() {
  const track = document.getElementById("menu2-track");
  if (!track) return;
  const viewport = track.parentElement;
  const cards = Array.from(track.children);
  const prev = document.querySelector(".menu2__arrow--prev");
  const next = document.querySelector(".menu2__arrow--next");
  let active = Math.floor(cards.length / 2);

  const update = () => {
    cards.forEach((c, i) => c.classList.toggle("is-center", i === active));
    const card = cards[active];
    const center = card.offsetLeft + card.offsetWidth / 2;
    track.style.transform = "translateX(" + (viewport.clientWidth / 2 - center) + "px)";
  };
  const go = (dir) => {
    active = Math.max(0, Math.min(cards.length - 1, active + dir));
    update();
  };

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  cards.forEach((c, i) => c.addEventListener("click", () => { active = i; update(); }));
  window.addEventListener("resize", update);
  window.addEventListener("load", update);
  cards.forEach((c) => {
    const img = c.querySelector("img");
    if (img && !img.complete) img.addEventListener("load", update);
  });
  update();
})();

/* ---------- halal / vers van de grill: scroll-gestuurd, rijen tegengesteld ----------
   Bij scrollen naar beneden gaat de bovenste rij naar links, de onderste naar rechts. */
if (window.gsap && window.ScrollTrigger && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray(".hmarquee-row").forEach((row, i) => {
    const track = row.querySelector(".hmarquee-track");
    if (!track) return;
    const original = track.innerHTML;
    // dupliceer tot ruim breder dan de viewport zodat er nooit gaten ontstaan
    let guard = 0;
    while (track.scrollWidth < window.innerWidth * 4 && guard < 20) {
      track.innerHTML += original;
      guard++;
    }
    const overflow = track.scrollWidth - row.offsetWidth;
    const base = -overflow / 2; // gecentreerd, ruime overflow aan beide kanten
    // kleine verschuiving t.o.v. de overflow, zodat de randen nooit in beeld komen
    const shift = Math.min(window.innerWidth * 0.22, overflow / 2 - 40);
    const dir = i === 0 ? 1 : -1; // bovenste rij naar links, onderste naar rechts
    gsap.fromTo(
      track,
      { x: base + dir * shift },
      {
        x: base - dir * shift,
        ease: "none",
        scrollTrigger: { trigger: ".hmarquee", start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

/* ---------- diagonale marquees (naadloos, om en om) ---------- */
if (window.gsap && !reduceMotion) {
  gsap.utils.toArray(".smash-row").forEach((row, i) => {
    const track = row.querySelector(".smash-track");
    if (!track) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setWidth = track.scrollWidth / 2; // twee sets in de markup
    const original = track.innerHTML;

    // vul de rij ruim voorbij de bandbreedte zodat er nooit een gat valt
    const copies = Math.ceil((row.offsetWidth + setWidth) / setWidth) + 1;
    let html = original;
    for (let c = 1; c < copies; c++) html += original;
    track.innerHTML = html;

    const leftToRight = i % 2 === 1; // middelste (stroke) rij tegen de klok in
    gsap.fromTo(
      track,
      { x: leftToRight ? -setWidth : 0 },
      {
        x: leftToRight ? 0 : -setWidth,
        duration: setWidth / 90,
        ease: "none",
        repeat: -1,
      }
    );
  });
}

/* ---------- tiktok gallery marquee ---------- */
if (window.gsap && !reduceMotion) {
  gsap.utils.toArray(".tok__marquee").forEach((wrap) => {
    const track = wrap.querySelector(".tok__track");
    if (!track) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setWidth = track.scrollWidth + gap;
    const original = track.innerHTML;
    const copies = Math.ceil(wrap.offsetWidth / setWidth) + 1;
    let html = original;
    for (let c = 1; c < copies; c++) html += original;
    track.innerHTML = html;
    gsap.fromTo(
      track,
      { x: 0 },
      { x: -setWidth, duration: setWidth / 55, ease: "none", repeat: -1 }
    );
    // opnieuw afspelen: gedupliceerde video's activeren
    track.querySelectorAll("video").forEach((v) => { const p = v.play(); if (p) p.catch(() => {}); });
  });
}

/* ---------- marquee strip (wit, rode tekst) ---------- */
if (window.gsap && !reduceMotion) {
  gsap.utils.toArray(".stripe").forEach((wrap) => {
    const track = wrap.querySelector(".stripe__track");
    if (!track) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setWidth = track.scrollWidth + gap;
    const original = track.innerHTML;
    const copies = Math.ceil(wrap.offsetWidth / setWidth) + 1;
    let html = original;
    for (let c = 1; c < copies; c++) html += original;
    track.innerHTML = html;
    gsap.fromTo(
      track,
      { x: 0 },
      { x: -setWidth, duration: setWidth / 60, ease: "none", repeat: -1 }
    );
  });
}

/* ---------- vestigingen kaart (Leaflet) ---------- */
(function locatorMap() {
  const mapEl = document.getElementById("loc-map");
  if (!mapEl || !window.L) return;

  const items = Array.from(document.querySelectorAll(".loc-item"));
  const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: "abc",
    attribution: "&copy; OpenStreetMap",
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

/* ---------- ScrollTrigger herberekenen zodra alles geladen is ----------
   Belangrijk: het Adobe display-font laadt laat en maakt de grote koppen
   hoger, waardoor alle secties verschuiven. Zonder refresh staan de
   trigger-posities scheef en lijken de scroll-effects niet te werken. */
if (window.gsap && window.ScrollTrigger) {
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  const vid = document.querySelector(".franchise2__photo video");
  if (vid) vid.addEventListener("loadeddata", refresh, { once: true });
  setTimeout(refresh, 1200);
}
