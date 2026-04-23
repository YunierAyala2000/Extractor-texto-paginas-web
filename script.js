const LANGS = {
  es: {
    title: "Extractor de Texto",
    subtitle: "Obtén el texto visible de cualquier página web",
    urlLabel: "URL de la página",
    urlPlaceholder: "https://ejemplo.com",
    optionalFilters: "Filtros opcionales",
    tagLabel: "Etiqueta HTML",
    tagPlaceholder: "ej: p, h1, span, li",
    classLabel: "Clase CSS",
    classPlaceholder: "ej: article-body, post-title",
    selectorLabel: "Selector avanzado",
    selectorPlaceholder: "ej: #main, .content, article",
    extractBtn: "Extraer texto",
    extracting: "Extrayendo...",
    resultLabel: "Resultado",
    copyBtn: "Copiar",
    copied: "¡Copiado!",
    downloadBtn: "Descargar .txt",
    resultPlaceholder: "Aquí aparecerá el texto extraído...",
    devBy: "Desarrollado por",
    alertUrl: "Ingresa una URL válida",
    alertInvalidTag: (t) => `"${t}" no es un nombre de etiqueta HTML válido.`,
    alertTagNotFound: (t) =>
      `No se encontró ningún elemento <${t}> en la página.`,
    alertClassNotFound: (c) =>
      `No se encontró ningún elemento con la clase "${c}"`,
    alertSelectorNotFound: (s) =>
      `No se encontró ningún elemento con el selector "${s}"`,
    alertProxyFail:
      "No se pudo obtener el contenido. Todos los proxies fallaron o la URL no es accesible.",
    alertNoCopy: "No hay texto para copiar. Extrae primero el contenido.",
    alertNoDownload: "No hay texto para descargar",
  },
  en: {
    title: "Text Extractor",
    subtitle: "Get the visible text from any web page",
    urlLabel: "Page URL",
    urlPlaceholder: "https://example.com",
    optionalFilters: "Optional filters",
    tagLabel: "HTML Tag",
    tagPlaceholder: "e.g.: p, h1, span, li",
    classLabel: "CSS Class",
    classPlaceholder: "e.g.: article-body, post-title",
    selectorLabel: "Advanced selector",
    selectorPlaceholder: "e.g.: #main, .content, article",
    extractBtn: "Extract text",
    extracting: "Extracting...",
    resultLabel: "Result",
    copyBtn: "Copy",
    copied: "Copied!",
    downloadBtn: "Download .txt",
    resultPlaceholder: "Extracted text will appear here...",
    devBy: "Developed by",
    alertUrl: "Enter a valid URL",
    alertInvalidTag: (t) => `"${t}" is not a valid HTML tag name.`,
    alertTagNotFound: (t) => `No <${t}> element was found on the page.`,
    alertClassNotFound: (c) => `No element with class "${c}" was found`,
    alertSelectorNotFound: (s) =>
      `No element matching selector "${s}" was found`,
    alertProxyFail:
      "Could not retrieve content. All proxies failed or the URL is not accessible.",
    alertNoCopy: "No text to copy. Extract content first.",
    alertNoDownload: "No text to download",
  },
};

let currentLang = localStorage.getItem("lang") || "es";

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  const t = LANGS[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  document.getElementById("i18n-title").textContent = t.title;
  document.getElementById("i18n-subtitle").textContent = t.subtitle;
  document.getElementById("i18n-urlLabel").textContent = t.urlLabel;
  document.getElementById("i18n-optionalFilters").textContent =
    t.optionalFilters;
  document.getElementById("i18n-tagLabel").textContent = t.tagLabel;
  document.getElementById("i18n-classLabel").textContent = t.classLabel;
  document.getElementById("i18n-selectorLabel").textContent = t.selectorLabel;
  document.getElementById("i18n-extractBtn").textContent = t.extractBtn;
  document.getElementById("i18n-resultLabel").textContent = t.resultLabel;
  document.getElementById("i18n-copyBtn").textContent = t.copyBtn;
  document.getElementById("i18n-downloadBtn").textContent = t.downloadBtn;
  document.getElementById("i18n-devBy").textContent = t.devBy;
  document.getElementById("urlInput").placeholder = t.urlPlaceholder;
  document.getElementById("etiquetaInput").placeholder = t.tagPlaceholder;
  document.getElementById("claseInput").placeholder = t.classPlaceholder;
  document.getElementById("selectorInput").placeholder = t.selectorPlaceholder;
  document.getElementById("resultado").placeholder = t.resultPlaceholder;
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

const PROXIES = [
  {
    buildUrl: (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    getHtml: async (response) => await response.text(),
  },
  {
    buildUrl: (url) =>
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    getHtml: async (response) => {
      const data = await response.json();
      return data.contents;
    },
  },
  {
    buildUrl: (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
    getHtml: async (response) => await response.text(),
  },
];

async function fetchConProxy(url) {
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.buildUrl(url);
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) continue;
      const html = await proxy.getHtml(response);
      if (html && html.length > 0) return html;
    } catch (e) {
      console.warn("Proxy falló, intentando el siguiente...", e);
    }
  }
  throw new Error("Todos los proxies fallaron");
}

