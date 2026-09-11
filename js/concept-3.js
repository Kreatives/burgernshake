/* ============================================================
   BURGER 'N SHAKE — CONCEPT 3
   Alleen de nieuwe hero: burger-motion + fotostrip als marquee.
   De rest van de secties draait op concept-2.js.
   In een IIFE zodat globals niet botsen met concept-2.js.
   ============================================================ */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* kop-afbeelding: subtiele parallax omhoog op scroll */
  const art = document.querySelector(".hero3__art");
  if (art && !reduceMotion && window.ScrollTrigger) {
    gsap.fromTo(
      art,
      { yPercent: 0 },
      {
        yPercent: -16,
        ease: "none",
        scrollTrigger: { trigger: ".hero3", start: "top top", end: "bottom top", scrub: true },
      }
    );
  }

  /* fotostrip onderaan de hero = doorlopende marquee */
  if (!reduceMotion) {
    document.querySelectorAll(".hero3__gallery-track").forEach((track) => {
      const wrap = track.parentElement;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const setWidth = track.scrollWidth + gap;
      const original = track.innerHTML;
      const copies = Math.ceil(wrap.offsetWidth / setWidth) + 2;
      let html = original;
      for (let c = 1; c < copies; c++) html += original;
      track.innerHTML = html;
      gsap.fromTo(
        track,
        { x: 0 },
        { x: -setWidth, duration: setWidth / 45, ease: "none", repeat: -1 }
      );
    });
  }

  if (window.ScrollTrigger) {
    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
