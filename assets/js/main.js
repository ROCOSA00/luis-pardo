/* ==========================================================================
   Luis Pardo · Mentalista — interacciones
   Sin dependencias. Cada módulo se activa solo si encuentra sus elementos.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function safeStorage(type) {
    try { var s = window[type]; var k = "__lp"; s.setItem(k, k); s.removeItem(k); return s; } catch (e) { return null; }
  }
  var session = safeStorage("sessionStorage");

  /* ---------- Intro: el ojo se abre (solo la primera visita de la sesión) ---------- */
  var intro = $(".intro");
  if (intro) {
    if (reduceMotion || (session && session.getItem("lp-intro"))) {
      intro.remove();
    } else {
      if (session) session.setItem("lp-intro", "1");
      window.addEventListener("load", function () {
        setTimeout(function () { intro.classList.add("is-done"); }, 1100);
        setTimeout(function () { intro.remove(); }, 2000);
      });
      setTimeout(function () { if (intro.isConnected) intro.classList.add("is-done"); }, 3500);
    }
  }

  /* ---------- Cabecera: fondo al hacer scroll y se oculta al bajar ---------- */
  var header = $(".site-header");
  var lastY = window.scrollY;
  var stickyCta = $(".sticky-cta");
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 30);
      var menuOpen = doc.classList.contains("menu-open");
      header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove("is-hidden");
    }
    if (stickyCta) stickyCta.classList.toggle("is-visible", y > window.innerHeight * 0.8);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (stickyCta) document.body.classList.add("has-sticky-cta");

  /* ---------- Menú móvil ---------- */
  var toggle = $(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = doc.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    $$(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () { doc.classList.remove("menu-open"); toggle.setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && doc.classList.contains("menu-open")) { doc.classList.remove("menu-open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });
  }

  /* ---------- Desplegables del menú (también en táctil) ---------- */
  $$(".nav-item.has-dropdown").forEach(function (item) {
    var btn = $(".nav-link", item);
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = !item.classList.contains("is-open");
      $$(".nav-item.is-open").forEach(function (o) { o.classList.remove("is-open"); $(".nav-link", o).setAttribute("aria-expanded", "false"); });
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-item.has-dropdown")) {
      $$(".nav-item.is-open").forEach(function (o) { o.classList.remove("is-open"); $(".nav-link", o).setAttribute("aria-expanded", "false"); });
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") $$(".nav-item.is-open").forEach(function (o) { o.classList.remove("is-open"); });
  });

  /* ---------- Aparición al hacer scroll ---------- */
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Contadores ---------- */
  function formatNum(n) { return n.toLocaleString("es-ES", { useGrouping: "always" }); }
  var counters = $$("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (reduceMotion) { el.textContent = prefix + (decimals ? target.toFixed(decimals).replace(".", ",") : formatNum(target)) + suffix; return; }
    var start = performance.now(), dur = 2000;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      var v = target * eased;
      el.textContent = prefix + (decimals ? v.toFixed(decimals).replace(".", ",") : formatNum(Math.round(v))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else counters.forEach(runCounter);

  /* ---------- Linterna del hero (sigue al cursor) ---------- */
  $$("[data-lantern]").forEach(function (hero) {
    var lantern = $(".hero-lantern", hero);
    if (!lantern || reduceMotion) return;
    var raf = null;
    hero.addEventListener("pointermove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var r = hero.getBoundingClientRect();
        lantern.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        lantern.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
        raf = null;
      });
    });
  });

  /* ---------- Brasas flotando (canvas) ---------- */
  $$("canvas.embers").forEach(function (canvas) {
    if (reduceMotion) return;
    var ctx = canvas.getContext("2d");
    var parts = [], w, h, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    function resize() {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 10,
        r: Math.random() * 1.8 + 0.4,
        vy: -(Math.random() * 0.5 + 0.15),
        vx: (Math.random() - 0.5) * 0.25,
        life: 0,
        max: 400 + Math.random() * 500,
        hue: Math.random() < 0.75 ? 18 + Math.random() * 20 : 42
      };
    }
    resize();
    var count = Math.round(Math.min(90, w / 14));
    for (var i = 0; i < count; i++) parts.push(spawn(true));
    window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { running = en[0].isIntersecting; if (running) loop(); }).observe(canvas);
    }
    var t = 0;
    function loop() {
      if (!running) return;
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.life++;
        p.x += p.vx + Math.sin(t + i) * 0.15;
        p.y += p.vy;
        var a = Math.sin(Math.min(p.life / p.max, 1) * Math.PI);
        ctx.beginPath();
        ctx.fillStyle = "hsla(" + p.hue + ",100%,60%," + (a * 0.85) + ")";
        ctx.shadowBlur = 12; ctx.shadowColor = "hsla(" + p.hue + ",100%,55%,0.9)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.life > p.max || p.y < -10) parts[i] = spawn(false);
      }
      requestAnimationFrame(loop);
    }
    loop();
  });

  /* ---------- Texto que se "descifra" (rotación de palabras) ---------- */
  $$("[data-scramble]").forEach(function (el) {
    var words = el.getAttribute("data-scramble").split("|");
    if (reduceMotion || words.length < 2) return;
    var chars = "ΔΣΨΩ☽✦#%&@*†‡§∞";
    var idx = 0;
    function scrambleTo(word) {
      var frame = 0, total = 22;
      var from = el.textContent;
      (function step() {
        var out = "";
        var len = Math.max(from.length, word.length);
        for (var i = 0; i < len; i++) {
          var settle = (i / len) * total * 0.7;
          if (frame >= settle + 6) out += word[i] || "";
          else if (frame >= settle) out += chars[Math.floor(Math.random() * chars.length)];
          else out += from[i] || "";
        }
        el.textContent = out;
        if (++frame <= total + 6) requestAnimationFrame(step);
        else el.textContent = word;
      })();
    }
    setInterval(function () { idx = (idx + 1) % words.length; scrambleTo(words[idx]); }, 2800);
  });

  /* ---------- Inclinación 3D de tarjetas ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    $$("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + (x * 10) + "deg) rotateX(" + (-y * 10) + "deg) translateY(-6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- Carruseles ---------- */
  $$("[data-carousel]").forEach(function (root) {
    var track = $(".carousel-track", root);
    var slides = Array.prototype.slice.call(track.children);
    var prev = $(".carousel-prev", root), next = $(".carousel-next", root);
    var dotsWrap = $(".carousel-dots", root);
    function step() { return slides[0] ? slides[0].getBoundingClientRect().width + 20 : track.clientWidth; }
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step(), behavior: "smooth" });
    });
    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (s, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Ir a la diapositiva " + (i + 1));
        b.addEventListener("click", function () { track.scrollTo({ left: s.offsetLeft - track.offsetLeft, behavior: "smooth" }); });
        dotsWrap.appendChild(b); dots.push(b);
      });
    }
    function updateDots() {
      if (!dots.length) return;
      var i = Math.round(track.scrollLeft / step());
      dots.forEach(function (d, j) { d.setAttribute("aria-current", j === Math.min(i, dots.length - 1) ? "true" : "false"); });
    }
    track.addEventListener("scroll", function () { requestAnimationFrame(updateDots); }, { passive: true });
    updateDots();
    var auto = parseInt(root.getAttribute("data-autoplay") || "0", 10);
    if (auto && !reduceMotion) {
      var timer = setInterval(function () { if (!root.matches(":hover") && document.visibilityState === "visible") next && next.click(); }, auto);
      track.addEventListener("pointerdown", function () { clearInterval(timer); }, { once: true });
    }
  });

  /* ---------- Vídeos (se cargan solo al pulsar) ---------- */
  $$("[data-video], [data-youtube]").forEach(function (box) {
    var btn = $(".video-play", box) || box;
    btn.addEventListener("click", function () {
      var yt = box.getAttribute("data-youtube");
      var el;
      if (yt) {
        el = document.createElement("iframe");
        el.src = "https://www.youtube-nocookie.com/embed/" + yt + "?autoplay=1&rel=0";
        el.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        el.allowFullscreen = true;
        el.title = box.getAttribute("data-title") || "Vídeo";
      } else {
        el = document.createElement("video");
        el.src = box.getAttribute("data-video");
        el.controls = true; el.autoplay = true; el.playsInline = true;
        el.setAttribute("playsinline", "");
        el.addEventListener("error", function () {
          box.innerHTML = '<div class="video-missing"><strong>Este vídeo no está disponible ahora mismo.</strong><span>Vuelve a intentarlo más tarde o escríbenos por WhatsApp.</span></div>';
        });
      }
      box.innerHTML = "";
      box.appendChild(el);
      if (el.play) { var p = el.play(); if (p && p.catch) p.catch(function () {}); }
    }, { once: true });
  });

  /* ---------- Galería con visor ---------- */
  var lbLinks = $$("[data-lightbox] a");
  if (lbLinks.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Visor de imágenes");
    lb.innerHTML =
      '<img alt="">' +
      '<button class="lb-close" type="button" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button class="lb-prev" type="button" aria-label="Anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="lb-next" type="button" aria-label="Siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<div class="lb-count"></div>';
    document.body.appendChild(lb);
    var lbImg = $("img", lb), lbCount = $(".lb-count", lb), cur = 0, lastFocus = null;
    function show(i) {
      cur = (i + lbLinks.length) % lbLinks.length;
      var a = lbLinks[cur];
      lbImg.src = a.getAttribute("href");
      lbImg.alt = ($("img", a) || {}).alt || "";
      lbCount.textContent = (cur + 1) + " / " + lbLinks.length;
    }
    function open(i) { lastFocus = document.activeElement; show(i); lb.classList.add("is-open"); $(".lb-close", lb).focus(); }
    function close() { lb.classList.remove("is-open"); if (lastFocus) lastFocus.focus(); }
    lbLinks.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); open(i); }); });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { show(cur - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });
  }

  /* ---------- Cartas que se giran (táctil) ---------- */
  $$(".flip").forEach(function (f) {
    var b = $(".flip-btn", f);
    if (b) b.addEventListener("click", function (e) { e.stopPropagation(); f.classList.toggle("is-flipped"); });
  });

  /* ---------- Reproductor de la BSO ---------- */
  $$("[data-player]").forEach(function (root) {
    var audio = new Audio();
    audio.preload = "none";
    var items = $$(".player-list li[data-src]", root);
    var titleEl = $(".player-title", root);
    var playBtn = $(".play", root);
    var bar = $(".player-bar", root), fill = $(".player-bar span", root);
    var tCur = $(".t-cur", root), tDur = $(".t-dur", root);
    var iconPlay = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    var iconPause = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
    var index = -1;
    function fmt(s) { if (!isFinite(s)) return "0:00"; var m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ":" + (r < 10 ? "0" : "") + r; }
    function load(i, autoplay) {
      index = (i + items.length) % items.length;
      items.forEach(function (li, j) { li.classList.toggle("is-active", j === index); });
      var li = items[index];
      audio.src = li.getAttribute("data-src");
      titleEl.textContent = li.getAttribute("data-title");
      if (autoplay) audio.play().catch(function () {});
    }
    function setPlaying(on) {
      root.classList.toggle("is-playing", on);
      playBtn.innerHTML = on ? iconPause : iconPlay;
      playBtn.setAttribute("aria-label", on ? "Pausar" : "Reproducir");
    }
    items.forEach(function (li, i) {
      $("button", li).addEventListener("click", function () {
        if (i === index) { audio.paused ? audio.play() : audio.pause(); }
        else load(i, true);
      });
    });
    playBtn.addEventListener("click", function () {
      if (index < 0) return load(0, true);
      audio.paused ? audio.play().catch(function () {}) : audio.pause();
    });
    var prevBtn = $(".prev", root), nextBtn = $(".next", root);
    if (prevBtn) prevBtn.addEventListener("click", function () { load(index - 1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { load(index + 1, true); });
    audio.addEventListener("play", function () { setPlaying(true); });
    audio.addEventListener("pause", function () { setPlaying(false); });
    audio.addEventListener("error", function () { setPlaying(false); titleEl.textContent = "No se ha podido cargar el audio"; });
    audio.addEventListener("ended", function () { if (index < items.length - 1) load(index + 1, true); else setPlaying(false); });
    audio.addEventListener("timeupdate", function () {
      fill.style.width = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + "%";
      tCur.textContent = fmt(audio.currentTime);
      tDur.textContent = fmt(audio.duration);
    });
    bar.addEventListener("click", function (e) {
      if (!audio.duration) return;
      var r = bar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
    // "Escuchar el disco entero": reproduce todas las pistas seguidas desde la primera.
    var playAll = $("[data-play-all]", root);
    if (playAll) playAll.addEventListener("click", function () { load(0, true); });
  });

  /* ---------- Truco: "Te voy a leer la mente" ----------
     Seis figuras a la vista. Memorizas una. Cuando vuelven a aparecer,
     tu carta es la única que ha desaparecido. */
  $$("[data-trick]").forEach(function (root) {
    var stage = $(".trick-cards", root);
    var msg = $(".trick-msg", root);
    var btn = $(".trick-btn", root);
    var first = [["K", "♠"], ["Q", "♥"], ["J", "♣"], ["K", "♦"], ["Q", "♠"], ["J", "♥"]];
    var second = [["K", "♣"], ["Q", "♦"], ["J", "♠"], ["K", "♥"], ["Q", "♣"]];
    var names = { K: "Rey", Q: "Reina", J: "Jota" };
    var state = 0;
    function card(c, i) {
      var red = c[1] === "♥" || c[1] === "♦";
      return '<div class="pcard' + (red ? " red-suit" : "") + '" style="animation-delay:' + (i * 0.08) + 's" aria-label="' + names[c[0]] + " de " + c[1] + '">' +
        '<span class="corner tl">' + c[0] + "<span>" + c[1] + "</span></span>" +
        '<span class="face-letter">' + c[0] + "<small>" + c[1] + "</small></span>" +
        '<span class="corner br">' + c[0] + "<span>" + c[1] + "</span></span></div>";
    }
    function render(list) { stage.innerHTML = list.map(card).join(""); }
    function eye() {
      stage.innerHTML = '<svg class="eye-loader" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 50 C 25 15, 75 15, 95 50 C 75 85, 25 85, 5 50 Z"/><circle cx="50" cy="50" r="14"/><circle cx="50" cy="50" r="5" fill="currentColor"/></svg>';
    }
    function start() {
      state = 1;
      render(first);
      msg.textContent = "Elige mentalmente una de estas seis cartas. No la toques, no la digas. Solo recuérdala.";
      btn.textContent = "Ya la tengo en mente";
    }
    btn.addEventListener("click", function () {
      if (state === 0 || state === 3) return start();
      if (state === 1) {
        state = 2;
        btn.disabled = true;
        eye();
        msg.textContent = "Mírame a los ojos… concéntrate en tu carta… repítela en silencio…";
        setTimeout(function () {
          render(second);
          msg.innerHTML = "He sacado tu carta de la baraja. <strong class=\"text-blood\">Ya no está.</strong> ¿Me equivoco?";
          btn.disabled = false;
          btn.textContent = "Repetir el experimento";
          state = 3;
        }, 3200);
      }
    });
  });

  /* ---------- Cuenta atrás (666 segundos) ---------- */
  $$("[data-countdown]").forEach(function (root) {
    var total = parseInt(root.getAttribute("data-countdown"), 10) || 666;
    var key = "lp-countdown-" + total + "-" + location.pathname;
    var startAt = session && parseInt(session.getItem(key) || "0", 10);
    if (!startAt) { startAt = Date.now(); if (session) session.setItem(key, String(startAt)); }
    var mEl = $(".cd-min", root), sEl = $(".cd-sec", root), totalEl = $(".cd-total", root);
    function tick() {
      var left = Math.max(0, total - Math.floor((Date.now() - startAt) / 1000));
      if (mEl) mEl.textContent = String(Math.floor(left / 60)).padStart(2, "0");
      if (sEl) sEl.textContent = String(left % 60).padStart(2, "0");
      if (totalEl) totalEl.textContent = String(left);
      if (left === 0) { root.classList.add("is-over"); clearInterval(timer); var over = $("[data-countdown-over]"); if (over) over.hidden = false; }
    }
    var timer = setInterval(tick, 1000);
    tick();
  });

  /* ---------- Formularios de Brevo (envío sin salir de la página) ---------- */
  $$("form[data-brevo]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      var msg = $(".form-msg", form);
      var submit = $("[type=submit]", form);
      if (!form.checkValidity()) { form.reportValidity(); return; }
      submit.disabled = true;
      var original = submit.innerHTML;
      submit.textContent = "Enviando…";
      fetch(form.action, { method: "POST", body: new FormData(form), mode: "no-cors" })
        .then(function () {
          msg.className = "form-msg ok";
          msg.textContent = form.getAttribute("data-success") || "¡Recibido! Revisa tu correo electrónico (y la carpeta de spam).";
          form.reset();
        })
        .catch(function () {
          msg.className = "form-msg err";
          msg.textContent = "No se ha podido enviar. Inténtalo de nuevo o escríbenos por WhatsApp.";
        })
        .then(function () { submit.disabled = false; submit.innerHTML = original; });
    });
  });

  /* ---------- Año en el pie ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