async function extraerTexto() {
  const url = document.getElementById("urlInput").value.trim();
  const etiqueta = document
    .getElementById("etiquetaInput")
    .value.trim()
    .toLowerCase();
  const clase = document.getElementById("claseInput").value.trim();
  const selector = document.getElementById("selectorInput").value.trim();

  if (!url) {
    alert(LANGS[currentLang].alertUrl);
    return;
  }

  const btn = document.querySelector(".btn-primary");
  document.getElementById("i18n-extractBtn").textContent =
    LANGS[currentLang].extracting;
  btn.disabled = true;

  try {
    const html = await fetchConProxy(url);

    // Parsear HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Obtener texto según clase, selector avanzado, o el body completo
    let texto = "";

    if (etiqueta) {
      // Validar que sea un nombre de etiqueta simple (solo letras y números)
      if (!/^[a-z][a-z0-9]*$/i.test(etiqueta)) {
        alert(LANGS[currentLang].alertInvalidTag(etiqueta));
        return;
      }
      const elementos = doc.querySelectorAll(etiqueta);
      if (elementos.length === 0) {
        alert(LANGS[currentLang].alertTagNotFound(etiqueta));
        return;
      }
      texto = Array.from(elementos)
        .map((el) =>
          (el.innerText || el.textContent).replace(/\s+/g, " ").trim(),
        )
        .filter((t) => t.length > 0)
        .join("\n\n");
    } else if (clase) {
      // Buscar TODOS los elementos con esa clase
      const elementos = doc.querySelectorAll(`.${clase}`);
      if (elementos.length === 0) {
        alert(LANGS[currentLang].alertClassNotFound(clase));
        return;
      }
      texto = Array.from(elementos)
        .map((el) =>
          (el.innerText || el.textContent).replace(/\s+/g, " ").trim(),
        )
        .filter((t) => t.length > 0)
        .join("\n\n");
    } else if (selector) {
      const elemento = doc.querySelector(selector);
      if (!elemento) {
        alert(LANGS[currentLang].alertSelectorNotFound(selector));
        return;
      }
      texto = (elemento.innerText || elemento.textContent)
        .replace(/\s+/g, " ")
        .trim();
    } else {
      texto = (doc.body.innerText || doc.body.textContent)
        .replace(/\s+/g, " ")
        .trim();
    }

    document.getElementById("resultado").value = texto;
    document.getElementById("btnCopiar").disabled = !texto;
    document.getElementById("btnDescargarResultado").disabled = !texto;
  } catch (error) {
    console.error(error);
    alert(LANGS[currentLang].alertProxyFail);
  } finally {
    document.getElementById("i18n-extractBtn").textContent =
      LANGS[currentLang].extractBtn;
    btn.disabled = false;
  }
}

function descargarTexto() {
  const texto = document.getElementById("resultado").value;

  if (!texto) {
    alert(LANGS[currentLang].alertNoDownload);
    return;
  }

  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "texto_extraido.txt";
  a.click();

  URL.revokeObjectURL(url);
}

async function copiarTexto() {
  const texto = document.getElementById("resultado").value;

  if (!texto) {
    alert(LANGS[currentLang].alertNoCopy);
    return;
  }

  await navigator.clipboard.writeText(texto);

  const btn = document.getElementById("btnCopiar");
  const span = document.getElementById("i18n-copyBtn");
  const t = LANGS[currentLang];

  span.textContent = t.copied;
  btn.style.borderColor = "#22c55e";
  btn.style.color = "#22c55e";

  setTimeout(() => {
    span.textContent = t.copyBtn;
    btn.style.borderColor = "";
    btn.style.color = "";
  }, 2000);
}

applyLang(currentLang);
