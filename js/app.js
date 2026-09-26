/* =========================================================
   WebGIS Thạnh Phước – app.js
   Bảo mật: không dùng innerHTML / eval với dữ liệu; mọi nội dung hiển thị
   đi qua textContent. Không có script inline (CSP script-src 'self').
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Chống nhúng iframe (clickjacking) ---------- */
  try {
    if (window.top !== window.self) { window.top.location = window.self.location; }
  } catch (e) {
    document.documentElement.textContent = '';
    return;
  }
  if (location.protocol === 'file:') { document.documentElement.classList.add('no-mask'); }

  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = function () { return window.matchMedia('(max-width: 640px)').matches; };

  /* ---------- Cấu hình ---------- */
  var HOME_BOUNDS = [[10.0737, 106.6358], [10.1997, 106.7443]]; // phạm vi toàn xã (từ dữ liệu THUA_DAT)
  var ESRI_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  var BASE_BG = { satellite: '#2b2f2e', light: '#ffffff', dark: '#000000' };
  var MAX_LEN = 80;

  /* ---------- Tiện ích ---------- */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  }
  function clean(s) { return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, MAX_LEN).trim(); }
  function fmtNum(n, d) {
    if (n == null || isNaN(n)) { return '—'; }
    return Number(n).toLocaleString('vi-VN', { maximumFractionDigits: d == null ? 1 : d });
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text != null) { e.textContent = text; }
    return e;
  }
  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3800);
  }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { rej(new Error('Không tải được ' + src)); };
      document.head.appendChild(s);
    });
  }
  function setProgress(p, text) {
    $('loaderBar').style.width = Math.max(8, Math.min(100, p)) + '%';
    if (text) { $('loaderText').textContent = text; }
  }

  /* ---------- VN-2000 (TM-3°, kinh tuyến trục 105°45', k=0.9999) ---------- */
  var VN = (function () {
    var A = 6378137, F = 1 / 298.257223563, E2 = F * (2 - F), EP2 = E2 / (1 - E2);
    var K0 = 0.9999, L0 = 105.75 * Math.PI / 180, FE = 500000;
    var e4 = E2 * E2, e6 = e4 * E2;
    function merid(p) {
      return A * ((1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p
        - (3 * E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p)
        + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p)
        - (35 * e6 / 3072) * Math.sin(6 * p));
    }
    return {
      forward: function (lat, lon) {
        var p = lat * Math.PI / 180, l = lon * Math.PI / 180;
        var sp = Math.sin(p), cp = Math.cos(p), tp = Math.tan(p);
        var N = A / Math.sqrt(1 - E2 * sp * sp), T = tp * tp, C = EP2 * cp * cp, a = (l - L0) * cp;
        var x = K0 * N * (a + (1 - T + C) * Math.pow(a, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * EP2) * Math.pow(a, 5) / 120) + FE;
        var y = K0 * (merid(p) + N * tp * (a * a / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(a, 4) / 24
          + (61 - 58 * T + T * T + 600 * C - 330 * EP2) * Math.pow(a, 6) / 720));
        return { E: x, N: y };
      },
      inverse: function (E, Nn) {
        var M = Nn / K0, mu = M / (A * (1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
        var s = Math.sqrt(1 - E2), e1 = (1 - s) / (1 + s);
        var p1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
          + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
          + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu)
          + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
        var sp = Math.sin(p1), cp = Math.cos(p1), tp = Math.tan(p1);
        var N1 = A / Math.sqrt(1 - E2 * sp * sp), T1 = tp * tp, C1 = EP2 * cp * cp;
        var R1 = A * (1 - E2) / Math.pow(1 - E2 * sp * sp, 1.5), D = (E - FE) / (N1 * K0);
        var lat = p1 - (N1 * tp / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * Math.pow(D, 4) / 24
          + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * Math.pow(D, 6) / 720);
        var lon = L0 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6
          + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * Math.pow(D, 5) / 120) / cp;
        return { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI };
      }
    };
  })();

  /* ---------- Bản đồ ---------- */
  var map = L.map('map', {
    zoomControl: false, attributionControl: true, preferCanvas: true,
    minZoom: 10, maxZoom: 22, zoomSnap: 0.25, maxBoundsViscosity: 0.7, zoomDelta: 1, wheelPxPerZoomLevel: 90, doubleClickZoom: true
  });
  map.attributionControl.setPrefix(false);
  map.setMaxBounds(L.latLngBounds(HOME_BOUNDS).pad(1.2));
  map.fitBounds(HOME_BOUNDS, { paddingTopLeft: [(document.body.classList.contains('panel-open') && !isMobile()) ? Math.min(447, Math.max(340, window.innerWidth * 0.233)) + 70 : 20, 20], paddingBottomRight: [110, 20] });
  L.control.scale({ metric: true, imperial: false, position: 'bottomleft', maxWidth: 140 }).addTo(map);

  map.createPane('paneThua').style.zIndex = 410;
  map.createPane('paneQH').style.zIndex = 420;
  map.createPane('paneSel').style.zIndex = 450;
  map.createPane('paneMeasure').style.zIndex = 460;
  var thuaRenderer = L.canvas({ pane: 'paneThua', padding: 0.4 });
  var qhRenderer = L.canvas({ pane: 'paneQH', padding: 0.4 });
  var selRenderer = L.svg({ pane: 'paneSel', padding: 0.4 });

  var state = {
    base: 'satellite', thuaOn: true, qhOn: false, thuaOp: 1, qhOp: 0.7,
    mode: 'thua', sel: null, selKind: 'thua', selLayer: null, hoverLayer: null, hoverF: null,
    pin: null, locate: null, measuring: false, qhLayerReady: false
  };
  var tileLayer = null;

  function setBasemap(name) {
    state.base = name;
    if (tileLayer) { map.removeLayer(tileLayer); tileLayer = null; }
    if (name === 'satellite') {
      tileLayer = L.tileLayer(ESRI_TILES, {
        maxNativeZoom: 19, maxZoom: 22, crossOrigin: false, referrerPolicy: 'no-referrer',
        attribution: 'Ảnh: Esri World Imagery'
      }).addTo(map);
      tileLayer.setZIndex(1);
    }
    $('map').style.background = BASE_BG[name];
    document.querySelectorAll('.basemap').forEach(function (b) {
      var on = b.getAttribute('data-base') === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  setBasemap('satellite');

  /* ---------- Dữ liệu ---------- */
  var parcels = [], byMa = new Map(), qhThua = new Map(), qhChiTiet = new Map();
  var qhParcels = [];
  var thuaLayer = null, qhLayer = null;
  var dataReady = false, qhAttrReady = false;

  function bboxOf(f) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function walk(c) {
      if (typeof c[0] === 'number') {
        if (c[0] < b[0]) { b[0] = c[0]; } if (c[0] > b[2]) { b[2] = c[0]; }
        if (c[1] < b[1]) { b[1] = c[1]; } if (c[1] > b[3]) { b[3] = c[1]; }
      } else { for (var i = 0; i < c.length; i++) { walk(c[i]); } }
    })(f.geometry.coordinates);
    return b;
  }
  function ringHas(r, x, y) {
    var c = false;
    for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
      var xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) { c = !c; }
    }
    return c;
  }
  function polyHas(p, x, y) {
    if (!ringHas(p[0], x, y)) { return false; }
    for (var k = 1; k < p.length; k++) { if (ringHas(p[k], x, y)) { return false; } }
    return true;
  }
  function featHas(f, x, y) {
    var g = f.geometry;
    if (g.type === 'Polygon') { return polyHas(g.coordinates, x, y); }
    for (var i = 0; i < g.coordinates.length; i++) { if (polyHas(g.coordinates[i], x, y)) { return true; } }
    return false;
  }
  function findAt(ll) {
    var x = ll.lng, y = ll.lat;
    for (var i = 0; i < parcels.length; i++) {
      var f = parcels[i], b = f._b;
      if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) { continue; }
      if (featHas(f, x, y)) { return f; }
    }
    return null;
  }
  function findQhAt(ll) {
    var x = ll.lng, y = ll.lat;
    for (var i = 0; i < qhParcels.length; i++) {
      var f = qhParcels[i], b = f._b;
      if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) { continue; }
      if (featHas(f, x, y)) { return f; }
    }
    return null;
  }
  /* Khi bật lớp quy hoạch, ưu tiên nhận diện thửa quy hoạch trước thửa đất */
  function identify(ll) {
    if (state.qhOn) {
      var q = findQhAt(ll);
      if (q) { return { kind: 'qh', f: q }; }
    }
    if (state.thuaOn) {
      var t = findAt(ll);
      if (t) { return { kind: 'thua', f: t }; }
    }
    return null;
  }
  function boundsOf(f) { return L.latLngBounds([f._b[1], f._b[0]], [f._b[3], f._b[2]]); }

  function thuaStyle(f) {
    return {
      renderer: thuaRenderer, pane: 'paneThua', interactive: false,
      color: 'rgba(35,35,35,0.9)', weight: 0.8, fill: true, fillOpacity: 1,
      fillColor: window.MSDD_COLORS[f.properties.MSDD] || window.MSDD_DEFAULT
    };
  }
  function qhStyle(f) {
    return {
      renderer: qhRenderer, pane: 'paneQH', interactive: false,
      color: '#ff0000', weight: 1, fill: true, fillOpacity: 1,
      fillColor: window.QH_COLORS[f.properties['MA_LĐ_QH']] || window.QH_DEFAULT
    };
  }

  function buildParcels() {
    var fs = window.json_THUA_DAT_2.features;
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i];
      f._b = bboxOf(f);
      f._o = norm(f.properties.Ten_CSD);
      byMa.set(f.properties.MA_THUA, f);
    }
    parcels = fs;
    thuaLayer = L.geoJSON(window.json_THUA_DAT_2, { style: thuaStyle, pane: 'paneThua', renderer: thuaRenderer, interactive: false });
    thuaLayer.addTo(map);
    applyOpacity();
    dataReady = true;
  }
  function ensureQhLayer() {
    if (qhLayer || !window.json_QH_Clean_v3_3) { return; }
    var fs = window.json_QH_Clean_v3_3.features;
    for (var i = 0; i < fs.length; i++) { fs[i]._b = bboxOf(fs[i]); }
    qhParcels = fs;
    qhLayer = L.geoJSON(window.json_QH_Clean_v3_3, { style: qhStyle, pane: 'paneQH', renderer: qhRenderer, interactive: false });
    if (state.qhOn) { qhLayer.addTo(map); }
  }

  function applyOpacity() {
    map.getPane('paneThua').style.opacity = state.thuaOn ? state.thuaOp : 0;
    map.getPane('paneQH').style.opacity = state.qhOn ? state.qhOp : 0;
  }

  /* Nạp dữ liệu theo thứ tự ưu tiên */
  (async function loadAll() {
    try {
      setProgress(12, 'Đang tải lớp thửa đất…');
      await loadScript('data/THUA_DAT_2.js');
      setProgress(60, 'Đang dựng bản đồ…');
      await new Promise(function (r) { setTimeout(r, 30); });
      buildParcels();
      setProgress(100, 'Hoàn tất');
      setTimeout(function () { $('loader').classList.add('is-done'); }, 250);

      await loadScript('data/QH_Clean_v3_3.js');
      ensureQhLayer();
      await loadScript('data/QH_THUA_1.js');
      window.json_QH_THUA_1.features.forEach(function (f) { qhThua.set(f.properties.MA_THUA, f.properties); });
      window.json_QH_THUA_1 = null;
      await loadScript('data/QH_CHI_TIET_0.js');
      window.json_QH_CHI_TIET_0.features.forEach(function (f) {
        var k = f.properties.MA_THUA, a = qhChiTiet.get(k);
        if (!a) { a = []; qhChiTiet.set(k, a); }
        a.push(f.properties);
      });
      window.json_QH_CHI_TIET_0 = null;
      qhAttrReady = true;
      if (state.sel) { renderInfo(state.sel); }
    } catch (err) {
      setProgress(100, 'Lỗi tải dữ liệu. Hãy chạy qua máy chủ web (xem README).');
      toast('Không tải được dữ liệu bản đồ.');
    }
  })();

  /* ---------- Panel: mở/đóng ---------- */
  function setPanel(open) {
    document.body.classList.toggle('panel-open', open);
    $('btnOpenSearch').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && isMobile()) { closePops(); }
    if (open) { setTimeout(function () { $('q').focus({ preventScroll: true }); }, 350); }
  }
  $('btnBack').addEventListener('click', function () { setPanel(false); });
  $('btnOpenSearch').addEventListener('click', function () { setPanel(true); });

  var popBtns = { layer: $('btnLayers'), basemap: $('btnBasemap') };
  var pops = { layer: $('layerPanel'), basemap: $('basemapPanel') };
  function closePops(except) {
    Object.keys(pops).forEach(function (k) {
      if (k === except) { return; }
      pops[k].hidden = true;
      popBtns[k].setAttribute('aria-expanded', 'false');
    });
    document.body.classList.toggle('pop-open', !!except);
  }
  function togglePop(k) {
    var willOpen = pops[k].hidden;
    closePops(willOpen ? k : undefined);
    pops[k].hidden = !willOpen;
    popBtns[k].setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    document.body.classList.toggle('pop-open', willOpen);
    if (willOpen && isMobile()) { document.body.classList.remove('panel-open'); }
  }
  popBtns.layer.addEventListener('click', function () { togglePop('layer'); });
  popBtns.basemap.addEventListener('click', function () { togglePop('basemap'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closePops();
      if (state.measuring) { setMeasure(false); }
    }
  });

  /* ---------- Lớp & độ trong suốt ---------- */
  function bindSwitch(btn, key) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-checked') !== 'true';
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      btn.classList.toggle('is-on', on);
      state[key + 'On'] = on;
      if (key === 'qh') {
        ensureQhLayer();
        if (qhLayer) { if (on) { qhLayer.addTo(map); } else { map.removeLayer(qhLayer); } }
        else if (on) { toast('Đang tải lớp quy hoạch…'); }
      }
      applyOpacity();
    });
  }
  function bindSlider(sliderId, inputId, outId, key) {
    var input = $(inputId), out = $(outId), box = $(sliderId);
    function update() {
      var v = Number(input.value) / 100;
      box.style.setProperty('--v', v);
      out.textContent = input.value + '%';
      state[key + 'Op'] = v;
      applyOpacity();
    }
    input.addEventListener('input', update);
  }
  bindSwitch($('swThua'), 'thua');
  bindSwitch($('swQh'), 'qh');
  bindSlider('sliderThua', 'opThua', 'opThuaVal', 'thua');
  bindSlider('sliderQh', 'opQh', 'opQhVal', 'qh');

  document.querySelectorAll('.basemap').forEach(function (b) {
    b.addEventListener('click', function () { setBasemap(b.getAttribute('data-base')); });
  });

  /* ---------- Zoom / Home / Locate ---------- */
  $('zoomIn').addEventListener('click', function () { map.zoomIn(); });
  $('zoomOut').addEventListener('click', function () { map.zoomOut(); });
  $('btnHome').addEventListener('click', function () {
    map.flyToBounds(HOME_BOUNDS, { duration: reduceMotion ? 0 : 1.1, paddingTopLeft: [panelPad(), 20] });
  });
  $('btnLocate').addEventListener('click', function () {
    if (!navigator.geolocation) { toast('Thiết bị không hỗ trợ định vị.'); return; }
    var b = $('btnLocate'); b.classList.add('is-loading');
    navigator.geolocation.getCurrentPosition(function (pos) {
      b.classList.remove('is-loading');
      var ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
      if (state.locate) { map.removeLayer(state.locate); }
      state.locate = L.marker(ll, {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'locate-pulse', html: '<span></span>', iconSize: [24, 24] })
      }).addTo(map);
      map.flyTo(ll, Math.max(map.getZoom(), 17), { duration: reduceMotion ? 0 : 1.2 });
    }, function (err) {
      b.classList.remove('is-loading');
      toast(err && err.code === 1 ? 'Bạn chưa cho phép truy cập vị trí.' : 'Không xác định được vị trí hiện tại.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });

  function panelPad() {
    var w = document.body.classList.contains('panel-open') && !isMobile() ? $('searchPanel').getBoundingClientRect().width + 60 : 30;
    return w;
  }

  /* ---------- Chọn thửa ---------- */
  var SEL_STYLE = { renderer: selRenderer, pane: 'paneSel', interactive: false, className: 'parcel-glow', weight: 3.5, fill: true };
  function drawSelection(f) {
    if (state.selLayer) { map.removeLayer(state.selLayer); }
    state.selLayer = L.geoJSON(f, { style: function () { return SEL_STYLE; }, pane: 'paneSel', renderer: selRenderer, interactive: false }).addTo(map);
  }
  function centroidOf(f) {
    var b = f._b; return L.latLng((b[1] + b[3]) / 2, (b[0] + b[2]) / 2);
  }
  function selectParcel(f, fly) {
    state.sel = f;
    state.selKind = 'thua';
    drawSelection(f);
    renderInfo(f);
    setPanelBody('info');
    $('btnCopy').disabled = false;
    $('btnRoute').disabled = false;
    if (fly) {
      var pad = isMobile() ? [[20, 60], [20, Math.min(window.innerHeight * 0.6, 470)]] : [[panelPad(), 40], [100, 40]];
      map.fitBounds(boundsOf(f), { paddingTopLeft: pad[0], paddingBottomRight: pad[1], maxZoom: 20 });
    }
  }
  function selectQh(f, fly) {
    state.sel = f;
    state.selKind = 'qh';
    drawSelection(f);
    renderQhInfo(f);
    setPanelBody('qhinfo');
    $('btnCopy').disabled = false;
    $('btnRoute').disabled = false;
    if (fly) {
      var pad = isMobile() ? [[20, 60], [20, Math.min(window.innerHeight * 0.6, 470)]] : [[panelPad(), 40], [100, 40]];
      map.fitBounds(boundsOf(f), { paddingTopLeft: pad[0], paddingBottomRight: pad[1], maxZoom: 20 });
    }
  }

  function setPanelBody(which) {
    $('emptyState').hidden = which !== 'empty';
    $('results').hidden = which !== 'results';
    $('info').hidden = which !== 'info';
    $('qhinfo').hidden = which !== 'qhinfo';
    $('panelBody').scrollTop = 0;
  }

  function renderInfo(f) {
    var p = f.properties, ma = p.MA_THUA;
    $('iTo').textContent = p.SO_TO || '—';
    $('iThua').textContent = p.SO_THUA || '—';
    $('iMa').textContent = ma || '—';
    $('iDt').textContent = fmtNum(p.DT) + ' m²';
    $('iDtpl').textContent = fmtNum(p.DT_PL) + ' m²';
    $('iHt').textContent = (p.Ten_MSDD || '—') + (p.MSDD ? ' (' + p.MSDD + ')' : '');
    $('iChu').textContent = p.Ten_CSD || '—';
    $('iDc').textContent = p.DC_TD || p.XU_DONG || '—';

    var gf = $('gaugeFill'), gp = $('gaugePct'), gt = $('gaugeText'), list = $('qhList');
    list.textContent = '';
    var CIRC = 238.7611;
    if (!qhAttrReady) {
      gf.style.strokeDashoffset = CIRC;
      gp.textContent = '…';
      gt.textContent = 'Đang tải dữ liệu quy hoạch…';
      list.appendChild(el('span', 'qh-none', 'Đang tải dữ liệu quy hoạch…'));
      return;
    }
    var q = qhThua.get(ma);
    var pct = q && q.TyLeQH != null ? Math.max(0, Math.min(100, Number(q.TyLeQH))) : 0;
    requestAnimationFrame(function () { gf.style.strokeDashoffset = String(CIRC * (1 - pct / 100)); });
    gp.textContent = fmtNum(pct, pct % 1 ? 1 : 0) + '%';
    gt.textContent = '';
    if (q && pct > 0) {
      gt.appendChild(el('span', 'gauge__line', 'Quy hoạch: ' + fmtNum(pct, 1) + '% (' + fmtNum(q.DT_in_QH) + ' m²)'));
      gt.appendChild(el('span', 'gauge__line', 'Ngoài quy hoạch: ' + fmtNum(q.DT_out_QH) + ' m²'));
    } else {
      gt.appendChild(el('span', 'gauge__line', 'Thửa đất không nằm trong diện quy hoạch.'));
    }
    var items = qhChiTiet.get(ma) || [];
    if (!items.length) {
      list.appendChild(el('span', 'qh-none', 'Không có loại đất quy hoạch trên thửa này.'));
    } else {
      items.forEach(function (it) {
        var li = el('li');
        var sw = el('span', 'qh-swatch');
        sw.style.background = window.QH_COLORS[it['MA_LĐ_QH']] || window.QH_DEFAULT;
        var name = el('div');
        name.appendChild(el('span', 'qh-name', it['TEN_LĐ_QH'] || '—'));
        name.appendChild(el('span', 'qh-code', 'Mã: ' + (it['MA_LĐ_QH'] || '—')));
        li.appendChild(sw); li.appendChild(name);
        li.appendChild(el('span', 'qh-area num', fmtNum(it.DT_QH) + ' m²'));
        list.appendChild(li);
      });
    }
  }

  function renderQhInfo(f) {
    var p = f.properties;
    $('qTen').textContent = p.TEN_LĐ_QH || '—';
    $('qMa').textContent = p.MA_LĐ_QH || '—';
    $('qTt').textContent = p.TT_QH || '—';
  }

  /* Sao chép & chỉ đường */
  function parcelText(f) {
    var p = f.properties, c = centroidOf(f), xy = VN.forward(c.lat, c.lng);
    var q = qhThua.get(p.MA_THUA), lines = [
      'THÔNG TIN THỬA ĐẤT – Xã Thạnh Phước',
      'Tờ bản đồ số: ' + p.SO_TO + ' – Thửa số: ' + p.SO_THUA + ' (Mã: ' + p.MA_THUA + ')',
      'Diện tích: ' + fmtNum(p.DT) + ' m² – Diện tích pháp lý: ' + fmtNum(p.DT_PL) + ' m²',
      'Hiện trạng: ' + (p.Ten_MSDD || '—') + (p.MSDD ? ' (' + p.MSDD + ')' : ''),
      'Chủ sử dụng: ' + (p.Ten_CSD || '—'),
      'Địa chỉ: ' + (p.DC_TD || p.XU_DONG || '—'),
      'VN-2000: X ' + fmtNum(xy.N, 1) + ' – Y ' + fmtNum(xy.E, 1)
    ];
    if (q) { lines.push('Tỷ lệ quy hoạch: ' + fmtNum(q.TyLeQH, 1) + '%'); }
    (qhChiTiet.get(p.MA_THUA) || []).forEach(function (it) {
      lines.push(' • ' + it['TEN_LĐ_QH'] + ' (' + it['MA_LĐ_QH'] + '): ' + fmtNum(it.DT_QH) + ' m²');
    });
    lines.push('* Dữ liệu chỉ mang tính tham khảo, không có giá trị pháp lý.');
    return lines.join('\n');
  }
  function qhText(f) {
    var p = f.properties;
    var lines = [
      'THÔNG TIN THỬA QUY HOẠCH – Xã Thạnh Phước',
      'Tên: ' + (p.TEN_LĐ_QH || '—'),
      'Mã quy hoạch: ' + (p.MA_LĐ_QH || '—'),
      'Thông tin thêm: ' + (p.TT_QH || '—'),
      '* Dữ liệu chỉ mang tính tham khảo, không có giá trị pháp lý.'
    ];
    return lines.join('\n');
  }
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) { return navigator.clipboard.writeText(txt); }
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } finally { ta.remove(); }
    });
  }
  $('btnCopy').addEventListener('click', function () {
    if (!state.sel) { return; }
    var b = this;
    var txt = state.selKind === 'qh' ? qhText(state.sel) : parcelText(state.sel);
    copyText(txt).then(function () {
      b.classList.add('is-done'); toast(state.selKind === 'qh' ? 'Đã sao chép thông tin thửa quy hoạch.' : 'Đã sao chép thông tin thửa đất.');
      setTimeout(function () { b.classList.remove('is-done'); }, 1400);
    }, function () { toast('Không sao chép được. Hãy thử lại.'); });
  });
  $('btnRoute').addEventListener('click', function () {
    if (!state.sel) { return; }
    var c = centroidOf(state.sel);
    var url = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(c.lat.toFixed(6) + ',' + c.lng.toFixed(6));
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  /* ---------- Tìm kiếm ---------- */
  var tabs = document.querySelector('.tabs');
  var PLACEHOLDER = { thua: 'Nhập số tờ_số thửa', chu: 'Nhập tên chủ sử dụng', xy: 'Nhập tọa độ VN-2000: X, Y' };
  var q = $('q'), debounce;
  tabs.querySelectorAll('.tabs__tab').forEach(function (t, i) {
    t.addEventListener('click', function () {
      state.mode = t.getAttribute('data-mode');
      tabs.setAttribute('data-active', String(i));
      tabs.querySelectorAll('.tabs__tab').forEach(function (o) {
        var on = o === t; o.classList.toggle('is-active', on); o.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      q.placeholder = PLACEHOLDER[state.mode];
      q.inputMode = state.mode === 'xy' ? 'text' : 'search';
      q.value = '';
      refreshSuggest();
      q.focus({ preventScroll: true });
    });
  });

  function suggestThua(text) {
    var m = text.match(/^(\d+)\s*[_\-\/\\,.\s]?\s*(\d*)$/);
    if (!m) { return []; }
    var to = m[1], th = m[2], out = [];
    for (var i = 0; i < parcels.length && out.length < 8; i++) {
      var p = parcels[i].properties;
      if (p.SO_TO === to && (!th || String(p.SO_THUA).indexOf(th) === 0)) { out.push(parcels[i]); }
    }
    out.sort(function (a, b) { return Number(a.properties.SO_THUA) - Number(b.properties.SO_THUA); });
    return out;
  }
  function suggestChu(text) {
    var k = norm(text), out = [];
    if (k.length < 2) { return out; }
    for (var i = 0; i < parcels.length && out.length < 12; i++) {
      if (parcels[i]._o.indexOf(k) !== -1) { out.push(parcels[i]); }
    }
    return out;
  }
  function showResults(list, title, emptyMsg, byOwner) {
    var ul = $('resultsList'); ul.textContent = '';
    $('resultsTitle').textContent = title;
    if (!list.length) {
      var li = el('li'); li.appendChild(el('p', 'results__msg', emptyMsg)); ul.appendChild(li);
    }
    list.forEach(function (f, i) {
      var p = f.properties, li = el('li'), b = el('button');
      b.type = 'button';
      b.style.animationDelay = (i * 30) + 'ms';
      var thuaLine = 'Tờ ' + p.SO_TO + ' · Thửa ' + p.SO_THUA;
      var ownerLine = (p.Ten_CSD || '—') + ' — ' + fmtNum(p.DT) + ' m²';
      if (byOwner) {
        b.appendChild(el('span', 'r-main', p.Ten_CSD || '—'));
        b.appendChild(el('span', 'r-sub', thuaLine + ' — ' + fmtNum(p.DT) + ' m²'));
      } else {
        b.appendChild(el('span', 'r-main', thuaLine));
        b.appendChild(el('span', 'r-sub', ownerLine));
      }
      b.addEventListener('click', function () { selectParcel(f, true); if (isMobile()) { q.blur(); } });
      li.appendChild(b); ul.appendChild(li);
    });
    setPanelBody('results');
  }
  function refreshSuggest() {
    var text = clean(q.value);
    if (!dataReady) { return; }
    if (!text) { setPanelBody(state.sel ? (state.selKind === 'qh' ? 'qhinfo' : 'info') : 'empty'); return; }
    if (state.mode === 'thua') {
      showResults(suggestThua(text), 'Gợi ý thửa đất', 'Không tìm thấy. Nhập theo dạng 12_104 (tờ_thửa).');
    } else if (state.mode === 'chu') {
      showResults(suggestChu(text), 'Chủ sử dụng phù hợp', 'Không tìm thấy chủ sử dụng phù hợp.', true);
    } else {
      setPanelBody(state.sel ? (state.selKind === 'qh' ? 'qhinfo' : 'info') : 'empty');
    }
  }
  q.addEventListener('input', function () { clearTimeout(debounce); debounce = setTimeout(refreshSuggest, 120); });
  q.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') { return; }
    e.preventDefault();
    clearTimeout(debounce);
    var text = clean(q.value);
    if (!text || !dataReady) { return; }
    if (state.mode === 'xy') { return searchXY(text); }
    var list = state.mode === 'thua' ? suggestThua(text) : suggestChu(text);
    if (state.mode === 'thua') {
      var m = text.match(/^(\d+)\s*[_\-\/\\,.\s]\s*(\d+)$/);
      if (m && byMa.has(m[1] + '_' + m[2])) { return selectParcel(byMa.get(m[1] + '_' + m[2]), true); }
    }
    if (list.length) { selectParcel(list[0], true); } else { refreshSuggest(); }
  });

  function dropPin(ll) {
    if (state.pin) { map.removeLayer(state.pin); }
    state.pin = L.marker(ll, {
      interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'search-pin', html: '<span></span>', iconSize: [34, 34], iconAnchor: [17, 34] })
    }).addTo(map);
  }
  function searchXY(text) {
    var nums = (text.replace(/,/g, ' ').match(/-?\d+(?:[.]\d+)?/g) || []).map(Number);
    if (nums.length < 2) { toast('Nhập 2 giá trị: X, Y (VN-2000) hoặc vĩ độ, kinh độ.'); return; }
    var a = nums[0], b = nums[1], lat, lon;
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
      lat = a; lon = b;
      if (a > 90 && b <= 90) { lat = b; lon = a; }
    } else {
      var N = Math.max(a, b), E = Math.min(a, b);
      var ll = VN.inverse(E, N); lat = ll.lat; lon = ll.lon;
    }
    var pt = L.latLng(lat, lon);
    if (!HOME_BOUNDS_PAD().contains(pt)) { toast('Tọa độ nằm ngoài khu vực xã Thạnh Phước.'); return; }
    dropPin(pt);
    var f = findAt(pt);
    if (f) { selectParcel(f, true); }
    else {
      toast('Không có thửa đất tại vị trí này.');
      map.flyTo(pt, 18, { duration: reduceMotion ? 0 : 1 });
    }
  }
  function HOME_BOUNDS_PAD() { return L.latLngBounds(HOME_BOUNDS).pad(0.25); }

  /* ---------- Tương tác trên bản đồ: hover + click (identify) ---------- */
  var tip = $('hoverTip'), hoverRaf = 0, lastMove;
  function clearHover() {
    if (state.hoverLayer) { map.removeLayer(state.hoverLayer); state.hoverLayer = null; state.hoverF = null; }
    tip.hidden = true; $('map').classList.remove('is-pointer');
  }
  map.on('mousemove', function (e) {
    if (!dataReady || state.measuring || !state.thuaOn && !state.qhOn) { return; }
    lastMove = e;
    if (hoverRaf) { return; }
    hoverRaf = requestAnimationFrame(function () {
      hoverRaf = 0;
      var hit = identify(lastMove.latlng);
      var f = hit && hit.f;
      if (f !== state.hoverF) {
        if (state.hoverLayer) { map.removeLayer(state.hoverLayer); state.hoverLayer = null; }
        state.hoverF = f;
        if (f && f !== state.sel) {
          state.hoverLayer = L.geoJSON(f, {
            style: function () { return { renderer: selRenderer, pane: 'paneSel', interactive: false, className: 'parcel-hover' }; },
            pane: 'paneSel', renderer: selRenderer, interactive: false
          }).addTo(map);
        }
      }
      if (f) {
        tip.textContent = hit.kind === 'qh'
          ? (f.properties.TEN_LĐ_QH || 'Thửa quy hoạch')
          : ('Tờ ' + f.properties.SO_TO + ' · Thửa ' + f.properties.SO_THUA);
        tip.style.left = lastMove.originalEvent.clientX + 'px';
        tip.style.top = lastMove.originalEvent.clientY + 'px';
        tip.hidden = false; $('map').classList.add('is-pointer');
      } else { tip.hidden = true; $('map').classList.remove('is-pointer'); }
    });
  });
  map.on('mouseout', clearHover);
  map.on('movestart', function () { tip.hidden = true; });

  map.on('click', function (e) {
    closePops();
    if (state.measuring) { addMeasurePoint(e.latlng); return; }
    if (!dataReady) { return; }
    var hit = identify(e.latlng);
    if (hit) {
      clearHover();
      if (!document.body.classList.contains('panel-open')) { setPanel(true); }
      if (hit.kind === 'qh') { selectQh(hit.f, true); } else { selectParcel(hit.f, true); }
    }
  });

  /* ---------- Đo khoảng cách ---------- */
  var measure = { pts: [], line: null, group: L.layerGroup(), total: 0 };
  measure.group.addTo(map);
  function fmtDist(m) { return m >= 1000 ? fmtNum(m / 1000, 3) + ' km' : fmtNum(m, 1) + ' m'; }
  function setMeasure(on) {
    state.measuring = on;
    var b = $('btnMeasure');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('map').classList.toggle('is-measuring', on);
    $('measureHud').hidden = !on && measure.pts.length === 0;
    if (on) { clearHover(); toast('Nhấp lên bản đồ để chọn các điểm cần đo. Nhấn Esc để dừng.'); }
    map.doubleClickZoom[on ? 'disable' : 'enable']();
  }
  function addMeasurePoint(ll) {
    var last = measure.pts[measure.pts.length - 1];
    if (last) { measure.total += map.distance(last, ll); }
    measure.pts.push(ll);
    if (!measure.line) {
      measure.line = L.polyline([], { pane: 'paneMeasure', color: '#ffffff', weight: 3, dashArray: '8 6', interactive: false }).addTo(measure.group);
    }
    measure.line.setLatLngs(measure.pts);
    var dot = L.circleMarker(ll, { pane: 'paneMeasure', radius: 5, color: '#fff', weight: 2, fillColor: '#99c54a', fillOpacity: 1, interactive: false });
    dot.addTo(measure.group);
    if (last) { dot.bindTooltip(fmtDist(measure.total), { permanent: true, direction: 'top', offset: [0, -6], className: 'measure-tip' }); }
    $('measureValue').textContent = fmtDist(measure.total);
    $('measureHud').hidden = false;
  }
  $('btnMeasure').addEventListener('click', function () { setMeasure(!state.measuring); });
  $('measureClear').addEventListener('click', function () {
    measure.group.clearLayers(); measure.pts = []; measure.line = null; measure.total = 0;
    $('measureValue').textContent = '0 m';
    if (!state.measuring) { $('measureHud').hidden = true; }
  });

  /* ---------- Khởi tạo ---------- */
  if (isMobile()) { document.body.classList.remove('panel-open'); }
  window.addEventListener('resize', function () { map.invalidateSize(); });
  setTimeout(function () { map.invalidateSize(); }, 200);
})();
