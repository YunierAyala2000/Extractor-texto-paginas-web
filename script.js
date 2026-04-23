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
    alert("Ingresa una URL válida");
    return;
  }

  const btn = document.querySelector(".btn-primary");
  btn.textContent = "Extrayendo...";
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
        alert(`"${etiqueta}" no es un nombre de etiqueta HTML válido.`);
        return;
      }
      const elementos = doc.querySelectorAll(etiqueta);
      if (elementos.length === 0) {
        alert(`No se encontró ningún elemento <${etiqueta}> en la página.`);
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
        alert(`No se encontró ningún elemento con la clase "${clase}"`);
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
        alert(`No se encontró ningún elemento con el selector "${selector}"`);
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
    alert(
      "No se pudo obtener el contenido. Todos los proxies fallaron o la URL no es accesible.",
    );
  } finally {
    btn.textContent = "Extraer texto";
    btn.disabled = false;
  }
}

function descargarTexto() {
  const texto = document.getElementById("resultado").value;

  if (!texto) {
    alert("No hay texto para descargar");
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
    alert("No hay texto para copiar. Extrae primero el contenido.");
    return;
  }

  await navigator.clipboard.writeText(texto);

  const btn = document.getElementById("btnCopiar");
  const textoOriginal = btn.innerHTML;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> ¡Copiado!`;
  btn.style.borderColor = "#22c55e";
  btn.style.color = "#22c55e";

  setTimeout(() => {
    btn.innerHTML = textoOriginal;
    btn.style.borderColor = "";
    btn.style.color = "";
  }, 2000);
}
