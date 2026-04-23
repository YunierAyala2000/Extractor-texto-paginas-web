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
  const clase = document.getElementById("claseInput").value.trim();
  const selector = document.getElementById("selectorInput").value.trim();

  if (!url) {
    alert("Ingresa una URL válida");
    return;
  }

  const btn = document.querySelector("button");
  btn.textContent = "Extrayendo...";
  btn.disabled = true;

  try {
    const html = await fetchConProxy(url);

    // Parsear HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Obtener texto según clase, selector avanzado, o el body completo
    let texto = "";

    if (clase) {
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
  } catch (error) {
    console.error(error);
    alert(
      "No se pudo obtener el contenido. Todos los proxies fallaron o la URL no es accesible.",
    );
  } finally {
    btn.textContent = "Extraer";
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
