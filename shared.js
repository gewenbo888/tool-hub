/* Tool Hub — shared JS
 * Handles: i18n toggle, theme toggle, recently-used tracking,
 * favorites/pin, share modal, copy buttons, toast, FAQ accordion,
 * tool search.
 */

const TH = {
  storage: {
    lang: 'th-lang',
    theme: 'th-theme',
    recent: 'th-recent',
    pinned: 'th-pinned',
    inputs: 'th-inputs',
  },

  init() {
    this.applyLang(localStorage.getItem(this.storage.lang) || 'en');
    this.applyTheme(localStorage.getItem(this.storage.theme) || 'dark');
    this.bindHeader();
    this.bindFAQ();
    this.bindShareButtons();
    this.bindCopyButtons();
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      this.trackRecent();
    }
  },

  /* ───── i18n ───── */
  applyLang(lang) {
    document.body.dataset.lang = lang;
    localStorage.setItem(this.storage.lang, lang);
    const btn = document.querySelector('[data-action="toggle-lang"]');
    if (btn) btn.textContent = lang === 'en' ? '中文' : 'EN';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  },

  toggleLang() {
    this.applyLang(document.body.dataset.lang === 'en' ? 'zh' : 'en');
  },

  /* ───── Theme ───── */
  applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(this.storage.theme, theme);
    const btn = document.querySelector('[data-action="toggle-theme"]');
    if (btn) btn.innerHTML = theme === 'dark'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  },

  toggleTheme() {
    this.applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  },

  /* ───── Header bindings ───── */
  bindHeader() {
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      const action = a.dataset.action;
      if (action === 'toggle-lang') this.toggleLang();
      if (action === 'toggle-theme') this.toggleTheme();
      if (action === 'random-tool') this.openRandomTool();
      if (action === 'open-share') this.openShare(a);
      if (action === 'close-modal') this.closeModal();
      if (action === 'copy') this.copyFromAttr(a);
      if (action === 'pin') { e.preventDefault(); this.togglePin(a); }
    });
    const search = document.getElementById('tool-search');
    if (search) search.addEventListener('input', e => this.filterTools(e.target.value));
  },

  /* ───── Recently used ───── */
  trackRecent() {
    const path = window.location.pathname.replace(/\/$/, '');
    const slug = path.split('/').filter(Boolean).pop();
    if (!slug) return;
    const recent = JSON.parse(localStorage.getItem(this.storage.recent) || '[]');
    const filtered = recent.filter(s => s !== slug);
    filtered.unshift(slug);
    localStorage.setItem(this.storage.recent, JSON.stringify(filtered.slice(0, 6)));
  },

  getRecent() {
    return JSON.parse(localStorage.getItem(this.storage.recent) || '[]');
  },

  /* ───── Pinned ───── */
  togglePin(a) {
    const slug = a.dataset.slug;
    if (!slug) return;
    const pinned = JSON.parse(localStorage.getItem(this.storage.pinned) || '[]');
    const idx = pinned.indexOf(slug);
    if (idx >= 0) {
      pinned.splice(idx, 1);
      a.classList.remove('pinned');
      a.textContent = '☆';
    } else {
      pinned.push(slug);
      a.classList.add('pinned');
      a.textContent = '★';
    }
    localStorage.setItem(this.storage.pinned, JSON.stringify(pinned));
  },

  getPinned() {
    return JSON.parse(localStorage.getItem(this.storage.pinned) || '[]');
  },

  /* ───── Share ───── */
  openShare(btn) {
    const url = btn.dataset.url || window.location.href;
    const modal = document.getElementById('share-modal');
    if (!modal) {
      this.copyText(url);
      return;
    }
    modal.querySelector('.modal-link').textContent = url;
    modal.querySelector('[data-share-x]').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(document.title + ' — ' + url)}`;
    modal.querySelector('[data-share-fb]').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    modal.querySelector('[data-share-li]').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    modal.querySelector('[data-share-copy]').dataset.copy = url;
    modal.classList.add('show');
  },

  closeModal() {
    document.querySelectorAll('.modal-bg').forEach(m => m.classList.remove('show'));
  },

  /* ───── Copy ───── */
  bindCopyButtons() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-copy]');
      if (b) {
        const txt = b.dataset.copy === 'target'
          ? document.querySelector(b.dataset.target)?.value || document.querySelector(b.dataset.target)?.textContent
          : b.dataset.copy;
        if (txt) this.copyText(txt);
      }
    });
  },

  copyFromAttr(b) {
    const txt = b.dataset.copy === 'target'
      ? document.querySelector(b.dataset.target)?.value || document.querySelector(b.dataset.target)?.textContent
      : b.dataset.copy;
    if (txt) this.copyText(txt);
  },

  copyText(text) {
    navigator.clipboard.writeText(text).then(() => this.toast('Copied!', '已复制!'));
  },

  /* ───── Toast ───── */
  toast(en, zh) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    const lang = document.body.dataset.lang;
    t.textContent = lang === 'zh' && zh ? zh : en;
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('show'), 1800);
  },

  /* ───── FAQ ───── */
  bindFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q').addEventListener('click', () => item.classList.toggle('open'));
    });
  },

  /* ───── Random tool ───── */
  openRandomTool() {
    const slugs = ['calculator', 'unit-converter', 'json-formatter', 'regex-tester',
      'markdown-preview', 'image-compressor', 'image-cropper', 'qr-code-generator', 'password-generator'];
    const pool = slugs.filter(s => !window.location.pathname.includes(s));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    window.location.href = '/' + pick;
  },

  /* ───── Tool search filter ───── */
  filterTools(q) {
    const norm = q.toLowerCase().trim();
    document.querySelectorAll('.tool-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = !norm || text.includes(norm) ? '' : 'none';
    });
  },

  bindShareButtons() {},

  /* ───── State persistence helpers ───── */
  saveInput(toolId, value) {
    const all = JSON.parse(localStorage.getItem(this.storage.inputs) || '{}');
    all[toolId] = value;
    localStorage.setItem(this.storage.inputs, JSON.stringify(all));
  },
  loadInput(toolId) {
    const all = JSON.parse(localStorage.getItem(this.storage.inputs) || '{}');
    return all[toolId];
  },

  /* ───── Shareable state encoding (for /tool#state=base64) ───── */
  encodeState(obj) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch { return ''; }
  },
  decodeState(str) {
    try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
  },
  shareableURL(state) {
    const base = window.location.origin + window.location.pathname;
    return base + '#s=' + this.encodeState(state);
  },
  parseStateFromHash() {
    const m = window.location.hash.match(/#s=(.+)/);
    return m ? this.decodeState(m[1]) : null;
  },
};

document.addEventListener('DOMContentLoaded', () => TH.init());
