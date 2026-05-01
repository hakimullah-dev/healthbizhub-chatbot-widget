(function () {
  'use strict';

  var WEBHOOK_URL = 'https://agents.metatitans.co.uk/proxy.php';
  var CSS_URL = 'https://hakimullah-dev.github.io/healthbizhub-chatbot-widget/widget.css';

  var sessionId = 'hbh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  var isOpen = false;
  var isTyping = false;

  /* ===== INJECT CSS ===== */
  function injectCSS() {
    if (document.getElementById('hbh-widget-css')) return;
    var link = document.createElement('link');
    link.id = 'hbh-widget-css';
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    document.head.appendChild(link);
  }

  /* ===== BUILD HTML ===== */
  function buildWidget() {
    var bubble = document.createElement('button');
    bubble.id = 'hbh-bubble';
    bubble.setAttribute('aria-label', 'Open HealthBizHub chat');
    bubble.innerHTML =
      '<svg class="hbh-chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>' +
      '<svg class="hbh-close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

    var win = document.createElement('div');
    win.id = 'hbh-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'HealthBizHub AI Chat');
    win.innerHTML =
      '<div class="hbh-header">' +
        '<div class="hbh-header-avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg></div>' +
        '<div class="hbh-header-info">' +
          '<div class="hbh-header-name">HealthBizHub AI</div>' +
          '<div class="hbh-header-status"><span class="hbh-status-dot"></span>Online &bull; 141+ businesses</div>' +
        '</div>' +
      '</div>' +
      '<div class="hbh-messages" id="hbh-messages"></div>' +
      '<div class="hbh-suggestions" id="hbh-suggestions"></div>' +
      '<div class="hbh-input-area">' +
        '<textarea class="hbh-input" id="hbh-input" placeholder="Ask about health businesses..." rows="1"></textarea>' +
        '<button class="hbh-send-btn" id="hbh-send" aria-label="Send">' +
          '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
        '</button>' +
      '</div>';

    document.body.appendChild(bubble);
    document.body.appendChild(win);

    bubble.addEventListener('click', toggleWidget);
    document.getElementById('hbh-send').addEventListener('click', sendMessage);
    document.getElementById('hbh-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.getElementById('hbh-input').addEventListener('input', autoResize);

    showSuggestions(['Browse all categories', 'Find nutrition businesses', 'Show featured businesses', 'How does HealthBizHub work?']);
  }

  function toggleWidget() {
    isOpen = !isOpen;
    var bubble = document.getElementById('hbh-bubble');
    var win = document.getElementById('hbh-window');
    if (isOpen) {
      bubble.classList.add('open');
      win.classList.add('open');
      document.getElementById('hbh-input').focus();
      if (document.getElementById('hbh-messages').children.length === 0) {
        addBotMessage({ response_type: 'text', message: 'Hi! I\'m the HealthBizHub AI assistant. I can help you find health businesses, browse categories, view photos, testimonials, and more. What are you looking for?', suggestions: ['Browse all categories', 'Find nutrition businesses', 'Show featured businesses'] });
      }
    } else {
      bubble.classList.remove('open');
      win.classList.remove('open');
    }
  }

  function autoResize() {
    var ta = document.getElementById('hbh-input');
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
  }

  /* ===== SEND & RECEIVE ===== */
  function sendMessage() {
    if (isTyping) return;
    var input = document.getElementById('hbh-input');
    var text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';
    input.style.height = 'auto';
    clearSuggestions();
    showTyping();

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: sessionId })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        addBotMessage(data);
      })
      .catch(function (err) {
        hideTyping();
        addBotMessage({ response_type: 'text', message: 'Sorry, I couldn\'t connect. Please try again.', suggestions: ['Browse all categories', 'Search businesses'] });
        console.error('HBH widget error:', err);
      });
  }

  /* ===== MESSAGE RENDERING ===== */
  function addUserMessage(text) {
    var container = document.getElementById('hbh-messages');
    var div = document.createElement('div');
    div.className = 'hbh-msg user';
    div.innerHTML = '<div class="hbh-msg-bubble">' + escHtml(text) + '</div><div class="hbh-msg-time">' + getTime() + '</div>';
    container.appendChild(div);
    scrollBottom();
  }

  function addBotMessage(data) {
    var container = document.getElementById('hbh-messages');
    var wrapper = document.createElement('div');
    wrapper.className = 'hbh-msg bot';

    var bubble = document.createElement('div');
    bubble.className = 'hbh-msg-bubble';

    if (data.message) {
      var p = document.createElement('p');
      p.style.margin = '0 0 8px 0';
      p.textContent = data.message;
      bubble.appendChild(p);
    }

    var richContent = buildRichContent(data);
    if (richContent) bubble.appendChild(richContent);

    wrapper.appendChild(bubble);
    var timeEl = document.createElement('div');
    timeEl.className = 'hbh-msg-time';
    timeEl.textContent = getTime();
    wrapper.appendChild(timeEl);
    container.appendChild(wrapper);

    if (data.suggestions && data.suggestions.length > 0) {
      showSuggestions(data.suggestions);
    }
    scrollBottom();
  }

  function buildRichContent(data) {
    var type = data.response_type;
    var items = data.items || [];
    if (!items.length && type !== 'text') return null;

    if (type === 'cards') return buildCards(items);
    if (type === 'category_picker') return buildCategoryPicker(items);
    if (type === 'image_slider') return buildSlider(items);
    if (type === 'testimonial_cards') return buildTestimonials(items);
    if (type === 'links') return buildLinks(items);
    if (type === 'post_type_picker') return buildPostTypes(items, data);
    return null;
  }

  function buildCards(items) {
    var wrap = document.createElement('div');
    wrap.className = 'hbh-cards-wrap';
    items.slice(0, 8).forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'hbh-card';
      var imgHtml = item.photo_url
        ? '<img class="hbh-card-img" src="' + escAttr(item.photo_url) + '" alt="' + escAttr(item.business_name || '') + '" onerror="this.style.display=\'none\'">'
        : '<div class="hbh-card-img-placeholder"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6l3-4 2 3 3-4 4 5z"/></svg></div>';
      var badges = '';
      if (item.is_verified) badges += '<span class="hbh-badge hbh-badge-verified">✓ Verified</span>';
      if (item.is_featured) badges += '<span class="hbh-badge hbh-badge-featured">★ Featured</span>';
      card.innerHTML =
        imgHtml +
        '<div class="hbh-card-body">' +
          '<div class="hbh-card-title">' + escHtml(item.business_name || '') + '</div>' +
          '<div class="hbh-card-meta">' +
            (item.category ? '<span>' + escHtml(item.category) + '</span>' : '') +
            (item.location ? '<span>📍 ' + escHtml(item.location) + '</span>' : '') +
          '</div>' +
          (badges ? '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">' + badges + '</div>' : '') +
          (item.description ? '<div class="hbh-card-desc">' + escHtml(item.description) + '</div>' : '') +
        '</div>' +
        (item.profile_url ? '<a class="hbh-card-link" href="' + escAttr(item.profile_url) + '" target="_blank" rel="noopener">View Profile →</a>' : '');
      wrap.appendChild(card);
    });
    return wrap;
  }

  function buildCategoryPicker(items) {
    var wrap = document.createElement('div');
    wrap.className = 'hbh-cats';
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'hbh-cat-btn';
      btn.innerHTML = escHtml(item.label || item.value || '') + (item.count ? '<span class="hbh-cat-count">(' + item.count + ')</span>' : '');
      btn.addEventListener('click', function () {
        var query = 'Show businesses in ' + (item.label || item.value);
        document.getElementById('hbh-input').value = query;
        sendMessage();
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function buildSlider(items) {
    if (!items.length) return null;
    var idx = 0;
    var wrap = document.createElement('div');
    wrap.className = 'hbh-slider';

    var track = document.createElement('div');
    track.className = 'hbh-slider-track';
    var img = document.createElement('img');
    img.className = 'hbh-slider-img';
    var caption = document.createElement('div');
    caption.className = 'hbh-slider-caption';

    function show(i) {
      idx = (i + items.length) % items.length;
      img.src = items[idx].image_url || '';
      img.alt = items[idx].title || '';
      caption.textContent = (items[idx].title || '') + (items[idx].description ? ' — ' + items[idx].description.substring(0, 60) : '');
      counter.textContent = (idx + 1) + ' / ' + items.length;
    }

    track.appendChild(img);
    var controls = document.createElement('div');
    controls.className = 'hbh-slider-controls';
    var prev = document.createElement('button');
    prev.className = 'hbh-slider-btn';
    prev.textContent = '‹';
    prev.addEventListener('click', function () { show(idx - 1); });
    var counter = document.createElement('span');
    counter.className = 'hbh-slider-counter';
    var next = document.createElement('button');
    next.className = 'hbh-slider-btn';
    next.textContent = '›';
    next.addEventListener('click', function () { show(idx + 1); });

    controls.appendChild(prev);
    controls.appendChild(counter);
    controls.appendChild(next);
    wrap.appendChild(track);
    wrap.appendChild(caption);
    if (items.length > 1) wrap.appendChild(controls);
    show(0);
    return wrap;
  }

  function buildTestimonials(items) {
    var wrap = document.createElement('div');
    wrap.className = 'hbh-testimonials';
    items.slice(0, 10).forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'hbh-testimonial';
      el.innerHTML =
        '<div class="hbh-testimonial-title">' + escHtml(item.title || 'Customer Review') + '</div>' +
        '<div class="hbh-testimonial-text">' + escHtml((item.excerpt || '').substring(0, 200)) + '</div>' +
        (item.detail_url ? '<a class="hbh-testimonial-link" href="' + escAttr(item.detail_url) + '" target="_blank" rel="noopener">Read more →</a>' : '');
      wrap.appendChild(el);
    });
    return wrap;
  }

  function buildLinks(items) {
    var wrap = document.createElement('div');
    wrap.className = 'hbh-links';
    items.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'hbh-link-item';
      a.href = item.url || '#';
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML =
        '<span class="hbh-link-platform">' + escHtml(item.platform || '') + '</span>' +
        '<span class="hbh-link-url">' + escHtml(item.url || '') + '</span>';
      wrap.appendChild(a);
    });
    return wrap;
  }

  function buildPostTypes(items, data) {
    var bizName = data.business_name || '';
    var wrap = document.createElement('div');
    wrap.className = 'hbh-post-types';
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'hbh-post-type-btn';
      btn.innerHTML =
        escHtml(item.label || item.value || '') +
        (item.count ? '<span class="hbh-post-type-count">' + item.count + '</span>' : '');
      btn.addEventListener('click', function () {
        var query = 'Show ' + (item.label || item.value) + (bizName ? ' from ' + bizName : '');
        document.getElementById('hbh-input').value = query;
        sendMessage();
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  /* ===== SUGGESTIONS ===== */
  function showSuggestions(list) {
    var container = document.getElementById('hbh-suggestions');
    if (!container) return;
    container.innerHTML = '';
    list.slice(0, 4).forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'hbh-suggestion';
      btn.textContent = s;
      btn.addEventListener('click', function () {
        document.getElementById('hbh-input').value = s;
        sendMessage();
      });
      container.appendChild(btn);
    });
  }

  function clearSuggestions() {
    var c = document.getElementById('hbh-suggestions');
    if (c) c.innerHTML = '';
  }

  /* ===== TYPING ===== */
  function showTyping() {
    isTyping = true;
    document.getElementById('hbh-send').disabled = true;
    var container = document.getElementById('hbh-messages');
    var div = document.createElement('div');
    div.className = 'hbh-msg bot';
    div.id = 'hbh-typing-msg';
    div.innerHTML = '<div class="hbh-typing"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    scrollBottom();
  }

  function hideTyping() {
    isTyping = false;
    document.getElementById('hbh-send').disabled = false;
    var el = document.getElementById('hbh-typing-msg');
    if (el) el.remove();
  }

  /* ===== HELPERS ===== */
  function scrollBottom() {
    var c = document.getElementById('hbh-messages');
    if (c) setTimeout(function () { c.scrollTop = c.scrollHeight; }, 50);
  }

  function getTime() {
    var d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttr(str) { return escHtml(str); }

  /* ===== INIT ===== */
  function init() {
    injectCSS();
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
