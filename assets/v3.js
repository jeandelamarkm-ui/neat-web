/* NEAT web v3 · el viaje. Una sola cámara que avanza con el scroll.
   Solo se escriben transform y opacity; todas las medidas se leen antes de escribir. */
(function () {
  "use strict";
  var d = document;
  window.__neat = 1;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var P = window.NEAT_POS || { fx: .5, fy: .5, fs: .12 };

  var beats = [].slice.call(d.querySelectorAll(".beat"));
  var inners = beats.map(function (b) { return b.querySelector(".inner"); });
  var chOf = beats.map(function (b) { return +b.getAttribute("data-ch") || 0; });
  var s1 = d.querySelector(".s1");
  var SC = [].slice.call(d.querySelectorAll(".scene[data-a]")).map(function (el) {
    return { el: el, cam: el.querySelector(".cam"), a: +el.getAttribute("data-a"), b: +el.getAttribute("data-b"),
             z: +el.getAttribute("data-z") || 0, pan: +el.getAttribute("data-pan") || 0, scrim: el.hasAttribute("data-scrim"), on: false };
  });
  var LAST = SC.length ? SC[SC.length - 1] : null;
  var orb = d.querySelector(".orb"), veil = d.querySelector(".veil"), scrim = d.querySelector(".scrim");
  var hl = d.querySelector(".hand.l"), hr = d.querySelector(".hand.r"), hands = d.querySelector(".hands");
  var mark = d.querySelector(".close .mark svg"), dot = d.querySelector(".close .mark .dot");
  var prog = d.querySelector(".grid .prog"), lab = d.querySelector(".grid .lab"), coord = d.querySelector(".grid .coord");
  var cue = d.querySelector(".cue");
  var idx = [].slice.call(d.querySelectorAll(".index a"));
  var names = (lab && lab.getAttribute("data-names") || "").split("|");
  var total = names.length;

  var vw = 0, vh = 0, tops = [], hb = null, h5 = null, L = beats.length - 1, cur = 0, raf = 0, lastCh = -1;

  function ss(a, b, x) { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  function measure() {
    vw = innerWidth; vh = innerHeight;
    var y = scrollY;
    tops = beats.map(function (b) { return b.getBoundingClientRect().top + y; });
    if (hands) { var r = hands.getBoundingClientRect(); hb = { x: r.left, y: r.top, w: r.width, h: r.height }; }
    var p5 = LAST && LAST.el.querySelector(".plate");
    if (p5) { var q = p5.getBoundingClientRect(); h5 = { x: q.left, y: q.top, w: q.width, h: q.height }; }
  }

  function tOf(y) {
    for (var i = tops.length - 1; i >= 0; i--) {
      if (y >= tops[i]) {
        var n = tops[i + 1];
        return n === undefined ? i + Math.min(1, (y - tops[i]) / vh) : i + (y - tops[i]) / (n - tops[i]);
      }
    }
    return 0;
  }

  function vis(el, o, state) {
    if (o <= 0.001) { if (state.on) { el.style.visibility = "hidden"; state.on = false; } el.style.opacity = 0; return false; }
    if (!state.on) { el.style.visibility = "visible"; state.on = true; }
    el.style.opacity = o.toFixed(3);
    return true;
  }

  function orbAt(x, y, size, o) {
    orb.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) scale(" + (size / 200).toFixed(4) + ")";
    orb.style.opacity = o.toFixed(3);
  }

  var s1state = { on: true };

  function frame() {
    raf = 0;
    var target = tOf(scrollY);
    cur = RM ? target : lerp(cur, target, 0.14);
    if (Math.abs(target - cur) < 0.0005) cur = target;
    var t = cur;

    // ---- lecturas ----
    var rects = inners.map(function (el) { return el.getBoundingClientRect(); });
    var mr = (t > L - 1 && mark) ? mark.getBoundingClientRect() : null;

    // ---- 1 · el encuentro: las manos se abren y la esfera crece hasta que entramos ----
    var sp = RM ? 0 : ss(0.04, 0.9, t);
    if (hl) {
    hl.style.transform = "translate3d(" + (-sp * 0.36 * vw).toFixed(1) + "px," + (sp * 0.05 * vh).toFixed(1) + "px,0) scale(" + (1 + sp * .12).toFixed(4) + ")";
    hr.style.transform = "translate3d(" + (sp * 0.36 * vw).toFixed(1) + "px," + (-sp * 0.03 * vh).toFixed(1) + "px,0) scale(" + (1 + sp * .12).toFixed(4) + ")";
    vis(s1, 1 - ss(0.72, 0.9, t), s1state);
    }
    if (hl) veil.style.opacity = (RM ? 0 : ss(0.42, 0.78, t) * (1 - ss(0.8, 0.98, t))).toFixed(3);

    // ---- escenas del viaje ----
    var sOp = 0;
    for (var k = 0; k < SC.length; k++) {
      var s = SC[k], inn = ss(s.a - 0.28, s.a - 0.02, t), out = s === LAST ? 0 : ss(s.b + 0.72, s.b + 0.98, t);
      if (k === 0) inn = hl ? ss(0.78, 0.98, t) : 1;
      var o = inn * (1 - out);
      if (vis(s.el, o, s)) {
        var z = ss(s.a - 0.3, s.b + 1, t);
        s.cam.style.transform = RM ? "none" :
          "translate3d(" + (s.pan * z).toFixed(3) + "vw,0,0) scale(" + (0.94 + 0.06 * inn + s.z * z + 0.12 * out).toFixed(4) + ")";
        if (s.scrim) sOp = Math.max(sOp, o);
      }
    }
    if (scrim) scrim.style.opacity = sOp.toFixed(3);

    // ---- la esfera: al inicio entre los dedos; al final se vuelve el punto de NEAT ----
    if (!orb) {
    } else if (t < 2 && hb) {
      var grow = RM ? 0 : ss(0.3, 1.0, t); grow = grow * grow;
      orbAt(hb.x + P.fx * hb.w, hb.y + P.fy * hb.h, P.fs * hb.w * (1 + grow * 34), 1 - ss(0.72, 0.95, t));
    } else if (mr) {
      var dx = mr.left + (189.46 / 724) * mr.width, dy = mr.top + ((44.63 - 17.3) / 156.7) * mr.height;
      var dsz = (2 * 27.31 / 724) * mr.width;
      var hx = h5 ? h5.x + h5.w / 2 : vw / 2, hy = h5 ? h5.y + 0.53 * h5.h : vh * 0.55, hs = (h5 ? h5.w : vw) * 0.07;
      var kk = ss(L - 0.3, L, t);
      orbAt(lerp(hx, dx, kk), lerp(hy, dy, kk), lerp(hs, dsz * 2.1, kk), ss(L - 0.5, L - 0.25, t) * (1 - ss(L + 0.25, L + 0.6, t)));
      if (dot) dot.style.opacity = ss(L - 0.1, L, t).toFixed(3);
    } else orbAt(-999, -999, 1, 0);

    // ---- texto: visible mientras su bloque ocupa el centro de la pantalla ----
    for (var i = 0; i < inners.length; i++) {
      var r = rects[i];
      var op = i === 0 ? ss(vh * 0.02, vh * 0.3, r.bottom) : ss(vh * 0.02, vh * 0.26, r.bottom) * (1 - ss(vh * 0.78, vh * 0.97, r.top));
      inners[i].style.opacity = op.toFixed(3);
    }
    if (cue) cue.style.opacity = (1 - ss(0.02, 0.15, t)).toFixed(3);

    // ---- retícula e índice ----
    var p = L > 0 ? Math.min(1, t / L) : 1;
    if (prog) prog.style.transform = "scaleX(" + p.toFixed(4) + ")";
    var ch = chOf[Math.min(chOf.length - 1, Math.round(t))] || 0;
    if (ch !== lastCh) {
      lastCh = ch;
      idx.forEach(function (a, j) { a.classList.toggle("on", j === ch); });
      if (lab) lab.textContent = "0" + (ch + 1) + " / 0" + total + " · " + (names[ch] || "");
    }
    if (coord) coord.textContent = String(Math.round(p * 100)).padStart(3, "0") + "%";

    if (cur !== target) raf = requestAnimationFrame(frame);
  }

  function req() { if (!raf) raf = requestAnimationFrame(frame); }
  var rz = 0, lastW = 0;
  function onResize() {
    if (rz) return;
    rz = requestAnimationFrame(function () {
      rz = 0;
      // la barra de Safari cambia solo el alto: no se recalcula todo por eso
      if (innerWidth === lastW && Math.abs(innerHeight - vh) < 140) return;
      lastW = innerWidth; measure(); cur = tOf(scrollY); req();
    });
  }

  // formulario: todavía sin conectar; nunca dice que se envió
  var form = d.querySelector("form.form");
  if (form) { var fb = form.querySelector("button[type=submit]"); if (fb) fb.disabled = false; }
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true, first = null;
    [].forEach.call(form.querySelectorAll("[required]"), function (el) {
      var bad = !el.value.trim() || (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      var er = d.getElementById(el.id + "-e");
      if (er) er.hidden = !bad;
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) { ok = false; first = first || el; }
    });
    var c = d.getElementById("consent"), ce = d.getElementById("consent-e");
    if (c && !c.checked) { ok = false; if (ce) ce.hidden = false; first = first || c; } else if (ce) ce.hidden = true;
    if (!ok) { first.focus(); return; }
    var st = form.querySelector(".status");
    if (st) { st.hidden = false; st.focus(); }
  });

  // menú
  var mb = d.querySelector(".menu-btn"), dr = d.getElementById("drawer");
  if (mb) mb.addEventListener("click", function () {
    var o = mb.getAttribute("aria-expanded") !== "true";
    mb.setAttribute("aria-expanded", o); dr.classList.toggle("open", o);
  });
  if (dr) dr.addEventListener("click", function (e) { if (e.target.tagName === "A") { mb.setAttribute("aria-expanded", "false"); dr.classList.remove("open"); } });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && dr && dr.classList.contains("open")) { mb.click(); mb.focus(); } });

  // imágenes de las escenas: se piden cuando la página ya cargó y se decodifican antes de verse
  function cargarResto() {
    var ims = [].slice.call(d.querySelectorAll("img[data-srcset]")), i = 0;
    (function sig() {
      var im = ims[i++]; if (!im) return;
      im.srcset = im.getAttribute("data-srcset"); im.removeAttribute("data-srcset");
      var p = im.decode ? im.decode() : null;
      if (p) p.then(sig, sig); else setTimeout(sig, 60);
    })();
  }
  addEventListener("load", function () { setTimeout(cargarResto, 300); measure(); req(); });
  if (d.readyState === "complete") setTimeout(cargarResto, 300);

  lastW = innerWidth;
  measure(); cur = tOf(scrollY);
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", onResize);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { measure(); req(); });
  frame();
})();
