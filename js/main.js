/* =========================================================
   Scroll-Engine

   Gescrollt wird ein unsichtbarer Spacer. Sein Fortschritt wird
   geglättet und gegenläufig auf die beiden Spalten gelegt:
   links nach unten, rechts nach oben.

   Panorama-Paare (zwei Hälften desselben Bildes, je eine pro Spalte)
   werden vor dem ersten Frame per Padding so ausgerichtet, dass beide
   Hälften bei exakt demselben Fortschritt in der Viewport-Mitte
   ankommen. Dort ziehen sie sich magnetisch zusammen.
   ========================================================= */

(function () {
  'use strict';

  var spacer      = document.getElementById('spacer');
  var leftInner   = document.getElementById('colLeftInner');
  var rightInner  = document.getElementById('colRightInner');
  var leftCol     = document.getElementById('colLeft');
  var rightCol    = document.getElementById('colRight');
  var progressBar = document.getElementById('progressBar');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var EASE      = reduced ? 1 : 0.085; // Trägheit: kleiner = weicher
  var SKEW_MAX  = 2.6;                 // Grad bei voller Geschwindigkeit
  var SCALE_MAX = 0.045;               // Streckung der Motive bei Tempo
  var PARALLAX  = 0.05;                // Eigenbewegung im Rahmen

  // --- Panorama-Magnet ---
  var SNAP_RANGE = 0.045;              // Fortschritts-Radius der Anziehung
  var SNAP_PULL  = reduced ? 0 : 0.13; // Stärke des Magneten
  var SNAP_DRAG  = 0.78;               // wie stark das Scrollen dabei zäh wird

  var vh = 0, leftHeight = 0, rightHeight = 0;
  var dist = 1, scrollRange = 1, splitPx = 0;

  var target = 0, current = 0, velocity = 0;

  var frames = [];  // Bildkacheln mit gecachter Geometrie
  var panos  = [];  // Paare: { left, right, snap, ... }

  var padTop, padBottom; // Ausgleich, um beide Stacks gleich hoch zu machen

  function smoothstep(t) {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
  }

  /* ---------- Layout ---------- */

  function ensurePads() {
    if (padTop) return;
    // Die Pads sitzen am jeweils ÄUSSEREN Ende der Stacks. Dort verändern
    // sie die Gesamthöhe, ohne den Abstand der Panoramen zum jeweiligen
    // Startzustand zu verschieben — genau das brauchen wir.
    padTop = document.createElement('div');
    padBottom = document.createElement('div');
    padTop.setAttribute('aria-hidden', 'true');
    padBottom.setAttribute('aria-hidden', 'true');
    leftInner.insertBefore(padTop, leftInner.firstChild);
    rightInner.appendChild(padBottom);
  }

  // Textblöcke so hoch machen, dass vom benachbarten Bild genau
  // --peek-ratio hereinragt. Weil die Bilder unterschiedliche
  // Seitenverhältnisse haben, geht das nur rechnerisch.
  function sizeBlocks() {
    var cs = getComputedStyle(document.documentElement);
    var peek = parseFloat(cs.getPropertyValue('--peek-ratio')) || 0.6667;
    var gap = parseFloat(getComputedStyle(leftInner).rowGap) || 0;

    var title = leftInner.querySelector('.block--title');
    var about = rightInner.querySelector('.block--about');

    // Links steht das Nachbarbild ÜBER dem Titel, rechts UNTER dem Text.
    var nbLeft = title && title.previousElementSibling;
    var nbRight = about && about.nextElementSibling;

    if (title && nbLeft) {
      title.style.height =
        Math.max(120, vh - gap - peek * nbLeft.offsetHeight) + 'px';
    }
    if (about && nbRight) {
      about.style.height =
        Math.max(120, vh - gap - peek * nbRight.offsetHeight) + 'px';
    }
  }

  function collectPanos() {
    panos = [];
    var lefts = leftInner.querySelectorAll('.frame--pano[data-pano]');
    for (var i = 0; i < lefts.length; i++) {
      var key = lefts[i].getAttribute('data-pano');
      var right = rightInner.querySelector(
        '.frame--pano[data-pano="' + key + '"]');
      if (right) panos.push({ left: lefts[i], right: right, snap: -1 });
    }
  }

  /* Richtet jedes Panorama-Paar aus.

     Damit beide Hälften beim selben Fortschritt in der Mitte ankommen,
     muss gelten: der Abstand der linken Hälfte zum UNTEREN Stackende
     entspricht dem Abstand der rechten Hälfte zum OBEREN Stackende.
     (Links ist der Stack unten verankert, rechts oben — jede Spalte
     startet also an genau diesem Ende.)

     Die Differenz gleichen wir mit einem Margin aus. Links muss es ein
     margin-bottom sein: ein margin-top würde den Abstand nach unten
     nicht verändern und damit wirkungslos bleiben. */
  function alignPanos() {
    for (var i = 0; i < panos.length; i++) {
      var p = panos[i];
      p.left.style.marginBottom = '';
      p.right.style.marginTop = '';
    }

    for (var j = 0; j < panos.length; j++) {
      var pair = panos[j];
      // Nach jedem Paar frisch messen — ein gesetzter Margin verschiebt
      // die Abstände aller weiter außen liegenden Paare mit.
      var fromBottomLeft = leftInner.offsetHeight
        - pair.left.offsetTop - pair.left.offsetHeight;
      var fromTopRight = pair.right.offsetTop;

      var delta = fromBottomLeft - fromTopRight;
      if (delta > 0.5) {
        pair.right.style.marginTop = delta + 'px';
      } else if (delta < -0.5) {
        pair.left.style.marginBottom = (-delta) + 'px';
      }
    }
  }

  function measure() {
    vh = window.innerHeight;
    ensurePads();

    padTop.style.height = '0px';
    padBottom.style.height = '0px';

    sizeBlocks();
    collectPanos();
    alignPanos();

    // Beide Stacks auf dieselbe Höhe bringen, damit sie sich mit
    // identischem Tempo gegenläufig bewegen.
    var hl = leftInner.offsetHeight;
    var hr = rightInner.offsetHeight;
    if (hl < hr) padTop.style.height = (hr - hl) + 'px';
    else if (hr < hl) padBottom.style.height = (hl - hr) + 'px';

    leftHeight = leftInner.offsetHeight;
    rightHeight = rightInner.offsetHeight;

    dist = Math.max(1, Math.max(leftHeight, rightHeight) - vh);
    scrollRange = dist;
    spacer.style.height = (scrollRange + vh) + 'px';

    // Waagerechter Abstand der beiden Spalten — so weit muss jede
    // Panorama-Hälfte wandern, damit die Naht schließt.
    splitPx = rightCol.getBoundingClientRect().left
            - leftCol.getBoundingClientRect().right;

    collectFrames();
    computeSnaps();
    onScroll();
  }

  function collectFrames() {
    frames = [];
    [[leftInner, 'left'], [rightInner, 'right']].forEach(function (pair) {
      Array.prototype.forEach.call(
        pair[0].querySelectorAll('.frame'), function (el) {
          frames.push({
            side: pair[1],
            pano: el.classList.contains('frame--pano'),
            img: el.querySelector('img'),
            top: el.offsetTop,
            height: el.offsetHeight
          });
        });
    });
  }

  // Fortschritt, bei dem eine Panorama-Hälfte senkrecht mittig steht.
  function computeSnaps() {
    for (var i = 0; i < panos.length; i++) {
      var p = panos[i];
      p.topL = p.left.offsetTop;
      p.topR = p.right.offsetTop;
      p.h = p.left.offsetHeight;

      var pL = (leftHeight - vh / 2 - p.topL - p.h / 2) / dist;
      var pR = (p.topR + p.h / 2 - vh / 2) / dist;

      // Nach alignPanos() sind beide Werte praktisch gleich; der
      // Mittelwert fängt den Rest an Rundung ab.
      p.snap = (pL + pR) / 2;
      p.valid = p.snap > 0.02 && p.snap < 0.98;
    }
  }

  /* ---------- Scroll ---------- */

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    target = Math.min(1, Math.max(0, y / scrollRange));
  }

  function render() {
    var prev = current;

    // Stärkster Magnet in Reichweite bestimmt Trägheit und Anziehung.
    var magnet = 0, snapTo = 0;
    for (var i = 0; i < panos.length; i++) {
      var p = panos[i];
      if (!p.valid) continue;
      var m = 1 - smoothstep(Math.abs(current - p.snap) / SNAP_RANGE);
      if (m > magnet) { magnet = m; snapTo = p.snap; }
      p.magnet = m;
    }

    // In der Nähe der Naht wird das Scrollen zäh ...
    var ease = EASE * (1 - magnet * SNAP_DRAG);
    current += (target - current) * ease;
    // ... und die Hälften ziehen sich zusätzlich zueinander.
    if (magnet > 0) current += (snapTo - current) * magnet * SNAP_PULL;

    if (Math.abs(target - current) < 0.00005 && magnet === 0) current = target;

    velocity = current - prev;

    var speed = Math.min(1, Math.abs(velocity) * 26);
    var dir = velocity >= 0 ? 1 : -1;
    var scale = reduced ? 1 : 1 - speed * SCALE_MAX;

    // Beim Zusammenschnappen darf nichts mehr kippen, sonst knickt
    // die Naht sichtbar ab.
    var skew = reduced ? 0 : dir * speed * SKEW_MAX * (1 - magnet);

    var yLeft  =  current * dist;
    var yRight = -current * dist;

    leftInner.style.transform  = 'translate3d(0,' + yLeft.toFixed(2)  + 'px,0)';
    rightInner.style.transform = 'translate3d(0,' + yRight.toFixed(2) + 'px,0)';

    leftCol.style.transform  = 'skewY(' + (-skew).toFixed(3) + 'deg)';
    rightCol.style.transform = 'skewY(' + skew.toFixed(3) + 'deg)';

    if (!reduced) parallax(yLeft, yRight, scale);
    snapPanos(yLeft, yRight);

    progressBar.style.transform = 'scaleX(' + current.toFixed(4) + ')';

    requestAnimationFrame(render);
  }

  // Motiv im Rahmen leicht gegen die Scrollrichtung schieben.
  // Panoramen bleiben außen vor: dort muss das Motiv exakt sitzen.
  function parallax(yLeft, yRight, scale) {
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (!f.img || f.pano) continue;

      var base = f.side === 'left' ? vh - leftHeight + yLeft : yRight;
      var centerY = base + f.top + f.height / 2;
      if (centerY < -f.height || centerY > vh + f.height) continue;

      var shift = -((centerY - vh / 2) / vh) * f.height * PARALLAX;

      f.img.style.transform =
        'translate3d(0,' + shift.toFixed(2) + 'px,0) scale(1.12) scaleY(' +
        (1 / scale).toFixed(4) + ')';
    }
  }

  // Die beiden Hälften aufeinander zu schieben und die letzte
  // Höhendifferenz ausgleichen, damit die Naht sauber schließt.
  function snapPanos(yLeft, yRight) {
    for (var i = 0; i < panos.length; i++) {
      var p = panos[i];
      var m = p.magnet || 0;

      if (m <= 0.0005) {
        p.left.style.transform = '';
        p.right.style.transform = '';
        continue;
      }

      var x = m * (splitPx / 2);

      var centerL = vh - leftHeight + yLeft + p.topL + p.h / 2;
      var centerR = yRight + p.topR + p.h / 2;
      var fixL = m * (vh / 2 - centerL);
      var fixR = m * (vh / 2 - centerR);

      p.left.style.transform =
        'translate3d(' + x.toFixed(2) + 'px,' + fixL.toFixed(2) + 'px,0)';
      p.right.style.transform =
        'translate3d(' + (-x).toFixed(2) + 'px,' + fixR.toFixed(2) + 'px,0)';
    }
  }

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
