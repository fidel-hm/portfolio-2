/* =========================================================
   Scroll-Engine
   Gescrollt wird ein unsichtbarer Spacer. Sein Fortschritt wird
   geglättet und gegenläufig auf die beiden Spalten gelegt:
   links nach unten, rechts nach oben.
   ========================================================= */

(function () {
  'use strict';

  var spacer      = document.getElementById('spacer');
  var leftInner   = document.getElementById('colLeftInner');
  var rightInner  = document.getElementById('colRightInner');
  var leftCol     = document.getElementById('colLeft');
  var rightCol    = document.getElementById('colRight');
  var progressBar = document.getElementById('progressBar');
  var hint        = document.getElementById('hint');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Wie stark das Nachziehen ist: kleiner = träger/weicher.
  var EASE       = reduced ? 1 : 0.085;
  var SKEW_MAX   = 2.6;   // Grad, bei voller Geschwindigkeit
  var SCALE_MAX  = 0.045; // zusätzliche Stauchung bei Tempo
  var PARALLAX   = 0.05;  // Anteil der Bildhöhe, den das Motiv wandert

  var vh = 0;
  var distLeft = 0;
  var distRight = 0;
  var scrollRange = 1;
  var leftHeight = 0;   // gecacht: sonst würde jeder Frame Layout erzwingen

  var target = 0;   // Zielfortschritt 0..1 aus der echten Scrollposition
  var current = 0;  // geglätteter Fortschritt
  var velocity = 0;

  var frames = [];  // alle Bildkacheln inkl. gecachter Geometrie

  function collectFrames() {
    frames = [];
    [[leftInner, 'left'], [rightInner, 'right']].forEach(function (pair) {
      var inner = pair[0];
      var side = pair[1];
      Array.prototype.forEach.call(inner.querySelectorAll('.frame'), function (el) {
        frames.push({
          side: side,
          img: el.querySelector('img'),
          top: el.offsetTop,
          height: el.offsetHeight
        });
      });
    });
  }

  function measure() {
    vh = window.innerHeight;

    // Die Strecke, die jede Spalte zurücklegen muss, damit ihr
    // gegenüberliegendes Ende im Viewport ankommt.
    leftHeight = leftInner.offsetHeight;
    distLeft  = Math.max(0, leftHeight - vh);
    distRight = Math.max(0, rightInner.offsetHeight - vh);

    scrollRange = Math.max(distLeft, distRight, 1);
    spacer.style.height = (scrollRange + vh) + 'px';

    collectFrames();
    onScroll();
  }

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    target = Math.min(1, Math.max(0, y / scrollRange));
  }

  function render() {
    var prev = current;
    current += (target - current) * EASE;

    // Restweg unter Subpixel: einrasten, damit der Loop zur Ruhe kommt.
    if (Math.abs(target - current) < 0.00005) current = target;

    velocity = current - prev;

    var speed = Math.min(1, Math.abs(velocity) * 26);
    var dir = velocity >= 0 ? 1 : -1;

    var skew  = reduced ? 0 : dir * speed * SKEW_MAX;
    var scale = reduced ? 1 : 1 - speed * SCALE_MAX;

    var yLeft  =  current * distLeft;
    var yRight = -current * distRight;

    // Der Stack selbst wird nur verschoben. Gestaucht wird ausschließlich
    // das Motiv im Rahmen — eine Skalierung des Stacks würde bei mehreren
    // tausend Pixeln Höhe die Verankerung sichtbar verspringen lassen.
    leftInner.style.transform  = 'translate3d(0,' + yLeft.toFixed(2)  + 'px,0)';
    rightInner.style.transform = 'translate3d(0,' + yRight.toFixed(2) + 'px,0)';

    // Die Spalten kippen gegenläufig — verstärkt das Gefühl von Masse.
    leftCol.style.transform  = 'skewY(' + (-skew).toFixed(3) + 'deg)';
    rightCol.style.transform = 'skewY(' + skew.toFixed(3) + 'deg)';

    if (!reduced) parallax(yLeft, yRight, scale);

    progressBar.style.transform = 'scaleX(' + current.toFixed(4) + ')';

    if (hint) hint.classList.toggle('is-hidden', current > 0.015);

    requestAnimationFrame(render);
  }

  // Motiv innerhalb des Rahmens leicht gegen die Scrollrichtung schieben.
  function parallax(yLeft, yRight, scale) {
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (!f.img) continue;

      // Oberkante des Stacks im Viewport: links unten verankert, rechts oben.
      var base = f.side === 'left'
        ? vh - leftHeight + yLeft
        : yRight;

      var centerY = base + f.top + f.height / 2;

      // Nur rendern, was in der Nähe des Viewports liegt.
      if (centerY < -f.height || centerY > vh + f.height) continue;

      var p = (centerY - vh / 2) / vh;          // -1 .. 1 (grob)
      var shift = -p * f.height * PARALLAX;

      f.img.style.transform =
        'translate3d(0,' + shift.toFixed(2) + 'px,0) scale(1.12) scaleY(' +
        (1 / scale).toFixed(4) + ')';
    }
  }

  // Bilder können die Höhe verändern, sobald sie geladen sind.
  function watchImages() {
    Array.prototype.forEach.call(document.images, function (img) {
      if (img.complete) return;
      img.addEventListener('load', measure, { once: true });
      img.addEventListener('error', measure, { once: true });
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('orientationchange', measure);

  measure();
  watchImages();
  requestAnimationFrame(render);
})();
