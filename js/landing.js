/* =========================================================
   WebGIS Thạnh Phước – landing.js
   Không dùng eval/innerHTML với dữ liệu ngoài; chỉ thao tác DOM tĩnh.
   ========================================================= */
(function () {
  'use strict';
  try { if (window.top !== window.self) { window.top.location = window.self.location; } }
  catch (e) { document.documentElement.textContent = ''; return; }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    /* ---- Menu di động ---- */
    var toggle = document.getElementById('navToggle'), links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        links.classList.toggle('is-open', open);
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { toggle.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); });
      });
    }

    /* ---- Thanh điều hướng: đổ bóng khi cuộn + gạch chân mục đang xem ---- */
    var nav = document.getElementById('nav');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[data-nav]'));
    var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('data-nav')); });
    function onScroll() {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      var y = window.scrollY + 120, active = null;
      sections.forEach(function (s, i) { if (s && s.offsetTop <= y) { active = i; } });
      navLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
      var toTop = document.getElementById('toTop');
      if (toTop) { toTop.hidden = window.scrollY < 600; toTop.classList.toggle('is-visible', window.scrollY >= 600); }
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var toTop = document.getElementById('toTop');
    if (toTop) { toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }); }

    /* ---- Reveal khi cuộn tới ---- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var d = Number(en.target.getAttribute('data-delay') || 0);
            setTimeout(function () { en.target.classList.add('is-visible'); }, d);
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(function (e) { io.observe(e); });
    } else {
      revealEls.forEach(function (e) { e.classList.add('is-visible'); });
    }

    /* ---- Đếm số liệu nổi bật ---- */
    var counter = document.querySelector('[data-count]');
    if (counter) {
      var target = Number(counter.getAttribute('data-count'));
      var done = false;
      function animateCount() {
        if (done) { return; }
        done = true;
        if (reduceMotion) { counter.textContent = target.toLocaleString('vi-VN'); return; }
        var start = performance.now(), dur = 1100;
        function tick(t) {
          var p = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - p, 3);
          counter.textContent = Math.round(eased * target).toLocaleString('vi-VN');
          if (p < 1) { requestAnimationFrame(tick); }
        }
        requestAnimationFrame(tick);
      }
      if ('IntersectionObserver' in window) {
        var io2 = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { animateCount(); io2.disconnect(); } });
        }, { threshold: 0.6 });
        io2.observe(counter);
      } else { animateCount(); }
    }

    /* ---- Marquee đối tác: nhân bản đủ số lượng để luôn phủ kín khung nhìn,
       tránh còn khoảng trống trên màn hình rộng; dịch chuyển đúng bằng
       chiều rộng 1 nhóm (đo thực tế) để loop liền mạch tuyệt đối. ---- */
    var track = document.getElementById('marqueeTrack'), group = document.getElementById('marqueeGroup');
    var wrap = document.getElementById('marquee');
    if (track && group && wrap) {
      var groupW = group.getBoundingClientRect().width;
      if (groupW > 0) {
        var need = Math.max(1, Math.ceil(wrap.clientWidth / groupW)) + 1;
        for (var i = 0; i < need; i++) {
          var clone = group.cloneNode(true);
          clone.removeAttribute('id');
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        }
        track.style.setProperty('--marquee-shift', groupW + 'px');
      }
    }

    /* ---- FAQ accordion (cho phép mở nhiều mục) ---- */
    document.querySelectorAll('.faq__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        item.classList.toggle('is-open', open);
      });
    });

    /* ---- Cuộn mượt tới neo trong trang ---- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = id ? document.getElementById(id) : document.body;
        if (!target) { return; }
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      });
    });
  });
})();
