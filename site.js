(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  // Nav turns solid once the hero scrolls away.
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var hero = document.getElementById("hero");
  var heroBg = document.getElementById("heroBg");
  var floaters = Array.prototype.slice.call(document.querySelectorAll(".floater"));
  // Floating scenes move with the pointer and drift up faster than the page as it scrolls.
  function placeFloater(f) {
    var d = parseFloat(f.dataset.depth), y = Math.min(window.scrollY, window.innerHeight);
    f.style.translate = (f._mx || 0) + "px " + ((f._my || 0) - y * .35 * d) + "px";
  }

  // Rain: streaks that lean towards the pointer, splashes at the bottom, lightning now and then.
  var canvas = document.getElementById("rain");
  var flash = document.getElementById("flash");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var drops = [], splashes = [];
    var w = 0, h = 0, wind = 0, targetWind = 0, running = true, last = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(320, w * h / 4500));
      drops = [];
      for (var i = 0; i < n; i++) drops.push(drop(true));
    }
    function drop(anywhere) {
      var z = Math.random();
      return { x: Math.random() * (w + 300) - 150, y: anywhere ? Math.random() * h : -50 - Math.random() * h * .5,
               len: 12 + z * 26, speed: 9 + z * 14, a: .07 + z * .28, z: z };
    }
    function frame(t) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (t - last < 30) return;
      last = t;
      wind += (targetWind - wind) * .05;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i], slant = .12 + wind;
        ctx.strokeStyle = "rgba(215,232,250," + d.a + ")";
        ctx.lineWidth = .8 + d.z * .9;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * slant, d.y + d.len);
        ctx.stroke();
        d.y += d.speed; d.x -= d.speed * slant;
        if (d.y > h - 4) {
          if (d.z > .55 && splashes.length < 60) splashes.push({ x: d.x, y: h - 4 - Math.random() * 30, r: 0, a: .5 * d.z });
          drops[i] = drop(false);
        }
      }
      for (var j = splashes.length - 1; j >= 0; j--) {
        var s = splashes[j];
        s.r += 1.4; s.a -= .035;
        if (s.a <= 0) { splashes.splice(j, 1); continue; }
        ctx.strokeStyle = "rgba(215,232,250," + s.a + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r, s.r * .3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    new IntersectionObserver(function (e) {
      var was = running;
      running = e[0].isIntersecting;
      if (running && !was) requestAnimationFrame(frame);
    }).observe(canvas);
    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(frame);

    function strike() {
      if (!running) return;
      flash.classList.remove("on");
      void flash.offsetWidth;
      flash.classList.add("on");
    }
    (function loop() { setTimeout(function () { strike(); loop(); }, 6000 + Math.random() * 9000); })();
    setTimeout(strike, 1800);

    if (fine) {
      hero.addEventListener("mousemove", function (e) {
        var nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
        targetWind = -nx * .5;
        heroBg.style.translate = (nx * -24) + "px " + (ny * -16) + "px";
        floaters.forEach(function (f) {
          var d = parseFloat(f.dataset.depth);
          f._mx = nx * 60 * d; f._my = ny * 40 * d;
          placeFloater(f);
        });
      });
      hero.addEventListener("mouseleave", function () {
        targetWind = 0; heroBg.style.translate = "0 0";
        floaters.forEach(function (f) { f._mx = 0; f._my = 0; placeFloater(f); });
      });
    }

    // Tap or click anywhere in the hero: a ripple, like a drop on water.
    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a")) return;
      var r = hero.getBoundingClientRect();
      for (var k = 0; k < 2; k++) {
        var el = document.createElement("span");
        el.className = "ripple";
        el.style.left = (e.clientX - r.left) + "px";
        el.style.top = (e.clientY - r.top) + "px";
        el.style.animationDelay = (k * .18) + "s";
        hero.appendChild(el);
        el.addEventListener("animationend", function () { this.remove(); });
      }
    });
  }

  // Hero parallax on scroll.
  if (!reduce) {
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = "translate3d(0," + (y * .3) + "px,0)";
        floaters.forEach(placeFloater);
      }
    }, { passive: true });
  }

  // Cards: tilt towards the pointer, with a light that follows it.
  if (fine && !reduce) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = "rotateX(" + ((.5 - y) * 10) + "deg) rotateY(" + ((x - .5) * 12) + "deg)";
        card.style.setProperty("--mx", (x * 100) + "%");
        card.style.setProperty("--my", (y * 100) + "%");
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  // Rainlit card cycles through its four scenes.
  document.querySelectorAll("[data-scenes]").forEach(function (card) {
    var imgs = card.querySelectorAll(".card-art img"), i = 0;
    if (reduce || imgs.length < 2) return;
    setInterval(function () {
      imgs[i].classList.remove("on");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("on");
    }, 3200);
  });

  // Staggered reveal on scroll.
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sibs = Array.prototype.filter.call(e.target.parentNode.children, function (c) { return c.classList.contains("reveal"); });
        e.target.style.setProperty("--d", (sibs.indexOf(e.target) * .12) + "s");
        e.target.classList.add("in");
        ro.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (el) { ro.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }
})();
