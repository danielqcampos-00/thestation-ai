// renderer.js — Converte markdown ou HTML para HTML seguro

// marked e DOMPurify carregados como módulos UMD via lib/
// Usamos importação dinâmica para compatibilidade sem bundler

let _marked = null;
let _purify = null;

async function loadLibs() {
  if (_marked && _purify) return;

  // Carrega marked via script tag se ainda não estiver disponível
  if (typeof marked === 'undefined') {
    await loadScript('/assets/lib/marked.min.js');
  }
  if (typeof DOMPurify === 'undefined') {
    await loadScript('/assets/lib/dompurify.min.js');
  }

  _marked = window.marked;
  _purify = window.DOMPurify;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Renderiza conteúdo para HTML seguro.
 * @param {string} content  — texto do post
 * @param {'markdown'|'html'} format
 * @returns {Promise<string>} HTML sanitizado
 */
export async function renderContent(content, format = 'markdown') {
  if (!content) return '';

  await loadLibs();

  let html = content;

  if (format === 'markdown') {
    _marked.setOptions({ breaks: true, gfm: true });
    html = _marked.parse(content);
  }

  return _purify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1','h2','h3','h4','h5','h6',
      'p','br','hr',
      'strong','em','b','i','u','s','del',
      'a','img',
      'ul','ol','li',
      'blockquote','pre','code',
      'table','thead','tbody','tr','th','td',
      'figure','figcaption',
      'div','span',
    ],
    ALLOWED_ATTR: ['href','src','alt','title','class','target','rel','width','height'],
    ALLOW_DATA_ATTR: false,
  });
}
