/**
 * Paper - Pure Minimalist Distraction-Free Writing Application
 * Black, White, and Light Grey Aesthetic
 */

(function () {
  'use strict';

  // --- Typography configurations ---
  const TYPEFACES = {
    mono: {
      fontFamily: '"Cousine", monospace',
      lineHeight: '1.8',
      letterSpacing: '0',
      wordSpacing: '0',
      contentHalfWidth: '35ch'
    },
    sans: {
      fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
      lineHeight: '1.65',
      letterSpacing: '0.005em',
      wordSpacing: '0',
      contentHalfWidth: '34ch'
    },
    serif: {
      fontFamily: '"Lora", Georgia, serif',
      lineHeight: '1.7',
      letterSpacing: '0',
      wordSpacing: '0',
      contentHalfWidth: '33ch'
    }
  };

  const DEFAULT_WELCOME_CONTENT = `<h1>The simplest way to write</h1>
<p>Most text editors are bloated with features you'll never use. They get in the way and make writing harder than it needs to be.</p>
<p>Paper keeps it simple. No setup, no complex file systems, no clutter. Just the essentials to think and write clearly.</p>
<p>Whether you're drafting a blog post, a difficult email, or a quick note for yourself, writing here feels effortless.</p>
<h3>Markdown &amp; Features</h3>
<ul class="checklist">
  <li class="task-item"><input type="checkbox" checked> <span>UI automatically fades away as soon as you start typing</span></li>
  <li class="task-item"><input type="checkbox" checked> <span>Live markdown shortcuts (# heading, - list, [ ] to-do, > quote)</span></li>
  <li class="task-item"><input type="checkbox"> <span>Toggle raw Markdown Mode with <code>Ctrl+Shift+M</code> or the top-bar icon</span></li>
  <li class="task-item"><input type="checkbox"> <span>Select any text to reveal the floating formatting toolbar</span></li>
  <li class="task-item"><input type="checkbox"> <span>Switch typefaces (Mono, Sans, Serif) in Settings (<code>Ctrl+,</code>)</span></li>
</ul>
<p>Delete this text anytime and start writing your thoughts.</p>`;

  // --- Application State ---
  const state = {
    documents: [],
    activeDocId: null,
    isMarkdownMode: false,
    settings: {
      theme: 'system',
      typeface: 'sans',
      textScale: 1,
      focusMode: false,
      typewriterMode: false,
      soundMode: false,
      spellcheck: false,
      counterVisible: true,
      formattingToolbarVisible: true,
      wordGoal: 0
    },
    metricsMode: 0, // 0: words, 1: chars, 2: reading time, 3: goal
    isZenMode: false,
    isSidebarOpen: false,
    slashMenuOpen: false,
    dictationActive: false,
    dictationStartTime: null,
    dictationInterval: null,
    dictationText: '',
    dictationRecognition: null
  };

  // --- Audio Context for Typewriter Sound Effects ---
  let audioCtx = null;
  function playKeyClick() {
    if (!state.settings.soundMode) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio not permitted or failed
    }
  }

  // --- Elements Cache ---
  const el = {
    app: document.getElementById('app'),
    docTitle: document.getElementById('doc-title'),
    editor: document.getElementById('editor'),
    markdownEditor: document.getElementById('markdown-editor'),
    workspace: document.getElementById('workspace'),
    btnSidebarToggle: document.getElementById('btn-sidebar-toggle'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    btnNewPage: document.getElementById('btn-new-page'),
    searchPages: document.getElementById('search-pages'),
    pagesList: document.getElementById('pages-list'),
    pagesCount: document.getElementById('pages-count'),
    btnShare: document.getElementById('btn-share'),
    btnMoreOptions: document.getElementById('btn-more-options'),
    moreMenuDropdown: document.getElementById('more-menu-dropdown'),
    menuNewDoc: document.getElementById('menu-new-doc'),
    menuFullscreen: document.getElementById('menu-fullscreen'),
    menuMarkdown: document.getElementById('menu-markdown'),
    menuTheme: document.getElementById('menu-theme'),
    menuThemeText: document.getElementById('menu-theme-text'),
    menuTypefaceToggle: document.getElementById('menu-typeface-toggle'),
    menuTypefaceLabel: document.getElementById('menu-typeface-label'),
    typefaceSubmenu: document.getElementById('typeface-submenu'),
    menuCounter: document.getElementById('menu-counter'),
    menuFormatting: document.getElementById('menu-formatting'),
    menuSpellcheck: document.getElementById('menu-spellcheck'),
    menuShortcuts: document.getElementById('menu-shortcuts'),
    btnExportAll: document.getElementById('btn-export-all'),
    btnShortcuts: document.getElementById('btn-shortcuts'),
    floatingToolbar: document.getElementById('floating-toolbar'),
    slashMenu: document.getElementById('slash-menu'),
    slashImageInput: document.getElementById('slash-image-input'),
    metricsPill: document.getElementById('metrics-pill'),
    metricsText: document.getElementById('metrics-text'),
    goalRingFill: document.getElementById('goal-ring-fill'),
    dictationBar: document.getElementById('dictation-bar'),
    dictationTimer: document.getElementById('dictation-timer'),
    dictationCancelBtn: document.getElementById('dictation-cancel-btn'),
    dictationDoneBtn: document.getElementById('dictation-done-btn'),
    btnDictateTrigger: document.getElementById('btn-dictate-trigger'),
    toastContainer: document.getElementById('toast-container'),
    appTooltip: document.getElementById('app-tooltip'),
    // Modals
    settingsModal: document.getElementById('settings-modal'),
    exportModal: document.getElementById('export-modal'),
    shortcutsModal: document.getElementById('shortcuts-modal'),
    // Setting Controls
    typefacePicker: document.getElementById('typeface-picker'),
    textScalePicker: document.getElementById('text-scale-picker'),
    themePicker: document.getElementById('theme-picker'),
    settingFocusMode: document.getElementById('setting-focus-mode'),
    settingTypewriterMode: document.getElementById('setting-typewriter-mode'),
    settingSoundMode: document.getElementById('setting-sound-mode'),
    settingSpellcheck: document.getElementById('setting-spellcheck'),
    settingWordGoal: document.getElementById('setting-word-goal'),
    // Export actions
    exportMarkdown: document.getElementById('export-markdown'),
    exportTxt: document.getElementById('export-txt'),
    exportPdf: document.getElementById('export-pdf'),
    exportHtml: document.getElementById('export-html'),
    btnQuickCopy: document.getElementById('btn-quick-copy')
  };

  // --- Favicons (Blank vs Written Lines) & Tab Title ---
  const FAVICON_BLANK = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_178_488)'%3e%3cpath%20d='M4.50391%200.900391L12.5537%200.958008L12.751%200.969727C13.7276%201.07414%2014.515%201.88867%2014.5244%202.89648L14.6201%2012.0547C14.6256%2012.582%2014.4168%2013.0759%2014.042%2013.4414L14.043%2013.4424C13.6798%2013.7974%2013.1987%2013.9929%2012.6914%2013.998C12.6218%2014.2376%2012.4926%2014.4566%2012.3135%2014.6367C12.0251%2014.9267%2011.6376%2015.084%2011.2324%2015.084H11.2207L3.02637%2015.0254H3.02539C2.19993%2015.0189%201.50689%2014.3557%201.49805%2013.5195L1.40039%204.2041C1.3964%203.80142%201.55224%203.41827%201.83691%203.13281C2.03404%202.93517%202.27743%202.80079%202.54102%202.73438C2.56372%202.25029%202.76513%201.79842%203.11426%201.45703V1.45605C3.50319%201.07657%204.00506%200.923809%204.46973%200.900391L4.48633%200.899414L4.50391%200.900391ZM5.17285%2011.4004L12.0674%2011.4697L11.9844%203.49707L5.10645%203.42871L5.17285%2011.4004Z'%20fill='%231D1D1B'%20stroke='white'%20stroke-width='1.2'/%3e%3crect%20x='5'%20y='3.5'%20width='7'%20height='8'%20fill='white'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_178_488'%3e%3crect%20width='16'%20height='16'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e";

  const FAVICON_LINES = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_178_488)'%3e%3cpath%20d='M4.50391%200.900391L12.5537%200.958008L12.751%200.969727C13.7276%201.07414%2014.515%201.88867%2014.5244%202.89648L14.6201%2012.0547C14.6256%2012.582%2014.4168%2013.0759%2014.042%2013.4414L14.043%2013.4424C13.6798%2013.7974%2013.1987%2013.9929%2012.6914%2013.998C12.6218%2014.2376%2012.4926%2014.4566%2012.3135%2014.6367C12.0251%2014.9267%2011.6376%2015.084%2011.2324%2015.084H11.2207L3.02637%2015.0254H3.02539C2.19993%2015.0189%201.50689%2014.3557%201.49805%2013.5195L1.40039%204.2041C1.3964%203.80142%201.55224%203.41827%201.83691%203.13281C2.03404%202.93517%202.27743%202.80079%202.54102%202.73438C2.56372%202.25029%202.76513%201.79842%203.11426%201.45703V1.45605C3.50319%201.07657%204.00506%200.923809%204.46973%200.900391L4.48633%200.899414L4.50391%200.900391ZM5.17285%2011.4004L12.0674%2011.4697L11.9844%203.49707L5.10645%203.42871L5.17285%2011.4004Z'%20fill='%231D1D1B'%20stroke='white'%20stroke-width='1.2'/%3e%3crect%20x='5'%20y='3.5'%20width='7'%20height='8'%20fill='white'/%3e%3cline%20x1='6.2'%20y1='5.4'%20x2='10.8'%20y2='5.4'%20stroke='%231D1D1B'%20stroke-width='0.8'%20stroke-linecap='round'/%3e%3cline%20x1='6.2'%20y1='7.4'%20x2='10.8'%20y2='7.4'%20stroke='%231D1D1B'%20stroke-width='0.8'%20stroke-linecap='round'/%3e%3cline%20x1='6.2'%20y1='9.4'%20x2='9.2'%20y2='9.4'%20stroke='%231D1D1B'%20stroke-width='0.8'%20stroke-linecap='round'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_178_488'%3e%3crect%20width='16'%20height='16'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e";

  function updateFaviconAndTitle() {
    const titleText = (el.docTitle ? el.docTitle.innerText : '').replace(/\u200B/g, '').trim();
    const text = state.isMarkdownMode ? (el.markdownEditor ? el.markdownEditor.value : '') : (el.editor ? el.editor.innerText : '');
    const cleanText = (text || '').replace(/\u200B/g, '').trim();
    const hasText = titleText.length > 0 || cleanText.length > 0;

    // Update Favicon: blank white sheet when empty, white sheet with lines when typing/has text
    const faviconEl = document.getElementById('page-favicon');
    if (faviconEl) {
      const targetFavicon = hasText ? FAVICON_LINES : FAVICON_BLANK;
      if (faviconEl.getAttribute('href') !== targetFavicon) {
        faviconEl.setAttribute('href', targetFavicon);
      }
    }

    // Reflect on the browser tab's title bar: exactly what is on the page, not "— Paper"
    if (titleText) {
      document.title = titleText;
    } else if (cleanText) {
      const firstLine = cleanText.split('\n')[0].trim().substring(0, 48);
      document.title = firstLine || 'Paper';
    } else {
      document.title = 'Paper';
    }
  }

  function updateTitlePlaceholder() {
    if (!el.docTitle) return;
    const text = (el.docTitle.innerText || '').replace(/\u200B/g, '').trim();
    if (!text) {
      el.docTitle.setAttribute('data-empty', 'true');
    } else {
      el.docTitle.removeAttribute('data-empty');
    }
  }

  function updateEditorPlaceholder() {
    if (!el.editor) return;
    const text = (el.editor.innerText || '').replace(/\u200B/g, '').trim();
    if (!text) {
      el.editor.setAttribute('data-empty', 'true');
    } else {
      el.editor.removeAttribute('data-empty');
    }
  }

  function setCursorToStart(element) {
    if (!element) return;
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    if (element.firstChild) {
      if (element.firstChild.nodeType === Node.TEXT_NODE) {
        range.setStart(element.firstChild, 0);
      } else if (element.firstChild.firstChild && element.firstChild.firstChild.nodeType === Node.TEXT_NODE) {
        range.setStart(element.firstChild.firstChild, 0);
      } else {
        range.setStart(element.firstChild, 0);
      }
    } else {
      range.setStart(element, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function enforceTabTitle() {
    updateFaviconAndTitle();
  }

  // --- Storage Helper Functions ---
  function loadFromStorage() {
    try {
      const savedDocs = localStorage.getItem('paper_docs') || localStorage.getItem('blankpage_docs') || localStorage.getItem('docs');
      if (savedDocs) {
        state.documents = JSON.parse(savedDocs);
      }
      const savedSettings = localStorage.getItem('paper_settings') || localStorage.getItem('settings') || localStorage.getItem('blankpage_settings');
      if (savedSettings) {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
      }
      const savedActiveId = localStorage.getItem('paper_active_id') || localStorage.getItem('blankpage_active_id');
      if (savedActiveId && state.documents.some(d => d.id === savedActiveId)) {
        state.activeDocId = savedActiveId;
      }
    } catch (err) {
      console.warn('Storage read error:', err);
    }

    // Initialize with default document if no documents exist
    if (!state.documents || state.documents.length === 0) {
      const initialDoc = {
        id: 'doc_' + Date.now(),
        title: '',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      state.documents = [initialDoc];
      state.activeDocId = initialDoc.id;
      saveToStorage();
    } else {
      if (state.documents.length === 1 && state.documents[0].title === 'The simplest way to write' && state.documents[0].content === DEFAULT_WELCOME_CONTENT) {
        state.documents[0].title = '';
        state.documents[0].content = '';
        saveToStorage();
      }
      if (!state.activeDocId || !state.documents.some(d => d.id === state.activeDocId)) {
        state.activeDocId = state.documents[0].id;
      }
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem('paper_docs', JSON.stringify(state.documents));
      localStorage.setItem('blankpage_docs', JSON.stringify(state.documents));
      localStorage.setItem('paper_settings', JSON.stringify(state.settings));
      localStorage.setItem('blankpage_settings', JSON.stringify(state.settings));
      localStorage.setItem('settings', JSON.stringify(state.settings));
      if (state.activeDocId) {
        localStorage.setItem('paper_active_id', state.activeDocId);
        localStorage.setItem('blankpage_active_id', state.activeDocId);
      }
    } catch (err) {
      console.warn('Storage write error:', err);
    }
  }

  // --- Document Operations ---
  function getActiveDoc() {
    return state.documents.find(d => d.id === state.activeDocId) || null;
  }

  function createNewDoc() {
    const newDoc = {
      id: 'doc_' + Date.now(),
      title: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    state.documents.unshift(newDoc);
    state.activeDocId = newDoc.id;
    saveToStorage();
    renderDocContent();
    renderPagesList();
    closeSidebar();
    if (el.docTitle) {
      el.docTitle.focus();
      setCursorToStart(el.docTitle);
    } else {
      focusCurrentEditor();
    }
    showToast('New document');
  }

  function selectDoc(id) {
    if (state.activeDocId === id) {
      closeSidebar();
      return;
    }
    state.activeDocId = id;
    saveToStorage();
    renderDocContent();
    renderPagesList();
    closeSidebar();
    focusCurrentEditor();
  }

  function deleteDoc(id, e) {
    if (e) e.stopPropagation();
    if (state.documents.length <= 1) {
      showToast('Cannot delete the only page');
      return;
    }
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }
    state.documents = state.documents.filter(d => d.id !== id);
    if (state.activeDocId === id) {
      state.activeDocId = state.documents[0].id;
    }
    saveToStorage();
    renderDocContent();
    renderPagesList();
    showToast('Page deleted');
  }

  function duplicateDoc(id, e) {
    if (e) e.stopPropagation();
    const target = state.documents.find(d => d.id === id);
    if (!target) return;
    const duplicated = {
      id: 'doc_' + Date.now(),
      title: target.title + ' (Copy)',
      content: target.content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    state.documents.unshift(duplicated);
    state.activeDocId = duplicated.id;
    saveToStorage();
    renderDocContent();
    renderPagesList();
    closeSidebar();
    showToast('Page duplicated');
  }

  function extractTitle(content, isMarkdown = false) {
    if (!content) return 'Untitled';
    if (isMarkdown) {
      const lines = content.split('\n').map(l => l.replace(/^[#*\->\s]+/, '').trim()).filter(Boolean);
      return lines.length > 0 ? lines[0].substring(0, 48) : 'Untitled';
    }
    const temp = document.createElement('div');
    temp.innerHTML = content;
    const firstHeading = temp.querySelector('h1, h2, h3, p');
    if (firstHeading && firstHeading.textContent.trim()) {
      return firstHeading.textContent.trim().substring(0, 48);
    }
    const rawText = temp.textContent.trim();
    if (rawText) {
      return rawText.split('\n')[0].trim().substring(0, 48);
    }
    return 'Untitled';
  }

  function extractSnippet(htmlContent) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    const first = temp.firstElementChild;
    if (first && first.tagName.startsWith('H')) {
      first.remove();
    }
    const text = temp.textContent.replace(/\s+/g, ' ').trim();
    return text || 'No additional text...';
  }

  function timeAgo(timestamp) {
    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(timestamp).toLocaleDateString();
  }

  function focusCurrentEditor() {
    if (state.isMarkdownMode) {
      el.markdownEditor.focus();
    } else {
      el.editor.focus();
      if (!el.editor.innerText.trim()) {
        setCursorToStart(el.editor);
      }
    }
  }

  // --- UI Activity on Typing ---
  function handleTypingActivity() {
    el.floatingToolbar.classList.remove('visible');
    // Immediately reflect lines on the favicon and update tab title
    updateFaviconAndTitle();
  }

  function handleMouseMove() {
    // Keep UI responsive
  }

  // --- UI Rendering ---
  function renderDocContent() {
    const doc = getActiveDoc();
    if (!doc) return;
    if (el.docTitle) {
      el.docTitle.innerText = doc.title || '';
      updateTitlePlaceholder();
    }
    if (el.editor) {
      el.editor.innerHTML = doc.content || '';
      updateEditorPlaceholder();
    }
    if (state.isMarkdownMode && el.markdownEditor) {
      el.markdownEditor.value = htmlToMarkdown(doc.content || '');
    }
    enforceTabTitle();
    updateMetrics();
  }

  function renderPagesList() {
    if (!el.pagesList || !el.searchPages) return;
    const query = el.searchPages.value.toLowerCase().trim();
    const filtered = state.documents.filter(d => {
      if (!query) return true;
      return d.title.toLowerCase().includes(query) || (d.content && d.content.toLowerCase().includes(query));
    });

    el.pagesList.innerHTML = '';
    filtered.forEach(doc => {
      const item = document.createElement('div');
      item.className = 'page-item' + (doc.id === state.activeDocId ? ' active' : '');
      item.onclick = () => selectDoc(doc.id);

      const contentWrap = document.createElement('div');
      contentWrap.className = 'page-item-content';

      const titleEl = document.createElement('div');
      titleEl.className = 'page-item-title';
      titleEl.textContent = doc.title || 'Untitled';

      const previewEl = document.createElement('div');
      previewEl.className = 'page-item-preview';
      previewEl.textContent = extractSnippet(doc.content);

      const dateEl = document.createElement('div');
      dateEl.className = 'page-item-date';
      dateEl.textContent = timeAgo(doc.updatedAt);

      contentWrap.appendChild(titleEl);
      contentWrap.appendChild(previewEl);
      contentWrap.appendChild(dateEl);

      const actions = document.createElement('div');
      actions.className = 'page-item-actions';

      // Duplicate button
      const dupBtn = document.createElement('button');
      dupBtn.className = 'action-mini-btn';
      dupBtn.title = 'Duplicate page';
      dupBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      dupBtn.onclick = (e) => duplicateDoc(doc.id, e);

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'action-mini-btn';
      delBtn.title = 'Delete page';
      delBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      delBtn.onclick = (e) => deleteDoc(doc.id, e);

      actions.appendChild(dupBtn);
      actions.appendChild(delBtn);

      item.appendChild(contentWrap);
      item.appendChild(actions);
      el.pagesList.appendChild(item);
    });

    if (el.pagesCount) {
      el.pagesCount.textContent = `${state.documents.length} ${state.documents.length === 1 ? 'page' : 'pages'}`;
    }
  }

  // --- Auto-Save ---
  let saveDebounceTimer = null;
  function triggerAutoSave() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      const doc = getActiveDoc();
      if (doc) {
        if (el.docTitle) {
          doc.title = (el.docTitle.innerText || '').replace(/\u200B/g, '').trim();
        }
        if (state.isMarkdownMode && el.markdownEditor) {
          doc.content = markdownToHtml(el.markdownEditor.value);
        } else if (el.editor) {
          doc.content = el.editor.innerHTML;
        }
        doc.updatedAt = Date.now();
        saveToStorage();
        renderPagesList();
      }
      updateFaviconAndTitle();
    }, 400);
  }

  // --- Word, Character, and Goal Metrics ---
  function updateMetrics() {
    const titleText = (el.docTitle ? el.docTitle.innerText : '').trim();
    const bodyText = state.isMarkdownMode ? (el.markdownEditor ? el.markdownEditor.value : '') : (el.editor ? (el.editor.innerText || '') : '');
    const fullText = (titleText ? titleText + ' ' : '') + bodyText;
    const words = fullText.trim() ? (fullText.trim().match(/\S+/g) || []).length : 0;
    const chars = fullText.length;
    const readTimeMinutes = Math.ceil(words / 200);

    const goal = state.settings.wordGoal || 0;
    if (goal > 0) {
      const percentage = Math.min(100, Math.round((words / goal) * 100));
      const circumference = 2 * Math.PI * 15; // 94.2
      const offset = circumference - (percentage / 100) * circumference;
      if (el.goalRingFill) el.goalRingFill.style.strokeDashoffset = offset;
    } else {
      if (el.goalRingFill) el.goalRingFill.style.strokeDashoffset = 94.2;
    }

    if (!el.metricsText) return;
    if (state.metricsMode === 0) {
      el.metricsText.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    } else if (state.metricsMode === 1) {
      el.metricsText.textContent = `${chars} ${chars === 1 ? 'char' : 'chars'}`;
    } else if (state.metricsMode === 2) {
      el.metricsText.textContent = `${readTimeMinutes} min read`;
    } else if (state.metricsMode === 3) {
      if (goal > 0) {
        el.metricsText.textContent = `${words} / ${goal} words`;
      } else {
        el.metricsText.textContent = `${words} words`;
      }
    }
  }

  // --- Theme & Appearance Application ---
  function applyTheme(theme) {
    state.settings.theme = theme;
    let resolvedTheme = theme;
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');

    // update menu theme text matching blank.page
    if (el.menuThemeText) {
      el.menuThemeText.textContent = resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme';
    }
  }

  function applySettings() {
    const s = state.settings;
    const typo = TYPEFACES[s.typeface] || TYPEFACES.sans;
    const root = document.documentElement;

    root.style.setProperty('--font-editor', typo.fontFamily);
    root.style.setProperty('--font-editor-lh', typo.lineHeight);
    root.style.setProperty('--font-editor-ls', typo.letterSpacing);
    root.style.setProperty('--font-editor-ws', typo.wordSpacing);
    root.style.setProperty('--content-half-width', typo.contentHalfWidth);
    root.style.setProperty('--font-editor-scale', String(s.textScale));

    applyTheme(s.theme);

    if (s.focusMode) {
      document.body.classList.add('mode-focus');
    } else {
      document.body.classList.remove('mode-focus');
    }

    // Counter & Toolbar visibility
    document.body.classList.toggle('hide-counter', s.counterVisible === false);
    document.body.classList.toggle('hide-formatting-toolbar', s.formattingToolbarVisible === false);

    // Update menu labels & badges
    if (el.menuTypefaceLabel) {
      const capName = s.typeface.charAt(0).toUpperCase() + s.typeface.slice(1);
      el.menuTypefaceLabel.textContent = capName;
    }
    if (el.typefaceSubmenu) {
      el.typefaceSubmenu.querySelectorAll('.submenu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.typeface === s.typeface);
      });
    }

    if (el.menuCounter) {
      const counterText = el.menuCounter.querySelector('span:first-child');
      if (counterText) {
        counterText.textContent = s.counterVisible === false ? 'Show counter' : 'Hide counter';
      }
    }

    if (el.menuFormatting) {
      const formattingText = el.menuFormatting.querySelector('span:first-child');
      if (formattingText) {
        formattingText.textContent = s.formattingToolbarVisible === false ? 'Show formatting' : 'Hide formatting';
      }
    }

    if (el.menuSpellcheck) {
      const spellcheckText = el.menuSpellcheck.querySelector('span:first-child');
      if (spellcheckText) {
        spellcheckText.textContent = s.spellcheck ? 'Hide spellcheck' : 'Show spellcheck';
      }
    }

    el.editor.spellcheck = s.spellcheck;
    el.markdownEditor.spellcheck = s.spellcheck;

    // Sync modal controls UI
    updatePillPickers();
    if (el.settingFocusMode) el.settingFocusMode.checked = s.focusMode;
    if (el.settingTypewriterMode) el.settingTypewriterMode.checked = s.typewriterMode;
    if (el.settingSoundMode) el.settingSoundMode.checked = s.soundMode;
    if (el.settingSpellcheck) el.settingSpellcheck.checked = s.spellcheck;
    if (el.settingWordGoal) el.settingWordGoal.value = s.wordGoal || '';

    saveToStorage();
    updateMetrics();
  }

  function updatePillPickers() {
    el.typefacePicker.querySelectorAll('.pill-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === state.settings.typeface);
    });
    el.textScalePicker.querySelectorAll('.pill-option').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.val) === parseFloat(state.settings.textScale));
    });
    el.themePicker.querySelectorAll('.pill-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === state.settings.theme);
    });
  }

  // --- Sidebar Controls ---
  function openSidebar() {
    state.isSidebarOpen = true;
    document.body.classList.add('sidebar-open');
    renderPagesList();
    setTimeout(() => el.searchPages.focus(), 150);
  }

  function closeSidebar() {
    state.isSidebarOpen = false;
    document.body.classList.remove('sidebar-open');
  }

  function toggleSidebar() {
    if (state.isSidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  // --- Zen Mode (Pure Blank Screen) ---
  function toggleZenMode() {
    state.isZenMode = !state.isZenMode;
    if (state.isZenMode) {
      document.body.classList.add('zen-mode');
      closeSidebar();
      showToast('Zen mode enabled (Esc to exit)');
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.body.classList.remove('zen-mode');
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // --- Markdown Mode Toggle ---
  function toggleMarkdownMode() {
    state.isMarkdownMode = !state.isMarkdownMode;
    if (state.isMarkdownMode) {
      document.body.classList.add('markdown-mode');
      el.markdownEditor.value = htmlToMarkdown(el.editor.innerHTML);
      el.markdownEditor.focus();
      showToast('Markdown Mode enabled');
    } else {
      document.body.classList.remove('markdown-mode');
      el.editor.innerHTML = markdownToHtml(el.markdownEditor.value);
      updateEditorPlaceholder();
      el.editor.focus();
      showToast('Visual Editor enabled');
    }
    triggerAutoSave();
    updateMetrics();
  }

  // --- More Options Menu Management ---
  function toggleMoreMenu() {
    if (!el.moreMenuDropdown) return;
    const isOpen = el.moreMenuDropdown.classList.contains('show');
    if (isOpen) {
      closeMoreMenu();
    } else {
      openMoreMenu();
    }
  }

  function openMoreMenu() {
    if (!el.moreMenuDropdown) return;
    el.moreMenuDropdown.classList.add('show');
    if (el.btnMoreOptions) el.btnMoreOptions.setAttribute('aria-expanded', 'true');
  }

  function closeMoreMenu() {
    if (!el.moreMenuDropdown) return;
    el.moreMenuDropdown.classList.remove('show');
    if (el.btnMoreOptions) el.btnMoreOptions.setAttribute('aria-expanded', 'false');
    if (el.typefaceSubmenu) el.typefaceSubmenu.classList.remove('open');
  }

  // --- Floating Selection Toolbar Positioning ---
  function updateFloatingToolbar() {
    if (state.isMarkdownMode) {
      el.floatingToolbar.classList.remove('visible');
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      el.floatingToolbar.classList.remove('visible');
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      el.floatingToolbar.classList.remove('visible');
      return;
    }

    const range = selection.getRangeAt(0);
    if (!el.editor.contains(range.commonAncestorContainer)) {
      el.floatingToolbar.classList.remove('visible');
      return;
    }

    const rect = range.getBoundingClientRect();
    const appRect = el.app.getBoundingClientRect();

    const top = rect.top - appRect.top;
    const left = rect.left + rect.width / 2 - appRect.left;

    el.floatingToolbar.style.top = `${Math.max(10, top)}px`;
    el.floatingToolbar.style.left = `${Math.max(160, Math.min(window.innerWidth - 160, left))}px`;
    el.floatingToolbar.classList.add('visible');

    syncToolbarActiveStates();
  }

  function syncToolbarActiveStates() {
    const boldBtn = el.floatingToolbar.querySelector('[data-cmd="bold"]');
    const italicBtn = el.floatingToolbar.querySelector('[data-cmd="italic"]');
    const underlineBtn = el.floatingToolbar.querySelector('[data-cmd="underline"]');
    const strikeBtn = el.floatingToolbar.querySelector('[data-cmd="strikeThrough"]');

    if (boldBtn) boldBtn.classList.toggle('active', document.queryCommandState('bold'));
    if (italicBtn) italicBtn.classList.toggle('active', document.queryCommandState('italic'));
    if (underlineBtn) underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
    if (strikeBtn) strikeBtn.classList.toggle('active', document.queryCommandState('strikeThrough'));
  }

  function formatText(cmd, val = null) {
    if (cmd === 'h1' || cmd === 'h2' || cmd === 'h3') {
      document.execCommand('formatBlock', false, cmd);
    } else if (cmd === 'blockquote') {
      document.execCommand('formatBlock', false, 'blockquote');
    } else if (cmd === 'code') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const code = document.createElement('code');
      code.textContent = selection.toString();
      range.deleteContents();
      range.insertNode(code);
    } else if (cmd === 'link') {
      const url = prompt('Enter URL:', 'https://');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    } else {
      document.execCommand(cmd, false, val);
    }
    triggerAutoSave();
    updateFloatingToolbar();
  }

  // --- Slash Command Menu (/) ---
  let slashRange = null;
  let slashSelectedIndex = 0;

  function showSlashMenu(range) {
    slashRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const appRect = el.app.getBoundingClientRect();

    el.slashMenu.style.top = `${rect.bottom - appRect.top + 6}px`;
    el.slashMenu.style.left = `${Math.max(16, Math.min(window.innerWidth - 190, rect.left - appRect.left))}px`;
    el.slashMenu.classList.add('visible');
    state.slashMenuOpen = true;
    slashSelectedIndex = 0;
    updateSlashMenuSelection();
  }

  function hideSlashMenu() {
    el.slashMenu.classList.remove('visible');
    state.slashMenuOpen = false;
    slashRange = null;
  }

  function updateSlashMenuSelection() {
    const items = el.slashMenu.querySelectorAll('.slash-menu-item');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === slashSelectedIndex);
    });
  }

  function executeSlashAction(action) {
    hideSlashMenu();
    const sel = window.getSelection();
    if (slashRange) {
      sel.removeAllRanges();
      sel.addRange(slashRange);
      document.execCommand('delete', false, null);
    }

    if (action === 'dictate') {
      if (state.dictationActive) {
        stopDictation(true);
      } else {
        startDictation();
      }
      return;
    } else if (action === 'h1') {
      document.execCommand('formatBlock', false, 'h1');
    } else if (action === 'h2') {
      document.execCommand('formatBlock', false, 'h2');
    } else if (action === 'h3') {
      document.execCommand('formatBlock', false, 'h3');
    } else if (action === 'bullet') {
      document.execCommand('insertUnorderedList', false, null);
    } else if (action === 'number') {
      document.execCommand('insertOrderedList', false, null);
    } else if (action === 'quote') {
      document.execCommand('formatBlock', false, 'blockquote');
    } else if (action === 'link') {
      const url = prompt('Enter link URL (e.g. https://example.com):', 'https://');
      if (url && url !== 'https://') {
        const text = prompt('Enter link text:', url) || url;
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener">${text}</a> `);
      }
    } else if (action === 'image') {
      if (el.slashImageInput) {
        el.slashImageInput.value = '';
        el.slashImageInput.onchange = () => {
          const file = el.slashImageInput.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const imgHtml = `<p><img src="${e.target.result}" alt="${file.name}" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" /></p><p><br></p>`;
              document.execCommand('insertHTML', false, imgHtml);
              triggerAutoSave();
            };
            reader.readAsDataURL(file);
          }
        };
        el.slashImageInput.click();
      }
    }

    triggerAutoSave();
    el.editor.focus();
  }

  // --- Inline Markdown Auto-Replacements ---
  function checkMarkdownShortcuts() {
    if (state.isMarkdownMode) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const node = selection.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent;
    const parent = node.parentElement;

    // Headings
    if (text.startsWith('# ') && parent.tagName !== 'H1') {
      node.textContent = text.slice(2);
      document.execCommand('formatBlock', false, 'h1');
      return;
    } else if (text.startsWith('## ') && parent.tagName !== 'H2') {
      node.textContent = text.slice(3);
      document.execCommand('formatBlock', false, 'h2');
      return;
    } else if (text.startsWith('### ') && parent.tagName !== 'H3') {
      node.textContent = text.slice(4);
      document.execCommand('formatBlock', false, 'h3');
      return;
    } else if (text.startsWith('#### ') && parent.tagName !== 'H4') {
      node.textContent = text.slice(5);
      document.execCommand('formatBlock', false, 'h4');
      return;
    }

    // Checklists [ ] or [x]
    if (text.startsWith('[ ] ') || text.startsWith('[x] ')) {
      const isChecked = text.startsWith('[x] ');
      const rest = text.slice(4);
      node.textContent = '';
      const ul = document.createElement('ul');
      ul.className = 'checklist';
      const li = document.createElement('li');
      li.className = 'task-item' + (isChecked ? ' completed' : '');
      li.innerHTML = `<input type="checkbox" ${isChecked ? 'checked' : ''}> <span>${rest || ''}</span>`;
      ul.appendChild(li);

      const r = selection.getRangeAt(0);
      r.insertNode(ul);
      const span = li.querySelector('span');
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return;
    }

    // Unordered lists
    if ((text.startsWith('- ') || text.startsWith('* ') || text.startsWith('+ ')) && parent.tagName !== 'LI') {
      node.textContent = text.slice(2);
      document.execCommand('insertUnorderedList', false, null);
      return;
    }

    // Numbered lists
    if (/^\d+\.\s/.test(text) && parent.tagName !== 'LI') {
      const match = text.match(/^\d+\.\s/)[0];
      node.textContent = text.slice(match.length);
      document.execCommand('insertOrderedList', false, null);
      return;
    }

    // Blockquote
    if (text.startsWith('> ') && parent.tagName !== 'BLOCKQUOTE') {
      node.textContent = text.slice(2);
      document.execCommand('formatBlock', false, 'blockquote');
      return;
    }

    // Divider
    if (text.trim() === '---' || text.trim() === '***') {
      node.textContent = '';
      document.execCommand('insertHorizontalRule', false, null);
      return;
    }

    // Code block
    if (text.startsWith('```')) {
      node.textContent = '';
      const pre = document.createElement('pre');
      pre.innerHTML = '<code></code>';
      const r = selection.getRangeAt(0);
      r.insertNode(pre);
      return;
    }

    // Inline Markdown Auto-formatting: **bold**, *italic*, ~~strike~~, `code`
    inlineMarkdownReplace(node, selection);
  }

  function inlineMarkdownReplace(node, selection) {
    const text = node.textContent;
    // Bold: **text** or __text__
    let match = text.match(/(\*\*|__)([^\*_\n]+)\1\s$/);
    if (match) {
      applyInlineTag(node, match[0], match[2], 'strong', selection);
      return;
    }
    // Strikethrough: ~~text~~
    match = text.match(/~~([^~\n]+)~~\s$/);
    if (match) {
      applyInlineTag(node, match[0], match[1], 's', selection);
      return;
    }
    // Inline code: `text`
    match = text.match(/`([^`\n]+)`\s$/);
    if (match) {
      applyInlineTag(node, match[0], match[1], 'code', selection);
      return;
    }
    // Italic: *text* or _text_
    match = text.match(/(?<!\*|\w)(\*|_)([^\*_\n]+)\1\s$/);
    if (match) {
      applyInlineTag(node, match[0], match[2], 'em', selection);
      return;
    }
    // Link: [text](url)
    match = text.match(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)\s$/);
    if (match) {
      const fullMatch = match[0];
      const linkText = match[1];
      const linkUrl = match[2];
      const idx = text.lastIndexOf(fullMatch);
      const before = text.slice(0, idx);

      node.textContent = before;
      const a = document.createElement('a');
      a.href = linkUrl;
      a.textContent = linkText;
      const spaceNode = document.createTextNode('\u00A0');

      const parent = node.parentNode;
      parent.insertBefore(a, node.nextSibling);
      parent.insertBefore(spaceNode, a.nextSibling);

      const r = document.createRange();
      r.setStartAfter(spaceNode);
      r.collapse(true);
      selection.removeAllRanges();
      selection.addRange(r);
    }
  }

  function applyInlineTag(node, fullMatch, innerContent, tagName, selection) {
    const text = node.textContent;
    const idx = text.lastIndexOf(fullMatch);
    if (idx === -1) return;

    const before = text.slice(0, idx);
    node.textContent = before;

    const element = document.createElement(tagName);
    element.textContent = innerContent;
    const spaceNode = document.createTextNode('\u00A0');

    const parent = node.parentNode;
    parent.insertBefore(element, node.nextSibling);
    parent.insertBefore(spaceNode, element.nextSibling);

    const r = document.createRange();
    r.setStartAfter(spaceNode);
    r.collapse(true);
    selection.removeAllRanges();
    selection.addRange(r);
  }

  // --- Smart Auto-Capitalization & Autocorrect (QoL) ---
  function applySmartCapitalization(element, e) {
    if (!e.data || e.inputType !== 'insertText') return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return;

    const node = range.startContainer;
    const offset = range.startOffset;

    // Do not alter code blocks
    let p = node;
    while (p && p !== element) {
      if (p.tagName === 'PRE' || p.tagName === 'CODE') return;
      p = p.parentElement;
    }

    // Get text before cursor in current block
    let textBefore = '';
    if (node.nodeType === Node.TEXT_NODE) {
      textBefore = node.textContent.slice(0, offset);
    } else {
      const preRange = document.createRange();
      preRange.selectNodeContents(element);
      preRange.setEnd(node, offset);
      textBefore = preRange.toString();
    }

    // Feature 1: First letter of document / line, or after dot / exclamation / question
    if (/^[a-z]$/.test(e.data)) {
      const isStart = /^\s*$/.test(textBefore);
      const isAfterSentence = /(?:[.!?]["'”’]?\s+|\n\s*)$/.test(textBefore);

      if (isStart || isAfterSentence) {
        e.preventDefault();
        document.execCommand('insertText', false, e.data.toUpperCase());
        return;
      }
    }

    // Feature 2: Standalone 'i' and contractions ('i'll', 'i'm', 'i'd', 'i've') before space or punctuation
    if (e.data === ' ' || /[.,!?;:]/.test(e.data)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const match = textBefore.match(/(^|[\s"'\(\[])(i|i['’]ll|i['’]m|i['’]d|i['’]ve|i['’]d['’]ve|i['’]ll['’]ve)$/);
        if (match) {
          const word = match[2];
          const repl = word.charAt(0).toUpperCase() + word.slice(1);
          e.preventDefault();
          const repRange = document.createRange();
          repRange.setStart(node, offset - word.length);
          repRange.setEnd(node, offset);
          sel.removeAllRanges();
          sel.addRange(repRange);
          document.execCommand('insertText', false, repl + e.data);
          return;
        }
      }
    }
  }

  function applySmartCapitalizationTextarea(textarea, e) {
    if (!e.data || e.inputType !== 'insertText') return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) return;

    const val = textarea.value;
    const textBefore = val.slice(0, start);

    // Feature 1: First letter or after dot
    if (/^[a-z]$/.test(e.data)) {
      const isStart = /^\s*$/.test(textBefore);
      const isAfterSentence = /(?:[.!?]["'”’]?\s+|\n\s*)$/.test(textBefore);
      if (isStart || isAfterSentence) {
        e.preventDefault();
        textarea.setRangeText(e.data.toUpperCase(), start, end, 'end');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }

    // Feature 2: Standalone i and contractions
    if (e.data === ' ' || /[.,!?;:]/.test(e.data)) {
      const match = textBefore.match(/(^|[\s"'\(\[])(i|i['’]ll|i['’]m|i['’]d|i['’]ve|i['’]d['’]ve|i['’]ll['’]ve)$/);
      if (match) {
        e.preventDefault();
        const word = match[2];
        const repl = word.charAt(0).toUpperCase() + word.slice(1);
        textarea.setRangeText(repl + e.data, start - word.length, end, 'end');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
  }

  // --- Active Line Focus ---
  function updateActiveLineFocus() {
    if (!state.settings.focusMode) return;

    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    let node = sel.anchorNode;
    if (!node) return;
    while (node && node.parentElement !== el.editor) {
      node = node.parentElement;
    }

    if (node && node.parentElement === el.editor) {
      Array.from(el.editor.children).forEach(child => {
        child.classList.toggle('active-line', child === node);
      });
    }
  }

  // --- Speech Dictation Feature ---
  function startDictation() {
    state.dictationActive = true;
    state.dictationStartTime = Date.now();
    state.dictationText = '';
    el.dictationBar.classList.add('active');
    el.dictationTimer.textContent = '0:00';

    state.dictationInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - state.dictationStartTime) / 1000);
      const mins = Math.floor(elapsedSec / 60);
      const secs = (elapsedSec % 60).toString().padStart(2, '0');
      el.dictationTimer.textContent = `${mins}:${secs}`;

      const bars = el.dictationBar.querySelectorAll('.waveform-bar');
      bars.forEach(bar => {
        const h = Math.floor(6 + Math.random() * 16);
        bar.style.height = `${h}px`;
      });
    }, 120);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        state.dictationRecognition = new SpeechRecognition();
        state.dictationRecognition.continuous = true;
        state.dictationRecognition.interimResults = true;
        state.dictationRecognition.lang = 'en-US';

        state.dictationRecognition.onresult = (e) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              state.dictationText += e.results[i][0].transcript + ' ';
            } else {
              interim += e.results[i][0].transcript;
            }
          }
        };

        state.dictationRecognition.onerror = (err) => {
          console.warn('Speech recognition notice:', err.error);
        };

        state.dictationRecognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    } else {
      showToast('Speech recognition active');
    }
  }

  function stopDictation(insert = true) {
    if (!state.dictationActive) return;
    state.dictationActive = false;
    clearInterval(state.dictationInterval);
    el.dictationBar.classList.remove('active');

    if (state.dictationRecognition) {
      try {
        state.dictationRecognition.stop();
      } catch (e) {}
    }

    if (insert && state.dictationText.trim()) {
      focusCurrentEditor();
      document.execCommand('insertText', false, state.dictationText.trim() + ' ');
      triggerAutoSave();
      showToast('Dictated text inserted');
    }
  }

  // --- Export Actions ---
  function exportAsMarkdown() {
    const doc = getActiveDoc();
    const title = (el.docTitle ? el.docTitle.innerText : (doc && doc.title ? doc.title : '')).trim();
    const body = state.isMarkdownMode ? (el.markdownEditor ? el.markdownEditor.value : '') : htmlToMarkdown(doc ? doc.content : '');
    let full = body;
    if (title && !body.startsWith('# ' + title)) {
      full = `# ${title}\n\n${body}`;
    }
    const cleanFilename = (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    downloadFile(`${cleanFilename}.md`, full, 'text/markdown');
    closeModal('export-modal');
    showToast('Downloaded Markdown (.md)');
  }

  function exportAsText() {
    const doc = getActiveDoc();
    const title = (el.docTitle ? el.docTitle.innerText : (doc && doc.title ? doc.title : '')).trim();
    const body = state.isMarkdownMode ? (el.markdownEditor ? el.markdownEditor.value : '') : (el.editor ? el.editor.innerText : '');
    let full = body;
    if (title) {
      full = `${title}\n\n${body}`;
    }
    const cleanFilename = (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    downloadFile(`${cleanFilename}.txt`, full, 'text/plain');
    closeModal('export-modal');
    showToast('Downloaded Text (.txt)');
  }

  function exportAsHtml() {
    const doc = getActiveDoc();
    const title = (el.docTitle ? el.docTitle.innerText : (doc && doc.title ? doc.title : '')).trim();
    const titleHtml = title ? `<h1>${title}</h1>` : '';
    const bodyHtml = doc ? doc.content : '';
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title || 'Paper'}</title>
<style>
body { font-family: ${TYPEFACES[state.settings.typeface].fontFamily}; max-width: 68ch; margin: 60px auto; padding: 0 20px; line-height: 1.7; color: #18181b; }
h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
blockquote { border-left: 2px solid #a1a1aa; padding-left: 1em; color: #52525b; margin: 1em 0; }
pre { background: #f4f4f5; padding: 1em; border-radius: 6px; overflow-x: auto; }
code { font-family: monospace; background: #f4f4f5; padding: 0.1em 0.3em; }
</style>
</head>
<body>
${titleHtml}
${bodyHtml}
</body>
</html>`;
    const cleanFilename = (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    downloadFile(`${cleanFilename}.html`, html, 'text/html');
    closeModal('export-modal');
    showToast('Downloaded HTML');
  }

  function exportAsPdf() {
    closeModal('export-modal');
    window.print();
  }

  function copyAllToClipboard() {
    const title = (el.docTitle ? el.docTitle.innerText : '').trim();
    const body = state.isMarkdownMode ? (el.markdownEditor ? el.markdownEditor.value : '') : (el.editor ? el.editor.innerText : '');
    const text = title ? `${title}\n\n${body}` : body;
    navigator.clipboard.writeText(text).then(() => {
      closeModal('export-modal');
      showToast('Copied to clipboard');
    }).catch(() => {
      showToast('Failed to copy');
    });
  }

  function exportAllDocuments() {
    const data = JSON.stringify(state.documents, null, 2);
    downloadFile(`blank-page-backup-${new Date().toISOString().slice(0, 10)}.json`, data, 'application/json');
    showToast('Exported all documents');
  }

  function downloadFile(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Two-Way Markdown Parsing Engine ---
  function htmlToMarkdown(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;

    function parseNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      // Checklist item
      if (node.classList && node.classList.contains('task-item')) {
        const checkbox = node.querySelector('input[type="checkbox"]');
        const checked = checkbox && checkbox.checked ? 'x' : ' ';
        const span = node.querySelector('span');
        const spanText = span ? span.textContent : '';
        return `- [${checked}] ${spanText}\n`;
      }

      let children = Array.from(node.childNodes).map(parseNode).join('');
      switch (node.tagName.toLowerCase()) {
        case 'h1': return `# ${children.trim()}\n\n`;
        case 'h2': return `## ${children.trim()}\n\n`;
        case 'h3': return `### ${children.trim()}\n\n`;
        case 'h4': return `#### ${children.trim()}\n\n`;
        case 'p': return `${children}\n\n`;
        case 'strong':
        case 'b': return `**${children}**`;
        case 'em':
        case 'i': return `*${children}*`;
        case 'u': return `<u>${children}</u>`;
        case 's':
        case 'strike': return `~~${children}~~`;
        case 'code':
          if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
            return children;
          }
          return `\`${children}\``;
        case 'pre': return `\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
        case 'blockquote': return `> ${children.trim()}\n\n`;
        case 'ul': return `${children}\n`;
        case 'ol': return `${children}\n`;
        case 'li': return `- ${children}\n`;
        case 'hr': return `---\n\n`;
        case 'a': return `[${children}](${node.getAttribute('href') || ''})`;
        default: return children;
      }
    }

    return parseNode(temp).trim();
  }

  function markdownToHtml(md) {
    if (!md) return '';
    const lines = md.split('\n');
    let html = '';
    let inCodeBlock = false;
    let codeBuffer = '';
    let inList = false;
    let listType = null;
    let inChecklist = false;

    function closeLists() {
      if (inChecklist) {
        html += '</ul>';
        inChecklist = false;
      }
      if (inList) {
        html += listType === 'ol' ? '</ol>' : '</ul>';
        inList = false;
        listType = null;
      }
    }

    function parseInline(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/~~([^~]+)~~/g, '<s>$1</s>')
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          closeLists();
          inCodeBlock = true;
          codeBuffer = '';
        } else {
          inCodeBlock = false;
          html += `<pre><code>${codeBuffer.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer += (codeBuffer ? '\n' : '') + line;
        continue;
      }

      // Checklists: - [ ] or - [x]
      const checklistMatch = line.match(/^[-*+]\s+\[([ xX])\]\s*(.*)$/);
      if (checklistMatch) {
        if (!inChecklist) {
          closeLists();
          inChecklist = true;
          html += '<ul class="checklist">';
        }
        const isChecked = checklistMatch[1].toLowerCase() === 'x';
        const itemText = parseInline(checklistMatch[2]);
        html += `<li class="task-item${isChecked ? ' completed' : ''}"><input type="checkbox"${isChecked ? ' checked' : ''}> <span>${itemText}</span></li>`;
        continue;
      } else if (inChecklist && !line.trim()) {
        closeLists();
      }

      // Bullet lists
      const bulletMatch = line.match(/^[-*+]\s+(.*)$/);
      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          closeLists();
          inList = true;
          listType = 'ul';
          html += '<ul>';
        }
        html += `<li>${parseInline(bulletMatch[1])}</li>`;
        continue;
      }

      // Numbered lists
      const numberMatch = line.match(/^\d+\.\s+(.*)$/);
      if (numberMatch) {
        if (!inList || listType !== 'ol') {
          closeLists();
          inList = true;
          listType = 'ol';
          html += '<ol>';
        }
        html += `<li>${parseInline(numberMatch[1])}</li>`;
        continue;
      }

      // Non-list line
      closeLists();

      // Empty line
      if (!line.trim()) {
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        html += `<h1>${parseInline(line.slice(2))}</h1>`;
      } else if (line.startsWith('## ')) {
        html += `<h2>${parseInline(line.slice(3))}</h2>`;
      } else if (line.startsWith('### ')) {
        html += `<h3>${parseInline(line.slice(4))}</h3>`;
      } else if (line.startsWith('#### ')) {
        html += `<h4>${parseInline(line.slice(5))}</h4>`;
      } else if (line.startsWith('> ')) {
        html += `<blockquote>${parseInline(line.slice(2))}</blockquote>`;
      } else if (line.trim() === '---' || line.trim() === '***') {
        html += '<hr>';
      } else {
        html += `<p>${parseInline(line)}</p>`;
      }
    }

    closeLists();
    return html;
  }

  // --- Modals Management ---
  function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.classList.add('open');
      closeSidebar();
    }
  }

  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(message) {
    el.toastContainer.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    el.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2500);
  }

  // --- Custom Tooltip Manager (Overrides Browser Default) ---
  let tooltipTimer = null;
  let activeTooltipTarget = null;

  function showCustomTooltip(target) {
    if (!el.appTooltip || !target) return;
    const text = target.getAttribute('data-tooltip') || target.getAttribute('title');
    if (!text) return;

    // Suppress default browser tooltip
    if (target.hasAttribute('title')) {
      target.setAttribute('data-tooltip', text);
      target.removeAttribute('title');
    }
    if (!target.hasAttribute('aria-label')) {
      target.setAttribute('aria-label', text);
    }

    activeTooltipTarget = target;

    // Parse shortcut format: e.g. "Bold (Ctrl+B)" -> "Bold" and "<kbd>Ctrl+B</kbd>"
    const match = text.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (match) {
      el.appTooltip.innerHTML = `<span>${match[1]}</span><kbd>${match[2]}</kbd>`;
    } else {
      el.appTooltip.textContent = text;
    }

    el.appTooltip.style.left = '-9999px';
    el.appTooltip.style.top = '-9999px';
    el.appTooltip.classList.add('visible');

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = el.appTooltip.getBoundingClientRect();

    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    left = Math.max(8, Math.min(window.innerWidth - tooltipRect.width - 8, left));

    let top = targetRect.top - tooltipRect.height - 7;
    if (top < 8) {
      top = targetRect.bottom + 7;
    }

    el.appTooltip.style.left = `${Math.round(left)}px`;
    el.appTooltip.style.top = `${Math.round(top)}px`;
  }

  function hideCustomTooltip() {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
    activeTooltipTarget = null;
    if (el.appTooltip) {
      el.appTooltip.classList.remove('visible');
    }
  }

  function setupTooltips() {
    // Convert existing title attributes on elements to data-tooltip & aria-label
    document.querySelectorAll('[title]').forEach(item => {
      const title = item.getAttribute('title');
      if (title) {
        item.setAttribute('data-tooltip', title);
        if (!item.hasAttribute('aria-label')) {
          item.setAttribute('aria-label', title);
        }
        item.removeAttribute('title');
      }
    });

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip], [title]');
      if (!target || target === activeTooltipTarget) return;

      clearTimeout(tooltipTimer);
      if (target.hasAttribute('title')) {
        const text = target.getAttribute('title');
        target.setAttribute('data-tooltip', text);
        target.removeAttribute('title');
      }

      tooltipTimer = setTimeout(() => {
        showCustomTooltip(target);
      }, 130);
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip], [title]');
      if (target) {
        hideCustomTooltip();
      }
    });

    document.addEventListener('mousedown', hideCustomTooltip);
    document.addEventListener('scroll', hideCustomTooltip, true);
    window.addEventListener('blur', hideCustomTooltip);
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    setupTooltips();

    // Mouse movement reveals UI
    document.addEventListener('mousemove', handleMouseMove);

    // Title Input & Navigation
    if (el.docTitle) {
      el.docTitle.addEventListener('focus', () => {
        if (!el.docTitle.innerText.trim()) {
          setCursorToStart(el.docTitle);
        }
      });

      el.docTitle.addEventListener('click', () => {
        if (!el.docTitle.innerText.trim()) {
          setCursorToStart(el.docTitle);
        }
      });

      el.docTitle.addEventListener('input', () => {
        playKeyClick();
        handleTypingActivity();
        updateTitlePlaceholder();
        triggerAutoSave();
        updateMetrics();
      });

      el.docTitle.addEventListener('beforeinput', (e) => {
        applySmartCapitalization(el.docTitle, e);
      });

      el.docTitle.addEventListener('keydown', (e) => {
        handleTypingActivity();
        if (e.key === 'Enter') {
          e.preventDefault();
          if (state.isMarkdownMode && el.markdownEditor) {
            el.markdownEditor.focus();
          } else if (el.editor) {
            el.editor.focus();
            setCursorToStart(el.editor);
          }
        } else if (e.key === 'ArrowDown') {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const len = (el.docTitle.innerText || '').length;
            if (range.endOffset >= len) {
              e.preventDefault();
              focusCurrentEditor();
            }
          }
        }
      });

      el.docTitle.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        const clean = text.replace(/[\r\n]+/g, ' ').trim();
        document.execCommand('insertText', false, clean);
        updateTitlePlaceholder();
        triggerAutoSave();
      });
    }

    // Editor Input & Auto-Save
    if (el.editor) {
      el.editor.addEventListener('focus', () => {
        if (!el.editor.innerText.trim()) {
          setCursorToStart(el.editor);
        }
      });

      el.editor.addEventListener('click', () => {
        if (!el.editor.innerText.trim()) {
          setCursorToStart(el.editor);
        }
      });

      el.editor.addEventListener('beforeinput', (e) => {
        applySmartCapitalization(el.editor, e);
      });

      el.editor.addEventListener('input', () => {
        playKeyClick();
        handleTypingActivity();
        updateEditorPlaceholder();
        triggerAutoSave();
        updateMetrics();
        checkMarkdownShortcuts();
        updateActiveLineFocus();
      });
    }

    // Markdown Editor Input
    if (el.markdownEditor) {
      el.markdownEditor.addEventListener('beforeinput', (e) => {
        applySmartCapitalizationTextarea(el.markdownEditor, e);
      });

      el.markdownEditor.addEventListener('input', () => {
        playKeyClick();
        handleTypingActivity();
        triggerAutoSave();
        updateMetrics();
      });
    }

    // Editor Keydown for Shortcuts, Navigation, and Slash Trigger
    if (el.editor) {
      el.editor.addEventListener('keydown', (e) => {
        // If Slash menu is open, handle navigation keys FIRST before anything else
        if (state.slashMenuOpen) {
          const items = Array.from(el.slashMenu.querySelectorAll('.slash-menu-item'));
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            slashSelectedIndex = (slashSelectedIndex + 1) % items.length;
            updateSlashMenuSelection();
            items[slashSelectedIndex]?.scrollIntoView({ block: 'nearest' });
            return;
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            slashSelectedIndex = (slashSelectedIndex - 1 + items.length) % items.length;
            updateSlashMenuSelection();
            items[slashSelectedIndex]?.scrollIntoView({ block: 'nearest' });
            return;
          } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            const selected = items[slashSelectedIndex];
            if (selected) {
              executeSlashAction(selected.dataset.action);
            }
            return;
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            hideSlashMenu();
            return;
          } else if (e.key === ' ' || e.key === 'Backspace') {
            setTimeout(() => {
              const sel = window.getSelection();
              if (!sel || !sel.rangeCount) {
                hideSlashMenu();
              } else {
                const range = sel.getRangeAt(0);
                const text = range.startContainer.textContent || '';
                const before = text.slice(0, range.startOffset);
                if (!before.includes('/')) {
                  hideSlashMenu();
                }
              }
            }, 10);
          }
        }

        handleTypingActivity();

        // ArrowUp when at top of editor jumps to Title
        if (e.key === 'ArrowUp' && el.docTitle) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (range.startOffset === 0 && (!range.startContainer.previousSibling || range.startContainer === el.editor)) {
              const rect = range.getBoundingClientRect();
              const editorRect = el.editor.getBoundingClientRect();
              if (rect.top <= editorRect.top + 30 || !el.editor.innerText.trim()) {
                e.preventDefault();
                el.docTitle.focus();
                return;
              }
            }
          }
        }

        // Backspace in empty editor jumps back to Title
        if (e.key === 'Backspace' && !el.editor.innerText.trim() && el.docTitle) {
          e.preventDefault();
          el.docTitle.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(el.docTitle);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }

        // Slash menu trigger
        if (e.key === '/' && !state.slashMenuOpen) {
          setTimeout(() => {
            const sel = window.getSelection();
            if (sel.rangeCount) {
              showSlashMenu(sel.getRangeAt(0));
            }
          }, 10);
        }

        // Tab key indent
        if (e.key === 'Tab') {
          e.preventDefault();
          document.execCommand('insertText', false, '  ');
        }
      });
    }

    // Markdown textarea keydown
    if (el.markdownEditor) {
      el.markdownEditor.addEventListener('keydown', (e) => {
        handleTypingActivity();
        if (e.key === 'ArrowUp' && el.markdownEditor.selectionStart === 0 && el.docTitle) {
          e.preventDefault();
          el.docTitle.focus();
          return;
        }
        if (e.key === 'Backspace' && !el.markdownEditor.value && el.docTitle) {
          e.preventDefault();
          el.docTitle.focus();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = el.markdownEditor.selectionStart;
          const end = el.markdownEditor.selectionEnd;
          el.markdownEditor.value = el.markdownEditor.value.substring(0, start) + '  ' + el.markdownEditor.value.substring(end);
          el.markdownEditor.selectionStart = el.markdownEditor.selectionEnd = start + 2;
        }
      });
    }

    // Interactive Checkbox Click handling inside Editor
    el.editor.addEventListener('click', (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const li = e.target.closest('.task-item');
        if (li) {
          li.classList.toggle('completed', e.target.checked);
          triggerAutoSave();
        }
      }
    });

    // Smart Markdown Paste Handler
    el.editor.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      // If text looks like markdown (contains headings, lists, quotes, code, bold, links)
      if (text && /(^#{1,6}\s|^[-*+]\s|^\d+\.\s|^>\s|```|\*\*|~~|\[.*\]\(.*\))/m.test(text)) {
        e.preventDefault();
        const parsed = markdownToHtml(text);
        document.execCommand('insertHTML', false, parsed);
        triggerAutoSave();
        showToast('Pasted formatted Markdown');
      }
    });

    // Drag and Drop Markdown / Text files
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          const isMd = file.name.endsWith('.md');
          const title = file.name.replace(/\.[^/.]+$/, "");
          const newDoc = {
            id: 'doc_' + Date.now(),
            title: title,
            content: isMd ? markdownToHtml(content) : `<p>${content.replace(/\n/g, '<br>')}</p>`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          state.documents.unshift(newDoc);
          state.activeDocId = newDoc.id;
          saveToStorage();
          renderDocContent();
          renderPagesList();
          showToast(`Imported ${file.name}`);
        };
        reader.readAsText(file);
      }
    });

    // Editor Selection Change
    document.addEventListener('selectionchange', () => {
      updateFloatingToolbar();
      updateActiveLineFocus();
    });

    // Floating Toolbar Button Click Handlers
    el.floatingToolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.toolbar-btn');
      if (!btn) return;
      e.preventDefault();

      if (btn.id === 'btn-dictate-trigger') {
        if (state.dictationActive) {
          stopDictation(true);
        } else {
          startDictation();
        }
        return;
      }

      const cmd = btn.dataset.cmd;
      if (cmd) {
        formatText(cmd);
      }
    });

    // Slash Menu Click Handlers
    el.slashMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.slash-menu-item');
      if (item) {
        executeSlashAction(item.dataset.action);
      }
    });

    const slashItems = el.slashMenu.querySelectorAll('.slash-menu-item');
    slashItems.forEach((item, idx) => {
      item.addEventListener('mouseenter', () => {
        slashSelectedIndex = idx;
        updateSlashMenuSelection();
      });
    });

    // Close slash menu on outside click
    document.addEventListener('click', (e) => {
      if (state.slashMenuOpen && !el.slashMenu.contains(e.target) && !el.editor.contains(e.target)) {
        hideSlashMenu();
      }
    });

    // Top Bar Actions
    if (el.btnSidebarToggle) el.btnSidebarToggle.addEventListener('click', toggleSidebar);
    if (el.sidebarBackdrop) el.sidebarBackdrop.addEventListener('click', closeSidebar);
    if (el.btnNewPage) el.btnNewPage.addEventListener('click', createNewDoc);

    // Share button
    if (el.btnShare) {
      el.btnShare.addEventListener('click', () => openModal('export-modal'));
    }

    // More options button and dropdown menu
    if (el.btnMoreOptions) {
      el.btnMoreOptions.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMoreMenu();
      });
    }

    // Close more menu when clicking outside
    document.addEventListener('click', (e) => {
      if (el.moreMenuDropdown && el.moreMenuDropdown.classList.contains('show')) {
        if (!el.moreMenuDropdown.contains(e.target) && !el.btnMoreOptions.contains(e.target)) {
          closeMoreMenu();
        }
      }
    });

    // Dropdown Items
    if (el.menuNewDoc) {
      el.menuNewDoc.addEventListener('click', () => {
        closeMoreMenu();
        createNewDoc();
      });
    }

    if (el.menuFullscreen) {
      el.menuFullscreen.addEventListener('click', () => {
        closeMoreMenu();
        toggleZenMode();
      });
    }

    if (el.menuMarkdown) {
      el.menuMarkdown.addEventListener('click', () => {
        closeMoreMenu();
        toggleMarkdownMode();
      });
    }

    if (el.menuTheme) {
      el.menuTheme.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
        saveToStorage();
        closeMoreMenu();
      });
    }

    if (el.menuTypefaceToggle) {
      el.menuTypefaceToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (el.typefaceSubmenu) {
          el.typefaceSubmenu.classList.toggle('open');
        }
      });
    }

    if (el.typefaceSubmenu) {
      el.typefaceSubmenu.addEventListener('click', (e) => {
        const item = e.target.closest('.submenu-item');
        if (item && item.dataset.typeface) {
          state.settings.typeface = item.dataset.typeface;
          applySettings();
          saveToStorage();
          closeMoreMenu();
        }
      });
    }

    if (el.menuCounter) {
      el.menuCounter.addEventListener('click', () => {
        state.settings.counterVisible = !(state.settings.counterVisible !== false);
        applySettings();
        saveToStorage();
        closeMoreMenu();
      });
    }

    if (el.menuFormatting) {
      el.menuFormatting.addEventListener('click', () => {
        state.settings.formattingToolbarVisible = !(state.settings.formattingToolbarVisible !== false);
        applySettings();
        saveToStorage();
        closeMoreMenu();
      });
    }

    if (el.menuSpellcheck) {
      el.menuSpellcheck.addEventListener('click', () => {
        state.settings.spellcheck = !state.settings.spellcheck;
        applySettings();
        saveToStorage();
        closeMoreMenu();
      });
    }

    if (el.menuShortcuts) {
      el.menuShortcuts.addEventListener('click', () => {
        closeMoreMenu();
        openModal('shortcuts-modal');
      });
    }

    if (el.btnShortcuts) el.btnShortcuts.addEventListener('click', () => openModal('shortcuts-modal'));
    if (el.btnExportAll) el.btnExportAll.addEventListener('click', exportAllDocuments);

    // Sidebar search filter
    if (el.searchPages) el.searchPages.addEventListener('input', renderPagesList);

    // Metrics Pill Click (cycles through stats)
    el.metricsPill.addEventListener('click', () => {
      state.metricsMode = (state.metricsMode + 1) % 4;
      updateMetrics();
    });

    // Dictation Bar Actions
    el.dictationCancelBtn.addEventListener('click', () => stopDictation(false));
    el.dictationDoneBtn.addEventListener('click', () => stopDictation(true));

    // Modals Close on backdrop click or close button
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeAllModals();
        }
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.dataset.closeModal);
      });
    });

    // Export Modal Buttons
    el.exportMarkdown.addEventListener('click', exportAsMarkdown);
    el.exportTxt.addEventListener('click', exportAsText);
    el.exportPdf.addEventListener('click', exportAsPdf);
    el.exportHtml.addEventListener('click', exportAsHtml);
    el.btnQuickCopy.addEventListener('click', copyAllToClipboard);

    // Settings Controls
    el.typefacePicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-option');
      if (btn) {
        state.settings.typeface = btn.dataset.val;
        applySettings();
      }
    });

    el.textScalePicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-option');
      if (btn) {
        state.settings.textScale = parseFloat(btn.dataset.val);
        applySettings();
      }
    });

    el.themePicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-option');
      if (btn) {
        applyTheme(btn.dataset.val);
        saveToStorage();
        updatePillPickers();
      }
    });

    el.settingFocusMode.addEventListener('change', (e) => {
      state.settings.focusMode = e.target.checked;
      applySettings();
    });

    el.settingTypewriterMode.addEventListener('change', (e) => {
      state.settings.typewriterMode = e.target.checked;
      applySettings();
    });

    el.settingSoundMode.addEventListener('change', (e) => {
      state.settings.soundMode = e.target.checked;
      applySettings();
    });

    el.settingSpellcheck.addEventListener('change', (e) => {
      state.settings.spellcheck = e.target.checked;
      applySettings();
    });

    el.settingWordGoal.addEventListener('input', (e) => {
      state.settings.wordGoal = parseInt(e.target.value, 10) || 0;
      saveToStorage();
      updateMetrics();
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape key exits Zen Mode, Dictation, Slash Menu, More Menu, or Modals
      if (e.key === 'Escape') {
        if (el.moreMenuDropdown && el.moreMenuDropdown.classList.contains('show')) {
          closeMoreMenu();
          return;
        }
        if (state.dictationActive) {
          stopDictation(false);
          return;
        }
        if (state.slashMenuOpen) {
          hideSlashMenu();
          return;
        }
        if (document.querySelector('.modal-backdrop.open')) {
          closeAllModals();
          return;
        }
        if (state.isSidebarOpen) {
          closeSidebar();
          return;
        }
        if (state.isZenMode) {
          toggleZenMode();
          return;
        }
      }

      // Ctrl + Shift + Y : Toggle Counter
      if (e.ctrlKey && e.shiftKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        state.settings.counterVisible = !(state.settings.counterVisible !== false);
        applySettings();
        saveToStorage();
        return;
      }

      // Ctrl + Shift + M : Toggle Markdown Mode
      if (e.ctrlKey && e.shiftKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        toggleMarkdownMode();
        return;
      }



      // Ctrl + Alt + N : New Page
      if (e.ctrlKey && e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        createNewDoc();
      }

      // Alt + Z or F11 : Zen Mode
      if ((e.altKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'F11') {
        e.preventDefault();
        toggleZenMode();
      }

      // Alt + T : Toggle Theme
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
        saveToStorage();
      }

      // Ctrl + , : Settings Modal
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        openModal('settings-modal');
      }

      // Ctrl + S : Export Modal
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        openModal('export-modal');
      }

      // Ctrl + D : Dictate
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (state.dictationActive) {
          stopDictation(true);
        } else {
          startDictation();
        }
      }

      // Ctrl + E : Inline Code
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        formatText('code');
      }
    });

    // Listen for System Theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.settings.theme === 'system') {
        applyTheme('system');
      }
    });
  }

  // --- Application Initialization ---
  function init() {
    enforceTabTitle();
    loadFromStorage();
    applySettings();
    renderDocContent();
    setupEventListeners();

    // Auto-focus title or editor on open and enable transitions
    setTimeout(() => {
      document.documentElement.classList.remove('disable-all-transitions');
      if (el.docTitle && !el.docTitle.innerText.trim()) {
        el.docTitle.focus();
        setCursorToStart(el.docTitle);
      } else {
        focusCurrentEditor();
      }
    }, 100);
  }

  init();
})();
