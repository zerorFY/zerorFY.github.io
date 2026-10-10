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
  if (!modal || !stage || !image || !closeButton || !previous || !next || !count || !status) {
    console.warn('Hiking photo viewer: required viewer markup is missing. See /hiking/photo-interactions/'); return;
  }
  if (modal.hasAttribute('data-hiking-viewer-ready')) return;
  modal.setAttribute('data-hiking-viewer-ready', '1.0.0');
  var photoSelector = 'img[data-hiking-photo], .prose figure.ph img';
  function photoGroup(photo) {
    return photo.closest('[data-photo-gallery]') || photo.closest('section.day') || document;
  }
  var gallery = [], index = 0, open = false, zoom = 1, panX = 0, panY = 0;
  var origin, saved, background = [], tapTimer = null, lastTap = null;
  var pointers = new Map(), gesture = null, pinch = null, suppressUntilLift = false;
  var frame = document.createElement('div'), neighbor = null, neighborDirection = 0;
  var settleTimer = null, animating = false;
  frame.className = 'lightbox-photo';
  stage.appendChild(frame); frame.appendChild(image);

  function resetSlides() {
    clearTimeout(settleTimer); settleTimer = null; animating = false;
    frame.style.transition = ''; frame.style.transform = 'translate(0px, 0px)';
    if (neighbor) neighbor.remove();
    neighbor = null; neighborDirection = 0; modal.style.backgroundColor = '';
  }
  function adjacent(direction) {
    if (neighborDirection === direction && neighbor) return;
    if (neighbor) neighbor.remove();
    neighbor = null; neighborDirection = 0;
    if (index + direction < 0 || index + direction >= gallery.length) return;
    var photo = gallery[index + direction], preview = document.createElement('img');
    neighbor = document.createElement('div'); neighbor.className = 'lightbox-photo lightbox-neighbor';
    neighbor.setAttribute('aria-hidden', 'true'); preview.alt = '';
    preview.src = photo.getAttribute('data-full') || photo.src;
    neighbor.appendChild(preview); stage.appendChild(neighbor); neighborDirection = direction;
    neighbor.style.transform = 'translate(' + direction * stage.clientWidth + 'px, 0px)';
  }
  function transition(done) {
    clearTap(); animating = true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done(); return;
    }
    // Flush the finger-following position before setting the settle target.
    void frame.offsetWidth;
    frame.style.transition = 'transform 180ms ease-out';
    if (neighbor) neighbor.style.transition = 'transform 180ms ease-out';
    settleTimer = setTimeout(function () { settleTimer = null; done(); }, 180);
  }
  function snapBack() {
    transition(resetSlides);
    frame.style.transform = 'translate(0px, 0px)';
    if (neighbor) neighbor.style.transform = 'translate(' + neighborDirection * stage.clientWidth + 'px, 0px)';
    modal.style.backgroundColor = '';
  }

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
    resetSlides(); clearTap(); resetZoom();
    previous.disabled = index === 0;
    next.disabled = index === gallery.length - 1;
    count.textContent = (index + 1) + ' / ' + gallery.length;
    status.textContent = '正在加载照片…';
    image.alt = gallery[index].alt || '游记照片';
    image.src = gallery[index].getAttribute('data-full') || gallery[index].src;
  }
  function move(delta) {
    if (!open || animating) return;
    pointers.clear(); gesture = pinch = null; suppressUntilLift = false;
    if (index + delta < 0 || index + delta >= gallery.length) { snapBack(); return; }
    resetZoom(); adjacent(delta);
    transition(function () { index += delta; display(); });
    if (!animating) return;
    frame.style.transform = 'translate(' + -delta * stage.clientWidth + 'px, 0px)';
    neighbor.style.transform = 'translate(0px, 0px)';
  }
  function dismissDown() {
    transition(close);
    if (!animating) return;
    frame.style.transform = 'translate(0px, ' + stage.clientHeight + 'px)';
    modal.style.backgroundColor = 'transparent';
  }
  function launch(photo) {
    if (open) return;
    origin = photo;
    var group = photoGroup(photo);
    gallery = Array.from(group.querySelectorAll(photoSelector)).filter(function (candidate) { return photoGroup(candidate) === group; });
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
    resetSlides(); clearTap(); pointers.clear(); gesture = pinch = null; suppressUntilLift = false;
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
    if (animating) return;
    // Pause pending single-tap close while a possible second tap is held.
    clearTimeout(tapTimer); tapTimer = null;
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size > 1) {
      clearTap(); gesture = null; suppressUntilLift = true; resetSlides();
      if (!pinch) {
        var ids = Array.from(pointers.keys()).slice(0, 2), a = pointers.get(ids[0]), b = pointers.get(ids[1]);
        var rect = stage.getBoundingClientRect();
        pinch = { ids: ids, distance: Math.max(1, Math.hypot(a.x-b.x, a.y-b.y)), zoom: zoom,
          centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2,
          x: (a.x+b.x)/2 - rect.left - rect.width/2, y: (a.y+b.y)/2 - rect.top - rect.height/2,
          panX: panX, panY: panY };
      }
      return;
    }
    if (suppressUntilLift) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
      panX: panX, panY: panY, moved: false, axis: null };
  });
  stage.addEventListener('pointermove', function (event) {
    if (animating || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch) {
      var a = pointers.get(pinch.ids[0]), b = pointers.get(pinch.ids[1]);
      if (!a || !b) return;
      zoom = Math.max(1, Math.min(5, pinch.zoom * Math.hypot(a.x-b.x, a.y-b.y) / pinch.distance));
      var ratio = zoom / pinch.zoom;
      panX = (a.x+b.x)/2 - pinch.centerX - (pinch.x-pinch.panX) * ratio;
      panY = (a.y+b.y)/2 - pinch.centerY - (pinch.y-pinch.panY) * ratio;
      clampPan(); return;
    }
    if (suppressUntilLift || !gesture || gesture.id !== event.pointerId) return;
    var dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 10) { gesture.moved = true; clearTap(); }
    if (zoom > 1) { panX = gesture.panX + dx; panY = gesture.panY + dy; clampPan(); return; }
    if (!gesture.moved) return;
    if (!gesture.axis) {
      if (Math.abs(dx) > Math.abs(dy) * 1.25) gesture.axis = 'horizontal';
      else if (Math.abs(dy) > Math.abs(dx) * 1.25) gesture.axis = 'vertical';
    }
    if (gesture.axis === 'horizontal') {
      adjacent(dx < 0 ? 1 : -1);
      var offset = neighbor ? dx : dx * .22;
      frame.style.transform = 'translate(' + offset + 'px, 0px)';
      if (neighbor) neighbor.style.transform = 'translate(' + (offset + neighborDirection * stage.clientWidth) + 'px, 0px)';
    } else if (gesture.axis === 'vertical') {
      var down = Math.max(0, dy);
      frame.style.transform = 'translate(0px, ' + down + 'px)';
      modal.style.backgroundColor = 'rgba(0,0,0,' + (.96 * (1 - Math.min(.55, down/stage.clientHeight))) + ')';
    }
  });
  stage.addEventListener('pointerup', function (event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (pinch && pinch.ids.indexOf(event.pointerId) >= 0) pinch = null;
    if (suppressUntilLift) {
      if (!pointers.size) suppressUntilLift = false;
      clearTap(); return;
    }
    if (!gesture || gesture.id !== event.pointerId) return;
    var finished = gesture; gesture = null;
    var dx = event.clientX - finished.x, dy = event.clientY - finished.y;
    if (Math.hypot(dx, dy) > 10) finished.moved = true;
    if (finished.moved) {
      clearTap();
      if (zoom > 1) return;
      if (finished.axis === 'horizontal' && Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
      else if (finished.axis === 'vertical' && dy > Math.min(120, Math.max(70, stage.clientHeight * .12)) && dy > Math.abs(dx) * 1.25) dismissDown();
      else snapBack();
    } else tap(event.clientX, event.clientY);
  });
  function cancelGesture(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId); clearTap();
    if (pinch && pinch.ids.indexOf(event.pointerId) >= 0) { pinch = null; suppressUntilLift = true; }
    if (gesture && gesture.id === event.pointerId) { gesture = null; snapBack(); }
    if (!pointers.size) suppressUntilLift = false;
  }
  stage.addEventListener('pointercancel', cancelGesture);
  stage.addEventListener('lostpointercapture', function (event) {
    if (pointers.has(event.pointerId)) cancelGesture(event);
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
  document.querySelectorAll(photoSelector).forEach(function (photo) {
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
