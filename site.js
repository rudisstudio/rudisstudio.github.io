(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rain over the hero, with a lightning flash now and then.
  var canvas = document.getElementById("rain");
  var flash = document.getElementById("flash");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var drops = [];
    var w = 0, h = 0, dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(220, w * h / 6000));
      drops = [];
      for (var i = 0; i < count; i++) drops.push(newDrop(true));
    }
    function newDrop(anywhere) {
      var z = Math.random();
      return {
        x: Math.random() * (w + 200) - 100,
        y: anywhere ? Math.random() * h : -40 - Math.random() * 200,
        len: 10 + z * 22,
        speed: 6 + z * 10,
        alpha: .08 + z * .22
      };
    }
    var last = 0, visible = true;
    function frame(t) {
      if (!visible) return;
      if (t - last > 33) {
        last = t;
        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = "round";
        for (var i = 0; i < drops.length; i++) {
          var d = drops[i];
          ctx.strokeStyle = "rgba(220,235,250," + d.alpha + ")";
          ctx.lineWidth = d.alpha > .2 ? 1.4 : 1;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * .18, d.y + d.len);
          ctx.stroke();
          d.y += d.speed; d.x -= d.speed * .18;
          if (d.y > h) drops[i] = newDrop(false);
        }
      }
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (e) {
      var was = visible;
      visible = e[0].isIntersecting && !document.hidden;
      if (visible && !was) requestAnimationFrame(frame);
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", function () {
      var was = visible;
      visible = !document.hidden;
      if (visible && !was) requestAnimationFrame(frame);
    });
    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(frame);

    (function strike() {
      setTimeout(function () {
        if (visible) {
          flash.classList.remove("on");
          void flash.offsetWidth;
          flash.classList.add("on");
        }
        strike();
      }, 7000 + Math.random() * 9000);
    })();
  }

  // Phone screens crossfade.
  var screens = document.querySelectorAll("#screens img");
  var dots = document.getElementById("dots");
  var current = 0, timer = null;
  function show(i) {
    screens[current].classList.remove("on");
    dots.children[current].classList.remove("on");
    current = i;
    screens[current].classList.add("on");
    dots.children[current].classList.add("on");
  }
  function auto() {
    clearInterval(timer);
    if (!reduce) timer = setInterval(function () { show((current + 1) % screens.length); }, 3800);
  }
  screens.forEach(function (img, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Show screen " + (i + 1));
    if (i === 0) b.className = "on";
    b.addEventListener("click", function () { show(i); auto(); });
    dots.appendChild(b);
  });
  auto();

  // Fade sections in as they scroll into view.
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { ro.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }
})();
