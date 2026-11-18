/* NEAT · movimiento e interacción del sitio. Solo anima transform y opacity en la página;
   las partículas se dibujan en un lienzo que arranca cuando la página terminó de cargar. */
(function () {
  "use strict";
  window.__neat = true;
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var head = document.querySelector(".head");
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- menú del celular ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var esLabels = { open: menuBtn ? menuBtn.getAttribute("aria-label") : "", close: doc.lang === "en" ? "Close menu" : "Cerrar el menú" };
  function setMenu(open, focusBack) {
    document.body.classList.toggle("menu-open", open);
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? esLabels.close : esLabels.open);
      if (!open && focusBack) menuBtn.focus();
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    document.querySelectorAll(".drawer a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false, true); });
    var wide = window.matchMedia("(min-width: 1081px)");
    var onWide = function () { if (wide.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  /* ---------- pestañas / acordeón ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tabs = box.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", on ? "true" : "false");
          t.tabIndex = on ? 0 : -1;
          var p = document.getElementById(t.getAttribute("aria-controls"));
          p.hidden = !on;
          p.classList.toggle("show", on);
        });
      });
      tab.addEventListener("keydown", function (e) {
        var list = Array.prototype.slice.call(tabs), i = list.indexOf(tab);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); list[(i + 1) % list.length].focus(); list[(i + 1) % list.length].click(); }
        if (e.key === "Home" || e.key === "End") { e.preventDefault(); var k2 = e.key === "Home" ? list[0] : list[list.length - 1]; k2.focus(); k2.click(); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); list[(i - 1 + list.length) % list.length].click(); }
      });
    });
  });

  /* ---------- formulario (todavía sin conectar) ---------- */
  var form = document.querySelector("form.form");
  if (form) {
    var sendBtn = form.querySelector("button[type=submit]");
    if (sendBtn) sendBtn.disabled = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, first = null;
      form.querySelectorAll(".field").forEach(function (f) {
        var input = f.querySelector("input, textarea");
        var bad = input.required && (!input.value.trim() || (input.type === "email" && !input.checkValidity()));
        f.classList.toggle("bad", bad);
        input.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) { ok = false; first = first || input; }
      });
      var consent = form.querySelector("#consent");
      var consentErr = form.querySelector(".consent-err");
      if (!consent.checked) { ok = false; consentErr.hidden = false; first = first || consent; } else { consentErr.hidden = true; }
      var status = form.querySelector(".status");
      if (!ok) { status.classList.remove("show"); first.focus(); return; }
      status.classList.add("show");
      status.focus();
    });
  }

  /* ---------- aparecer al entrar en pantalla ---------- */
  function startReveal() {
    var targets = document.querySelectorAll(".rv, .steps, .belief, .scene, .page-hero");
    if (reduce || !("IntersectionObserver" in window)) { targets.forEach(function (t) { t.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* recorrido del punto en la demo */
  function sizeDemo() {
    document.querySelectorAll(".flow").forEach(function (f) {
      var pulse = f.querySelector(".pulse");
      if (pulse) pulse.style.setProperty("--travel", (f.clientWidth - 9) + "px");
    });
  }

  /* ---------- héroe de las manos ---------- */
  var hero = document.querySelector(".hero");
  var H = null;
  if (hero) {
    H = {
      pin: hero.querySelector(".hero-pin"), sky: hero.querySelector(".sky"), night: hero.querySelector(".night"), stage: hero.querySelector(".stage"),
      l: hero.querySelector(".hand-l"), r: hero.querySelector(".hand-r"),
      letters: hero.querySelectorAll(".mark path"), glow: hero.querySelector(".glow"), core: hero.querySelector(".core"),
      copy: hero.querySelector(".hero-copy"), end: hero.querySelector(".hero-end"), cue: hero.querySelector(".cue"),
      w: 0, h: 0, tx: 0, ty: 0, s: 1, d: 0
    };
  }
  function measureHero() {
    if (!H) return;
    var st = H.stage;
    st.style.transform = "none";
    var r0 = st.getBoundingClientRect(), pr = H.pin.getBoundingClientRect();
    var r = { left: r0.left - pr.left, top: r0.top - pr.top };
    H.w = r0.width; H.h = r0.height;
    var vw = window.innerWidth, vh = window.innerHeight;
    // caja del logo dentro del cuadro (mismos números que .mark en la hoja de estilos)
    var ww = 0.62 * H.w, wh = ww * 0.2164, x0 = 0.3372 * H.w, y0 = 0.4576 * H.h;
    var target = Math.min(0.84 * vw, ww, 1040);
    H.s = target / ww;
    var portrait = vw / vh < 0.8;
    var tyCenter = vh * (portrait ? 0.44 : 0.46);
    H.tx = vw / 2 - (r.left + H.s * (x0 + ww / 2));
    H.ty = tyCenter - (r.top + H.s * (y0 + wh / 2));
    // el punto del logo: radio 27.31 de 724 unidades de ancho
    H.d = 2 * (27.31 / 724) * ww;
    H.core.style.width = H.core.style.height = H.d + "px";
    H.core.style.left = H.core.style.top = (-H.d / 2) + "px";
    H.end.style.top = Math.min(vh - 90, tyCenter + target * 0.2164 / 2 + Math.max(28, vh * 0.05)) + "px";
    paintHero(true);
  }
  var lastP = -1;
  function heroProgress() {
    var r = hero.getBoundingClientRect();
    var span = hero.offsetHeight - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }
  function paintHero(force) {
    if (!H) return;
    var p = reduce ? 0 : heroProgress();
    if (!force && Math.abs(p - lastP) < 0.0004) return;
    lastP = p;
    var a = smooth(0, 0.42, p) * 0.82;
    H.l.style.transform = "translate(" + (0.010 * H.w * a) + "px," + (-0.0225 * H.h * a) + "px)";
    H.r.style.transform = "translate(" + (-0.010 * H.w * a) + "px," + (0.0225 * H.h * a) + "px)";
    var handsOut = 1 - smooth(0.42, 0.66, p);
    H.l.style.opacity = H.r.style.opacity = handsOut;
    H.sky.style.transform = "scale(" + (1 + 0.06 * smooth(0, 1, p)) + ")";
    H.night.style.opacity = smooth(0.32, 0.72, p);
    var e = smooth(0.48, 0.95, p);
    H.stage.style.transform = "translate(" + H.tx * e + "px," + H.ty * e + "px) scale(" + (1 + (H.s - 1) * e) + ")";
    H.glow.style.transform = "scale(" + (1 + 0.55 * smooth(0.22, 0.44, p) - 0.75 * smooth(0.5, 0.92, p)) + ")";
    H.glow.style.opacity = 1 - 0.9 * smooth(0.6, 0.95, p);
    H.core.style.transform = "scale(" + (0.16 + 0.84 * smooth(0.5, 0.9, p)) + ")";
    var steps = [[0.66, 0.84], [0.7, 0.88], [0.74, 0.92], [0.78, 0.96]];
    for (var i = 0; i < H.letters.length; i++) H.letters[i].style.opacity = smooth(steps[i][0], steps[i][1], p);
    var c = smooth(0, 0.28, p);
    H.copy.style.opacity = 1 - c;
    H.copy.style.transform = "translateY(" + (-48 * c) + "px)";
    H.copy.style.visibility = c > 0.99 ? "hidden" : "visible";
    H.cue.style.opacity = 1 - smooth(0, 0.06, p);
    var f = smooth(0.86, 1, p);
    H.end.style.opacity = f;
    H.end.style.transform = "translateY(" + 14 * (1 - f) + "px)";
  }

  /* ---------- color de la cabecera según lo que tiene debajo ---------- */
  var themed = document.querySelectorAll("[data-head]");
  function paintHead() {
    if (!head) return;
    var y = 38, mode = "dark";
    if (hero && hero.getBoundingClientRect().bottom > y) {
      mode = heroProgress() < 0.5 ? "sky" : "dark";
    } else {
      for (var i = 0; i < themed.length; i++) {
        var r = themed[i].getBoundingClientRect();
        if (r.top <= y && r.bottom > y) { mode = themed[i].getAttribute("data-head"); break; }
      }
    }
    head.classList.toggle("on-sky", mode === "sky");
    head.classList.toggle("on-light", mode === "light");
    head.classList.toggle("solid", window.scrollY > 24 && !(hero && mode === "sky" && window.scrollY < 40));
  }

  /* ---------- partículas: flotan sueltas, se ordenan en corrientes y al final forman el logo ---------- */
  var canvas = document.getElementById("dots");
  var S = null;
  var LOGO_N = "M230.60 162.00L230.60 108.00C175.31 108.00 178.39 109.39 152.75 83.75L97.68 28.68C82.83 13.83 64.74 7.32 43.74 7.32C25.28 7.32 0.00 15.00 0.00 53.91L0.00 167.50L58.10 167.50L58.10 88.17C58.10 81.93 65.64 78.81 70.05 83.22L120.60 133.77C153.43 166.59 173.94 174.00 194.34 174.00C207.91 174.00 220.86 169.54 230.60 162.00Z";
  var LOGO_E = "M260 20H383V56H296V79H371V114H296V138H383V174H260Z";
  var LOGO_A = "M414 174L478 20H511L575 174H536L525 145H462L451 174Z M475 111H512L493.5 61Z";
  var LOGO_T = "M582 20H724V56H671V174H635V56H582Z";
  var slot = document.querySelector(".logo-slot");
  var zones = document.querySelectorAll("[data-p]");

  // puntos del logo, relativos a su centro
  function logoPoints(width, want) {
    var h = width * 0.2164, c = document.createElement("canvas");
    c.width = Math.ceil(width); c.height = Math.ceil(h);
    var g = c.getContext("2d"), k = width / 724;
    g.setTransform(k, 0, 0, k, 0, -17.3 * k);
    g.fillStyle = "#fff";
    g.save(); g.translate(0, 10.44); g.scale(0.94, 0.94); g.fill(new Path2D(LOGO_N)); g.restore();
    g.beginPath(); g.arc(189.46, 44.63, 27.31, 0, 6.2832); g.fill();
    g.fill(new Path2D(LOGO_E)); g.fill(new Path2D(LOGO_A), "evenodd"); g.fill(new Path2D(LOGO_T));
    var data = g.getImageData(0, 0, c.width, c.height).data, filled = 0, i;
    for (i = 3; i < data.length; i += 4) if (data[i] > 128) filled++;
    var step = Math.max(2, Math.sqrt(filled / want)), pts = [];
    for (var y = step / 2; y < c.height; y += step) {
      for (var x = step / 2; x < c.width; x += step) {
        if (data[((y | 0) * c.width + (x | 0)) * 4 + 3] > 128) pts.push([x - width / 2, y - h / 2]);
      }
    }
    for (i = pts.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, tmp = pts[i]; pts[i] = pts[j]; pts[j] = tmp; }
    return pts;
  }

  var idleRun = window.requestIdleCallback ? function (f) { window.requestIdleCallback(f, { timeout: 1500 }); } : function (f) { setTimeout(f, 300); };
  function logoShape() {
    var lw = S.w >= 900 ? Math.min(S.w * 0.7, 900) : S.w * 0.84;
    return logoPoints(lw, Math.round(S.p.length * 0.86));
  }

  function setupStars() {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    S = { ctx: ctx, p: [], w: 0, h: 0, dpr: 1, px: -999, py: -999, running: false, opacity: -1, pts: [], mode: "drift" };
    function resize(e) {
      // En el celular la barra del navegador aparece y desaparece al desplazarse y cambia
      // solo la altura: no rehacer el lienzo por eso (lo estiramos un poco y ya).
      if (e && S.w === window.innerWidth && Math.abs(window.innerHeight - S.h) < 220) return;
      S.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var ow = S.w || window.innerWidth, oh = S.h || window.innerHeight;
      S.w = window.innerWidth; S.h = window.innerHeight;
      canvas.width = Math.round(S.w * S.dpr); canvas.height = Math.round(S.h * S.dpr);
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      var n = S.w >= 900 ? 1500 : 800;
      if (S.p.length !== n) {
        S.p = [];
        for (var i = 0; i < n; i++) {
          var hx = Math.random() * S.w, hy = Math.random() * S.h;
          S.p.push({ x: hx, y: hy, hx: hx, hy: hy, fx: hx, ph: Math.random() * 6.2832, sp: 0.5 + Math.random(), lane: i % 9, warm: Math.random() < 0.16, s: Math.random() < 0.2 ? 2 : 1.3 });
        }
      } else {
        S.p.forEach(function (q) { q.hx *= S.w / ow; q.hy *= S.h / oh; });
      }
      // la forma del logo se calcula aparte, cuando el navegador está libre
      S.pts = null;
      idleRun(function () { if (!S.pts) S.pts = logoShape(); });
    }
    resize();
    window.addEventListener("resize", resize);
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", function (e) { S.px = e.clientX; S.py = e.clientY; }, { passive: true });
      document.addEventListener("pointerleave", function () { S.px = S.py = -999; });
    }
  }

  function currentMode() {
    var vh = window.innerHeight;
    if (slot) {
      var r = slot.getBoundingClientRect(), cy = r.top + r.height / 2;
      if (cy > vh * 0.18 && cy < vh * 0.82) return { mode: "logo", cx: r.left + r.width / 2, cy: cy };
    }
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i].getBoundingClientRect();
      if (z.top <= vh * 0.5 && z.bottom > vh * 0.5) return { mode: zones[i].getAttribute("data-p") };
    }
    return { mode: "drift" };
  }

  function drawStars(t) {
    var ctx = S.ctx, P = S.p, n = P.length, m = currentMode(), W = S.w, H = S.h;
    var k = reduce ? 1 : (m.mode === "logo" ? 0.075 : 0.045);
    if (m.mode === "logo" && !S.pts) S.pts = logoShape();
    var pts = S.pts || [], np = pts.length;
    ctx.clearRect(0, 0, W, H);
    var groups = [[], [], []]; // tenue, blanco, cálido
    for (var i = 0; i < n; i++) {
      var q = P[i], tx, ty, g = q.warm ? 2 : 1;
      if (m.mode === "logo" && i < np) {
        tx = m.cx + pts[i][0]; ty = m.cy + pts[i][1];
      } else if (m.mode === "flow") {
        q.fx += reduce ? 0 : 0.6 + q.sp * 0.9;
        if (q.fx > W + 30) q.fx = -30;
        tx = q.fx; ty = H * (0.14 + 0.72 * q.lane / 8) + Math.sin(q.fx * 0.008 + q.lane + t * 0.0008) * 18;
        if (Math.abs(tx - q.x) > W * 0.5) q.x = tx;
      } else {
        var amp = m.mode === "tense" ? 9 : 46;
        tx = q.hx + Math.sin(t * 0.00028 * q.sp + q.ph) * amp + (m.mode === "tense" && !reduce ? (Math.random() - 0.5) * 5 : 0);
        ty = q.hy + Math.cos(t * 0.00023 * q.sp + q.ph) * amp;
        if (m.mode === "logo") g = 0;
      }
      q.x += (tx - q.x) * k; q.y += (ty - q.y) * k;
      var dx = q.x - S.px, dy = q.y - S.py, d2 = dx * dx + dy * dy;
      if (d2 < 8100 && d2 > 1) { var d = Math.sqrt(d2), f = (90 - d) * 0.09; q.x += dx / d * f; q.y += dy / d * f; }
      groups[g].push(q);
    }
    var styles = ["rgba(241,239,234,0.18)", m.mode === "logo" ? "rgba(241,239,234,0.92)" : "rgba(241,239,234,0.5)", m.mode === "logo" ? "rgba(255,215,154,0.95)" : "rgba(255,215,154,0.6)"];
    for (var gi = 0; gi < 3; gi++) {
      ctx.fillStyle = styles[gi];
      var arr = groups[gi];
      var big = m.mode === "logo" && gi > 0 ? 0.5 : 0;
      for (var j = 0; j < arr.length; j++) ctx.fillRect(arr[j].x, arr[j].y, arr[j].s + big, arr[j].s + big);
    }
  }
  function starsOpacity() {
    if (!hero || reduce) return 1;
    return smooth(0.8, 1, heroProgress());
  }
  function loopStars(t) {
    S.running = false;
    if (document.hidden) return;
    var op = starsOpacity();
    if (op !== S.opacity) { canvas.style.opacity = op; S.opacity = op; }
    if (op > 0.01) drawStars(t || performance.now());
    if (!reduce) { S.running = true; requestAnimationFrame(loopStars); }
  }
  function kickStars() { if (S && !S.running) { S.running = true; requestAnimationFrame(loopStars); } }

  /* ---------- desplazamiento ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      paintHero(false);
      paintHead();
      if (reduce && S) loopStars(0);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  var resizeQueued = false;
  window.addEventListener("resize", function () {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(function () { resizeQueued = false; measureHero(); sizeDemo(); paintHead(); });
  });
  document.addEventListener("visibilitychange", kickStars);

  measureHero();
  paintHead();
  sizeDemo();
  startReveal();

  function afterLoad() {
    // el polvo de luz arranca cuando la primera pantalla ya se ve
    idleRun(startStars);
  }
  function startStars() {
    setupStars();
    // decodificar las esculturas antes de llegar a ellas, sin bloquear nada
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 200); };
    idle(function () {
      document.querySelectorAll(".art img, .belief .bg img").forEach(function (img) {
        img.loading = "eager";
        if (img.decode) img.decode().catch(function () {});
      });
    });
    if (S) { if (reduce) loopStars(0); else kickStars(); }
  }
  if (document.readyState === "complete") afterLoad(); else window.addEventListener("load", afterLoad);
})();
