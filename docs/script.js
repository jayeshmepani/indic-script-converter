(function () {
  'use strict';

  var THEME_KEY = 'lipimala-docs-theme';
  var LANG_KEY = 'lipimala-docs-code-language';
  var DRAWER_QUERY = '(max-width: 60rem)';
  var THEME_COLORS = { light: '#fbfaf8', dark: '#0f1216' };

  var root = document.documentElement;
  var drawerMedia = window.matchMedia(DRAWER_QUERY);

  function readStore(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Preference simply will not persist. */
    }
  }

  function isDrawerMode() {
    return drawerMedia.matches;
  }

  /* ======================================================================
     Theme
     ====================================================================== */
  function initTheme() {
    var button = document.getElementById('theme-btn');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function apply(theme, persist) {
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;

      var metas = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < metas.length; i += 1) {
        metas[i].setAttribute('content', THEME_COLORS[theme]);
      }

      if (button) {
        var isDark = theme === 'dark';
        button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        var label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
        button.title = label;
        var labelNode = document.getElementById('theme-btn-label');
        if (labelNode) labelNode.textContent = label;
      }

      if (persist) writeStore(THEME_KEY, theme);
    }

    /* The inline head snippet already resolved and painted the theme; this
       only re-syncs the control state. */
    apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

    if (button) {
      button.addEventListener('click', function () {
        apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
      });
    }

    /* Follow the OS while the reader has not made an explicit choice. */
    var onSystemChange = function (event) {
      var stored = readStore(THEME_KEY);
      if (stored !== 'light' && stored !== 'dark') apply(event.matches ? 'dark' : 'light', false);
    };

    if (typeof systemDark.addEventListener === 'function') {
      systemDark.addEventListener('change', onSystemChange);
    } else if (typeof systemDark.addListener === 'function') {
      systemDark.addListener(onSystemChange);
    }
  }

  /* ======================================================================
     Off-canvas navigation drawer
     ====================================================================== */
  function initDrawer() {
    var button = document.getElementById('menu-btn');
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('backdrop');
    var search = document.getElementById('nav-search');
    var content = document.querySelector('.content-col');
    if (!button || !sidebar || !backdrop) return;

    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var isOpen = false;

    function focusableItems() {
      return Array.prototype.filter.call(sidebar.querySelectorAll(FOCUSABLE), function (node) {
        return node.offsetParent !== null || node === document.activeElement;
      });
    }

    function setOpen(open, restoreFocus) {
      isOpen = open;
      sidebar.classList.toggle('is-open', open);
      document.body.classList.toggle('is-nav-open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      var label = open ? 'Close navigation' : 'Open navigation';
      button.title = label;
      var labelNode = document.getElementById('menu-btn-label');
      if (labelNode) labelNode.textContent = label;
      /* When the drawer is open it covers the page; hide the backdrop from the
         a11y tree when closed via the hidden attribute. */
      backdrop.hidden = !open;
      if (content && 'inert' in content) content.inert = open && isDrawerMode();
      if (open) {
        sidebar.setAttribute('aria-modal', 'true');
      } else {
        sidebar.removeAttribute('aria-modal');
      }

      if (open && search) {
        search.focus({ preventScroll: true });
      } else if (!open && restoreFocus) {
        button.focus({ preventScroll: true });
      }
    }

    setOpen(false, false);

    button.addEventListener('click', function () {
      setOpen(button.getAttribute('aria-expanded') !== 'true', false);
    });

    backdrop.addEventListener('click', function () {
      setOpen(false, true);
    });

    sidebar.addEventListener('click', function (event) {
      if (isDrawerMode() && event.target.closest('a[href^="#"]')) setOpen(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen || !isDrawerMode()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, true);
        return;
      }

      if (event.key !== 'Tab') return;

      /* Focus trap: the drawer covers the page, so Tab must not reach it. */
      var items = focusableItems();
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];
      var active = document.activeElement;

      if (!sidebar.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* Leaving drawer mode must not strand the page in the open state. */
    var onModeChange = function () {
      if (!isDrawerMode() && isOpen) setOpen(false, false);
      else if (content && 'inert' in content) content.inert = isOpen && isDrawerMode();
    };
    if (typeof drawerMedia.addEventListener === 'function') {
      drawerMedia.addEventListener('change', onModeChange);
    } else if (typeof drawerMedia.addListener === 'function') {
      drawerMedia.addListener(onModeChange);
    }
  }

  /* ======================================================================
     Sidebar topic filter
     ====================================================================== */
  function initFilter(navLinks) {
    var search = document.getElementById('nav-search');
    var empty = document.getElementById('nav-empty');
    var groups = Array.prototype.slice.call(document.querySelectorAll('.nav-group'));
    if (!search) return;

    function run() {
      var query = search.value.trim().toLowerCase();
      var matches = 0;

      navLinks.forEach(function (link) {
        var hit = !query || link.textContent.toLowerCase().indexOf(query) !== -1;
        link.classList.toggle('is-hidden', !hit);
        if (hit) matches += 1;
      });

      groups.forEach(function (group) {
        group.classList.toggle('is-filtered-out', !group.querySelector('.nav-list a:not(.is-hidden)'));
      });

      if (empty) empty.classList.toggle('is-visible', matches === 0);
    }

    search.addEventListener('input', run);
    search.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && search.value !== '') {
        /* Clear first; a second Escape falls through to closing the drawer. */
        event.stopPropagation();
        search.value = '';
        run();
      }
    });
  }

  /* ======================================================================
     Scroll spy
     ====================================================================== */
  function initScrollSpy(navLinks) {
    var tracked = navLinks
      .map(function (link) {
        var id = link.getAttribute('href').slice(1);
        var section = document.getElementById(id) || document.getElementById(id + '-detail');
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!tracked.length) return;

    var current = null;
    var footerVisible = false;
    var inBand = [];

    function mark(item) {
      if (!item || item === current) return;
      if (current) current.link.removeAttribute('aria-current');
      item.link.setAttribute('aria-current', 'location');
      current = item;
    }

    function resolve() {
      /* At the foot of the page short trailing sections can never reach the
         reading band, so the footer sentinel wins there. */
      if (footerVisible) {
        mark(tracked[tracked.length - 1]);
        return;
      }
      for (var i = 0; i < tracked.length; i += 1) {
        if (inBand.indexOf(tracked[i].section) !== -1) {
          mark(tracked[i]);
          return;
        }
      }
      /* Nothing in the band (a gap between sections): keep the last answer. */
    }

    if (!('IntersectionObserver' in window)) {
      mark(tracked[0]);
      return;
    }

    /* A horizontal reading band just below the sticky header. The topmost
       section overlapping it is the one the reader is looking at. */
    var bandObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var at = inBand.indexOf(entry.target);
          if (entry.isIntersecting && at === -1) inBand.push(entry.target);
          else if (!entry.isIntersecting && at !== -1) inBand.splice(at, 1);
        });
        resolve();
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: 0 }
    );

    tracked.forEach(function (item) {
      bandObserver.observe(item.section);
    });

    var footer = document.querySelector('.site-footer');
    if (footer) {
      new IntersectionObserver(
        function (entries) {
          footerVisible = entries[0].isIntersecting;
          resolve();
        },
        { threshold: 0 }
      ).observe(footer);
    }

    mark(tracked[0]);
  }

  /* ======================================================================
     Code tabs
     ====================================================================== */
  function initCodeTabs() {
    var preferred = readStore(LANG_KEY);

    Array.prototype.forEach.call(document.querySelectorAll('[data-code-tabs]'), function (widget) {
      var tabs = Array.prototype.slice.call(widget.querySelectorAll('[role="tab"]'));
      var panels = Array.prototype.slice.call(widget.querySelectorAll('[role="tabpanel"]'));
      if (!tabs.length) return;

      function activate(tab, moveFocus, persist) {
        tabs.forEach(function (item) {
          var selected = item === tab;
          item.setAttribute('aria-selected', selected ? 'true' : 'false');
          item.tabIndex = selected ? 0 : -1;
        });

        panels.forEach(function (panel) {
          var shown = panel.id === tab.getAttribute('aria-controls');
          panel.classList.toggle('is-active', shown);
          panel.hidden = !shown;
        });

        if (persist) writeStore(LANG_KEY, tab.textContent.trim());
        if (moveFocus) tab.focus();
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () {
          activate(tab, false, true);
        });

        tab.addEventListener('keydown', function (event) {
          var next = null;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(index + 1) % tabs.length];
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(index - 1 + tabs.length) % tabs.length];
          if (event.key === 'Home') next = tabs[0];
          if (event.key === 'End') next = tabs[tabs.length - 1];
          if (!next) return;
          event.preventDefault();
          activate(next, true, true);
        });
      });

      if (preferred) {
        for (var i = 0; i < tabs.length; i += 1) {
          if (tabs[i].textContent.trim() === preferred) {
            activate(tabs[i], false, false);
            break;
          }
        }
      }
    });
  }

  /* ======================================================================
     Copy buttons
     ====================================================================== */
  var toast = document.getElementById('toast');
  var toastTimer = null;

  function announce(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    /* Clearing first makes repeated identical messages re-announce. */
    toast.textContent = '';
    window.setTimeout(function () {
      toast.textContent = message;
      toast.classList.add('is-visible');
      toastTimer = window.setTimeout(function () {
        toast.classList.remove('is-visible');
        toast.textContent = '';
      }, 2600);
    }, 60);
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.insetBlockStart = '-100vh';
      document.body.appendChild(field);
      field.select();
      try {
        if (document.execCommand('copy')) resolve();
        else reject(new Error('execCommand returned false'));
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(field);
      }
    });
  }

  function initCopyButtons() {
    var blocks = document.querySelectorAll('.content pre');

    Array.prototype.forEach.call(blocks, function (pre) {
      var code = pre.querySelector('code');
      if (!code) return;

      var language = pre.getAttribute('data-lang') || 'Code';

      var shell = document.createElement('div');
      shell.className = 'code-block';

      var toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';

      var name = document.createElement('span');
      name.className = 'code-lang';
      var dotClass = LANG_DOT_CLASS[language];
      if (dotClass) {
        var dot = document.createElement('span');
        dot.className = 'tab-dot ' + dotClass;
        dot.setAttribute('aria-hidden', 'true');
        name.appendChild(dot);
      }
      name.appendChild(document.createTextNode(language));

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy ' + language + ' example to clipboard');

      button.addEventListener('click', function () {
        copyText(code.textContent)
          .then(function () {
            button.textContent = 'Copied';
            button.dataset.state = 'done';
            announce(language + ' example copied to clipboard.');
            window.setTimeout(function () {
              button.textContent = 'Copy';
              delete button.dataset.state;
            }, 2000);
          })
          .catch(function () {
            announce('Copying was blocked. Select the code and copy it manually.');
          });
      });

      toolbar.appendChild(name);
      toolbar.appendChild(button);

      pre.parentNode.insertBefore(shell, pre);
      shell.appendChild(toolbar);
      shell.appendChild(pre);

      /* The panel now holds a focusable control, so it no longer needs to be
         a tab stop of its own. */
      var panel = shell.closest('[role="tabpanel"]');
      if (panel) panel.removeAttribute('tabindex');
    });
  }

  /* ======================================================================
     Scrollable tables

     The markup ships each table wrapper as a focusable region so the rows
     stay keyboard-reachable without JavaScript. Once we are running we can
     tell whether a wrapper actually scrolls, and drop the tab stop and the
     landmark from the ones that do not.
     ====================================================================== */
  function initScrollableRegions() {
    var wraps = Array.prototype.slice.call(document.querySelectorAll('.table-wrap'));
    if (!wraps.length) return;

    function sync(wrap) {
      var scrollable = wrap.scrollWidth - wrap.clientWidth > 1;
      /* Keep role=region + aria-labelledby from markup when the table scrolls
         so keyboard users can enter the region; non-scrolling tables rely on
         the native <caption> alone and should not become extra tab stops. */
      if (scrollable) {
        wrap.setAttribute('tabindex', '0');
        if (!wrap.getAttribute('role')) wrap.setAttribute('role', 'region');
      } else {
        wrap.removeAttribute('tabindex');
        /* Drop region role only if it was only for keyboard scrolling. */
        if (wrap.getAttribute('role') === 'region') wrap.removeAttribute('role');
      }
      wrap.classList.toggle('is-scrollable', scrollable);
    }

    wraps.forEach(sync);

    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          sync(entry.target);
        });
      });
      wraps.forEach(function (wrap) {
        observer.observe(wrap);
      });
    } else {
      window.addEventListener('resize', function () {
        wraps.forEach(sync);
      });
    }
  }

  /* ======================================================================
     Section-number chips

     Wraps the leading "N." of each top-level heading ("1. What lipimala
     does") in a styled span. Purely a DOM regrouping: the two resulting
     nodes' text concatenates back to the exact original string, so the
     heading's accessible name and searchable text are unchanged.
     ====================================================================== */
  function initSectionNumbers() {
    var headings = document.querySelectorAll('.doc-section > h2[id]');

    Array.prototype.forEach.call(headings, function (heading) {
      var node = heading.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) return;

      var match = /^(\d+\.)(\s*)/.exec(node.textContent);
      if (!match) return;

      var rest = node.textContent.slice(match[0].length);
      var chip = document.createElement('span');
      chip.className = 'sec-num';
      chip.setAttribute('aria-hidden', 'true');
      chip.textContent = match[1];

      var restNode = document.createTextNode(match[2] + rest);
      heading.replaceChild(restNode, node);
      heading.insertBefore(chip, restNode);
    });
  }

  /* ======================================================================
     Syntax highlighting

     A small hand-rolled, regex-based tokenizer per language — no vendored
     highlighting library. Runs once over each code sample's existing text
     and rewrites it as escaped text interleaved with token spans; copy
     buttons keep working unchanged because `code.textContent` reconstructs
     the original plain string regardless of the markup inside it.
     ====================================================================== */
  var LANG_DOT_CLASS = { Dart: 'tab-dot-dart', JavaScript: 'tab-dot-js', Python: 'tab-dot-py', PHP: 'tab-dot-php' };

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var LANG_KEYWORDS = {
    dart: ['import', 'export', 'library', 'part', 'final', 'const', 'var', 'class', 'extends', 'implements',
      'return', 'void', 'new', 'true', 'false', 'null', 'static', 'required', 'this', 'if', 'else', 'for',
      'while', 'async', 'await', 'typedef', 'enum', 'case', 'switch', 'break', 'continue', 'throw', 'try', 'catch'],
    javascript: ['import', 'export', 'from', 'default', 'const', 'let', 'var', 'function', 'return', 'new',
      'true', 'false', 'null', 'undefined', 'class', 'extends', 'async', 'await', 'if', 'else', 'for', 'while',
      'typeof', 'instanceof', 'throw', 'try', 'catch'],
    python: ['import', 'from', 'as', 'def', 'return', 'class', 'if', 'elif', 'else', 'for', 'while', 'True',
      'False', 'None', 'with', 'async', 'await', 'lambda', 'raise', 'try', 'except', 'in', 'is', 'not', 'and', 'or'],
    php: ['use', 'function', 'echo', 'print', 'return', 'new', 'true', 'false', 'null', 'class', 'public',
      'private', 'protected', 'const', 'static', 'if', 'else', 'foreach', 'as', 'require', 'require_once',
      'namespace', 'readonly', 'final'],
    json: ['true', 'false', 'null']
  };

  function buildLangRegex(lang) {
    var kw = LANG_KEYWORDS[lang] || [];
    var comment = lang === 'python'
      ? '#[^\\n]*'
      : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/';
    var string = '`(?:\\\\.|[^`\\\\])*`|\'(?:\\\\.|[^\'\\\\])*\'|"(?:\\\\.|[^"\\\\])*"';
    var number = '\\b\\d+(?:\\.\\d+)?\\b';
    var keyword = kw.length ? '\\b(?:' + kw.join('|') + ')\\b' : '(?!)';
    var typeName = '\\b[A-Z][A-Za-z0-9_]*\\b';
    var fnCall = '[A-Za-z_$][\\w$]*(?=\\()';

    return new RegExp(
      '(' + comment + ')|(' + string + ')|(' + number + ')|(' + keyword + ')|(' + typeName + ')|(' + fnCall + ')',
      'g'
    );
  }

  var LANG_REGEX = {};

  function highlightSource(text, lang) {
    if (!LANG_KEYWORDS[lang]) return escapeHtml(text);
    if (!LANG_REGEX[lang]) LANG_REGEX[lang] = buildLangRegex(lang);

    var regex = LANG_REGEX[lang];
    var out = '';
    var last = 0;
    var match;

    regex.lastIndex = 0;
    while ((match = regex.exec(text))) {
      out += escapeHtml(text.slice(last, match.index));
      var cls = match[1] ? 'tk-com' : match[2] ? 'tk-str' : match[3] ? 'tk-num'
        : match[4] ? 'tk-kw' : match[5] ? 'tk-typ' : 'tk-fn';
      out += '<span class="' + cls + '">' + escapeHtml(match[0]) + '</span>';
      last = regex.lastIndex;
      if (match[0] === '') regex.lastIndex += 1;
    }
    out += escapeHtml(text.slice(last));
    return out;
  }

  function initSyntaxHighlight() {
    var blocks = document.querySelectorAll('.content pre > code[class*="language-"]');

    Array.prototype.forEach.call(blocks, function (code) {
      var langMatch = /language-(\w+)/.exec(code.className);
      if (!langMatch) return;
      code.innerHTML = highlightSource(code.textContent, langMatch[1].toLowerCase());
    });
  }

  /* ======================================================================
     Heading anchors
     ====================================================================== */
  function initHeadingAnchors() {
    var headings = document.querySelectorAll('.content h2[id], .content h3[id]');

    Array.prototype.forEach.call(headings, function (heading) {
      var link = document.createElement('a');
      link.className = 'heading-anchor';
      link.href = '#' + heading.id;
      link.setAttribute('aria-label', 'Permalink to “' + heading.textContent.trim() + '”');

      var glyph = document.createElement('span');
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = '#';

      link.appendChild(glyph);
      heading.appendChild(link);
    });
  }

  /* ======================================================================
     Hero live demo

     A small, self-contained subset of the real IAST → Devanagari/Gujarati
     mapping tables, used only to make the hero card genuinely interactive.
     It is illustrative, not the library: it covers common consonants,
     vowels, virama, anusvara, visarga, avagraha, and the oṃ sign, which is
     enough for the sample chips and typical short IAST words. The markup
     ships with a static, matching example already in place, so the card is
     complete and readable with this script absent.
     ====================================================================== */
  var DEMO_VOWEL_INDEP = {
    deva: { a: 'अ', 'ā': 'आ', i: 'इ', 'ī': 'ई', u: 'उ', 'ū': 'ऊ', 'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ḷ': 'ऌ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ' },
    gujr: { a: 'અ', 'ā': 'આ', i: 'ઇ', 'ī': 'ઈ', u: 'ઉ', 'ū': 'ઊ', 'ṛ': 'ઋ', 'ṝ': 'ૠ', 'ḷ': 'ઌ', e: 'એ', ai: 'ઐ', o: 'ઓ', au: 'ઔ' }
  };
  var DEMO_MATRA = {
    a: '', 'ā': 'ा', i: 'ि', 'ī': 'ी', u: 'ु', 'ū': 'ू', 'ṛ': 'ृ', 'ṝ': 'ॄ', 'ḷ': 'ॢ', e: 'े', ai: 'ै', o: 'ो', au: 'ौ'
  };
  var DEMO_MATRA_GUJR = {
    a: '', 'ā': 'ા', i: 'િ', 'ī': 'ી', u: 'ુ', 'ū': 'ૂ', 'ṛ': 'ૃ', 'ṝ': 'ૄ', 'ḷ': 'ૢ', e: 'ે', ai: 'ૈ', o: 'ો', au: 'ૌ'
  };
  var DEMO_CONSONANT = {
    deva: {
      kh: 'ख', gh: 'घ', ch: 'छ', jh: 'झ', 'ṭh': 'ठ', 'ḍh': 'ढ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ', sh: 'श',
      k: 'क', g: 'ग', 'ṅ': 'ङ', c: 'च', j: 'ज', 'ñ': 'ञ', 'ṭ': 'ट', 'ḍ': 'ड', 'ṇ': 'ण', t: 'त', d: 'द',
      n: 'न', p: 'प', b: 'ब', m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', 'ś': 'श', 'ṣ': 'ष', s: 'स', h: 'ह', x: 'ख', w: 'व'
    },
    gujr: {
      kh: 'ખ', gh: 'ઘ', ch: 'છ', jh: 'ઝ', 'ṭh': 'ઠ', 'ḍh': 'ઢ', th: 'થ', dh: 'ધ', ph: 'ફ', bh: 'ભ', sh: 'શ',
      k: 'ક', g: 'ગ', 'ṅ': 'ઙ', c: 'ચ', j: 'જ', 'ñ': 'ઞ', 'ṭ': 'ટ', 'ḍ': 'ડ', 'ṇ': 'ણ', t: 'ત', d: 'દ',
      n: 'ન', p: 'પ', b: 'બ', m: 'મ', y: 'ય', r: 'ર', l: 'લ', v: 'વ', 'ś': 'શ', 'ṣ': 'ષ', s: 'સ', h: 'હ', x: 'ખ', w: 'વ'
    }
  };
  var DEMO_MARKS = {
    deva: { virama: '्', anusvara: 'ं', visarga: 'ः', avagraha: 'ऽ', om: 'ॐ', danda: '।' },
    gujr: { virama: '્', anusvara: 'ં', visarga: 'ઃ', avagraha: 'ઽ', om: 'ૐ', danda: '।' }
  };
  var DEMO_CONS2 = ['kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh', 'sh'];
  var DEMO_VOW2 = ['ai', 'au'];
  var DEMO_VOW1 = ['a', 'ā', 'i', 'ī', 'u', 'ū', 'ṛ', 'ṝ', 'ḷ', 'e', 'o'];

  function demoStripAccents(text) {
    /* Removes standalone combining marks (Vedic svara accents) without
       touching precomposed IAST letters such as ā, ī, ṇ, which are single
       code points, not base+combining pairs. */
    return text.replace(/[\u0300-\u036f]/g, '');
  }

  function demoTokenize(text) {
    var tokens = [];
    var i = 0;
    while (i < text.length) {
      var two = text.slice(i, i + 2);
      var one = text[i];
      if (DEMO_CONS2.indexOf(two) !== -1) { tokens.push({ t: 'c', v: two }); i += 2; continue; }
      if (DEMO_VOW2.indexOf(two) !== -1) { tokens.push({ t: 'v', v: two }); i += 2; continue; }
      if (Object.prototype.hasOwnProperty.call(DEMO_CONSONANT.deva, one)) { tokens.push({ t: 'c', v: one }); i += 1; continue; }
      if (DEMO_VOW1.indexOf(one) !== -1) { tokens.push({ t: 'v', v: one }); i += 1; continue; }
      if (one === 'ṃ' || one === 'ṁ') { tokens.push({ t: 'anusvara' }); i += 1; continue; }
      if (one === 'ḥ') { tokens.push({ t: 'visarga' }); i += 1; continue; }
      if (one === "'" || one === '\u2019') { tokens.push({ t: 'avagraha' }); i += 1; continue; }
      tokens.push({ t: 'lit', v: one });
      i += 1;
    }
    return tokens;
  }

  function demoRender(text, script) {
    var src = demoStripAccents(text).toLowerCase();
    var tokens = demoTokenize(src);
    var consonants = DEMO_CONSONANT[script];
    var indep = DEMO_VOWEL_INDEP[script];
    var matra = script === 'gujr' ? DEMO_MATRA_GUJR : DEMO_MATRA;
    var marks = DEMO_MARKS[script];
    var out = '';
    var i = 0;

    while (i < tokens.length) {
      var tok = tokens[i];

      if (tok.t === 'c') {
        var run = [];
        while (i < tokens.length && tokens[i].t === 'c') { run.push(tokens[i].v); i += 1; }
        var next = tokens[i];
        if (next && next.t === 'v') {
          for (var j = 0; j < run.length - 1; j += 1) out += (consonants[run[j]] || run[j]) + marks.virama;
          out += consonants[run[run.length - 1]] || run[run.length - 1];
          out += matra[next.v] !== undefined ? matra[next.v] : '';
          i += 1;
        } else {
          run.forEach(function (c) { out += (consonants[c] || c) + marks.virama; });
        }
        continue;
      }

      if (tok.t === 'v') { out += indep[tok.v] || tok.v; i += 1; continue; }
      if (tok.t === 'anusvara') { out += marks.anusvara; i += 1; continue; }
      if (tok.t === 'visarga') { out += marks.visarga; i += 1; continue; }
      if (tok.t === 'avagraha') { out += marks.avagraha; i += 1; continue; }

      out += tok.v === '\u0964' ? marks.danda : tok.v;
      i += 1;
    }

    /* Illustrative omPolicy: "useOmSign" — render a literal trailing o+anusvara as the om glyph. */
    out = out.replace(indep.o + marks.anusvara, marks.om);
    return out.trim();
  }

  function demoFnv1a(text) {
    var hash = 0x811c9dc5;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return ('00000000' + hash.toString(16)).slice(-8);
  }

  function initLiveDemo() {
    var card = document.querySelector('[data-live-demo]');
    if (!card) return;

    var input = card.querySelector('#demo-input');
    var outDeva = card.querySelector('#demo-out-deva');
    var outGujr = card.querySelector('#demo-out-gujr');
    var embed = card.querySelector('#demo-embed');
    var trailer = card.querySelector('#demo-trailer');
    var chips = Array.prototype.slice.call(card.querySelectorAll('.chip-sample'));
    if (!input || !outDeva || !outGujr) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function flash(el) {
      if (reduceMotion) return;
      el.classList.remove('flash');
      /* eslint-disable-next-line no-unused-expressions */
      void el.offsetWidth;
      el.classList.add('flash');
    }

    function updateTrailer(source, rendered) {
      if (!trailer) return;
      var payload = 'LIT1:' + demoFnv1a(source) + ':' + demoFnv1a(rendered);
      trailer.hidden = false;
      trailer.title = payload + ' (illustrative Unicode-Tag trailer, dual FNV-1a checksums)';
      trailer.textContent = payload.length > 26 ? payload.slice(0, 26) + '\u2026' : payload;
    }

    function run() {
      var text = input.value;
      var deva = text ? demoRender(text, 'deva') : '';
      var gujr = text ? demoRender(text, 'gujr') : '';
      outDeva.textContent = deva || '\u2014';
      outGujr.textContent = gujr || '\u2014';
      flash(outDeva);
      flash(outGujr);
      if (embed && embed.checked) updateTrailer(text, deva);
    }

    var debounceTimer = null;
    input.addEventListener('input', function () {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(run, 120);
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        input.value = chip.getAttribute('data-sample') || '';
        input.focus();
        run();
      });
    });

    if (embed) {
      embed.addEventListener('change', function () {
        if (embed.checked) run();
        else if (trailer) trailer.hidden = true;
      });
    }
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  function start() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));

    initTheme();
    initDrawer();
    initFilter(navLinks);
    initLiveDemo();
    initSectionNumbers();
    initSyntaxHighlight();
    initCodeTabs();
    initCopyButtons();
    initScrollableRegions();
    initHeadingAnchors();
    initScrollSpy(navLinks);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
