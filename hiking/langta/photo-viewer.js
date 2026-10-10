(function () {
  'use strict';
  var modal = document.getElementById('lightbox');
  var stage = document.getElementById('lightbox-stage');
  var image = document.getElementById('lightbox-img');
  var closeButton = document.getElementById('lightbox-close');
  var previous = document.getElementById('lightbox-prev');
  var next = document.getElementById('lightbox-next');
  var count = document.getElementById('lightbox-count');
  var status = document.getElementById('lightbox-status');
  var gallery = [], index = 0, open = false, zoom = 1, panX = 0, panY = 0;
  var origin, saved, background = [], tapTimer = null, lastTap = null;
  var pointers = new Map(), gesture = null;

  function clearTap() {
    clearTimeout(tapTimer); tapTimer = null; lastTap = null;
  }
  function transform() {
    image.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
    stage.style.cursor = zoom > 1 ? 'grab' : 'zoom-in';
  }
  function clampPan() {
    var limitX = Math.max(0, (image.width * zoom - stage.clientWidth) / 2);
    var limitY = Math.max(0, (image.height * zoom - stage.clientHeight) / 2);
    panX = Math.max(-limitX, Math.min(limitX, panX));
    panY = Math.max(-limitY, Math.min(limitY, panY));
    transform();
  }
  function resetZoom() { zoom = 1; panX = panY = 0; transform(); }
  function display() {
    clearTap(); resetZoom();
    previous.disabled = index === 0;
    next.disabled = index === gallery.length - 1;
    count.textContent = (index + 1) + ' / ' + gallery.length;
    status.textContent = '正在加载照片…';
    image.alt = gallery[index].alt || '游记照片';
    image.src = gallery[index].getAttribute('data-full') || gallery[index].src;
  }
  function move(delta) {
    if (!open || index + delta < 0 || index + delta >= gallery.length) return;
    index += delta; display();
  }
  function launch(photo) {
    if (open) return;
    origin = photo;
    gallery = Array.from(photo.closest('section.day').querySelectorAll('.prose figure.ph img'));
    index = gallery.indexOf(photo);
    saved = { x: window.scrollX, y: window.scrollY,
      body: document.body.getAttribute('style'), root: document.documentElement.getAttribute('style') };
    document.body.style.position = 'fixed';
    document.body.style.top = -saved.y + 'px';
    document.body.style.left = -saved.x + 'px';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    background = Array.from(document.body.children).filter(function (el) { return el !== modal; })
      .map(function (el) { var old = el.hasAttribute('inert'); el.setAttribute('inert', ''); return { el: el, old: old }; });
    open = true; modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false');
    display(); closeButton.focus({ preventScroll: true });
  }
  function restoreStyle(el, value) {
    if (value === null) el.removeAttribute('style'); else el.setAttribute('style', value);
  }
  function close() {
    if (!open) return;
    clearTap(); pointers.clear(); gesture = null;
    open = false; modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true');
    image.removeAttribute('src'); status.textContent = '';
    background.forEach(function (item) { if (!item.old) item.el.removeAttribute('inert'); });
    restoreStyle(document.body, saved.body); restoreStyle(document.documentElement, saved.root);
    origin.focus({ preventScroll: true }); window.scrollTo(saved.x, saved.y);
  }
  function tap(x, y) {
    var time = Date.now();
    if (lastTap && time - lastTap.time < 330 && Math.hypot(x-lastTap.x, y-lastTap.y) < 40) {
      clearTap();
      if (zoom === 1) {
        var rect = image.getBoundingClientRect();
        zoom = 2.5;
        panX = -(x - rect.left - rect.width / 2) * (zoom - 1);
        panY = -(y - rect.top - rect.height / 2) * (zoom - 1);
        clampPan();
      } else resetZoom();
    } else {
      clearTap(); lastTap = { time: time, x: x, y: y };
      tapTimer = setTimeout(close, 330);
    }
  }
  stage.addEventListener('pointerdown', function (event) {
    if (!open || event.button > 0) return;
    event.preventDefault();
    // Pause pending single-tap close while a possible second tap is held.
    clearTimeout(tapTimer); tapTimer = null;
    pointers.set(event.pointerId, true);
    if (pointers.size > 1) { clearTap(); if (gesture) gesture.cancelled = true; return; }
    stage.setPointerCapture(event.pointerId);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
      panX: panX, panY: panY, moved: false, cancelled: false };
  });
  stage.addEventListener('pointermove', function (event) {
    if (!gesture || gesture.id !== event.pointerId || gesture.cancelled) return;
    var dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 10) { gesture.moved = true; clearTap(); }
    if (zoom > 1) { panX = gesture.panX + dx; panY = gesture.panY + dy; clampPan(); }
  });
  stage.addEventListener('pointerup', function (event) {
    pointers.delete(event.pointerId);
    if (!gesture || gesture.id !== event.pointerId) return;
    var finished = gesture; gesture = null;
    if (finished.cancelled) return;
    var dx = event.clientX - finished.x, dy = event.clientY - finished.y;
    if (Math.hypot(dx, dy) > 10) finished.moved = true;
    if (finished.moved) {
      clearTap();
      if (zoom === 1 && Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
    } else tap(event.clientX, event.clientY);
  });
  function cancelGesture(event) {
    pointers.delete(event.pointerId); clearTap();
    if (gesture && gesture.id === event.pointerId) gesture = null;
  }
  stage.addEventListener('pointercancel', cancelGesture);
  stage.addEventListener('lostpointercapture', function (event) {
    if (gesture && gesture.id === event.pointerId) cancelGesture(event);
  });
  stage.addEventListener('dragstart', function (event) { event.preventDefault(); });
  stage.addEventListener('contextmenu', function (event) { event.preventDefault(); });
  modal.addEventListener('wheel', function (event) { event.preventDefault(); }, { passive: false });
  modal.addEventListener('touchmove', function (event) { event.preventDefault(); }, { passive: false });
  closeButton.addEventListener('click', close);
  previous.addEventListener('click', function () { clearTap(); move(-1); });
  next.addEventListener('click', function () { clearTap(); move(1); });
  image.addEventListener('load', function () { if (open) { status.textContent = ''; clampPan(); } });
  image.addEventListener('error', function () { if (open) status.textContent = '照片加载失败，请切换照片或关闭后重试'; });
  window.addEventListener('resize', function () { if (open) clampPan(); });
  document.querySelectorAll('.prose figure.ph img').forEach(function (photo) {
    photo.setAttribute('role', 'button'); photo.setAttribute('tabindex', '0');
    photo.setAttribute('aria-haspopup', 'dialog');
    if (!photo.getAttribute('alt')) photo.setAttribute('aria-label', '打开游记照片');
    photo.addEventListener('click', function () { launch(photo); });
    photo.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); launch(photo); }
    });
  });
  document.addEventListener('keydown', function (event) {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); clearTap(); move(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Tab') {
      var buttons = [closeButton, previous, next].filter(function (button) { return !button.disabled; });
      var at = buttons.indexOf(document.activeElement);
      event.preventDefault(); buttons[(at + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    } else if ([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowUp', 'ArrowDown'].indexOf(event.key) >= 0) event.preventDefault();
  });
}());
