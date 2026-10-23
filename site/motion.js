/* Headroom motion: "fills animate once per first view" (Stage 1, Motion).
   Gauges, budget bars and comparison bars grow from zero; chart lines draw;
   chart bars rise; donut slices fade in. Everything uses the motion tokens and
   is skipped under reduced motion (OS setting or html[data-motion=reduce]). */
(function () {
  const reduced = () => document.documentElement.dataset.motion === 'reduce'; // set by nav.js: OS setting by default, overridable in the sidebar
  const SLOW = 'var(--motion-duration-slow)', BASE = 'var(--motion-duration-base)', ENTER = 'var(--motion-easing-enter)';
  const ms = v => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 400;

  function prepare(scope) {
    const jobs = [];
    // width fills
    scope.querySelectorAll('.track .f, .hbar .fill, .hr-insight .cmp i, .fin-demo .track .f').forEach(el => {
      const w = el.style.width; if (!w || el.dataset.mo) return;
      el.dataset.mo = '1'; el.style.transition = 'none'; el.style.width = '0%';
      jobs.push({ el, run: d => { el.style.transition = `width ${SLOW} ${ENTER} ${d}ms`; el.style.width = w; } });
    });
    // height fills (clearance gauges); the Foundations hero gauge animates itself
    scope.querySelectorAll('.gg .fill').forEach(el => {
      const h = el.style.height; if (!h || el.dataset.mo) return;
      el.dataset.mo = '1'; el.style.transition = 'none'; el.style.height = '0%';
      jobs.push({ el, run: d => { el.style.transition = `height ${SLOW} ${ENTER} ${d}ms`; el.style.height = h; } });
    });
    // chart lines draw (solid strokes only; dashed limit lines stay put)
    scope.querySelectorAll('.chart svg path[fill="none"]:not([stroke-dasharray]), [data-chart] svg path[fill="none"]:not([stroke-dasharray])').forEach(el => {
      if (el.dataset.mo || !el.getTotalLength) return;
      const len = el.getTotalLength(); if (!len) return;
      el.dataset.mo = '1'; el.style.strokeDasharray = len; el.style.strokeDashoffset = len;
      jobs.push({ el, run: d => { el.style.transition = `stroke-dashoffset ${SLOW} ${ENTER} ${d}ms`; el.style.strokeDashoffset = 0; setTimeout(() => { el.style.strokeDasharray = ''; }, ms('--motion-duration-slow') + d + 50); } });
    });
    // chart bars rise from the axis, staggered
    scope.querySelectorAll('.chart svg rect').forEach((el, i) => {
      if (el.dataset.mo) return; el.dataset.mo = '1';
      el.style.transformBox = 'fill-box'; el.style.transformOrigin = '50% 100%'; el.style.transform = 'scaleY(0)';
      jobs.push({ el, run: d => { el.style.transition = `transform ${SLOW} ${ENTER} ${d + (i % 6) * 60}ms`; el.style.transform = 'scaleY(1)'; } });
    });
    // donut slices fade in, staggered; inline opacity is cleared after so focus/dim still works
    scope.querySelectorAll('.donut path').forEach((el, i) => {
      if (el.dataset.mo) return; el.dataset.mo = '1'; el.style.opacity = '0';
      jobs.push({ el, run: d => { el.style.transition = `opacity ${BASE} ${ENTER} ${d + i * 50}ms`; el.style.opacity = ''; setTimeout(() => { el.style.transition = ''; }, 900); } });
    });
    return jobs;
  }

  function start() {
    if (reduced()) return;
    const jobs = prepare(document);
    const target = j => (j.el instanceof SVGElement ? j.el.closest('svg') : j.el.parentElement) || j.el;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      jobs.filter(j => target(j) === e.target).forEach(j => requestAnimationFrame(() => requestAnimationFrame(() => j.run(80))));
    }), { threshold: 0.35 });
    new Set(jobs.map(target)).forEach(t => io.observe(t));
  }
  window.hrMotionReplay = function (scope) {
    if (reduced()) return;
    scope.querySelectorAll('[data-mo]').forEach(el => delete el.dataset.mo);
    const jobs = prepare(scope);
    requestAnimationFrame(() => requestAnimationFrame(() => jobs.forEach(j => j.run(60))));
  };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
