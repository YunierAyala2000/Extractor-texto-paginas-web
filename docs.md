# Extractor de Texto desde una URL

Aplicación web que obtiene el contenido HTML de una URL, extrae su texto visible y permite descargarlo como archivo `.txt`. Funciona completamente en el navegador, sin backend.

---

## Características

- Extrae el texto de cualquier URL accesible públicamente
- Filtra por **clase CSS** para extraer solo una sección específica
- Soporte de **selector CSS avanzado** (`#id`, `.clase`, `etiqueta`)
- Reintenta automáticamente con **3 proxies CORS** en cascada si el primero falla
- Descarga el resultado como archivo `.txt`

---

## Requisitos

Solo necesitas un navegador moderno. No se requiere instalar nada ni usar un servidor local.

---

## Estructura del proyecto

```
Extractor-texto-paginas-web/
├── index.html
├── styles.css
└── script.js
```

---

## Paso 1 — Crear `index.html`

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Extractor de Texto</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Extractor de texto de una URL</h1>

    <input type="text" id="urlInput" placeholder="https://ejemplo.com" />
    <input
      type="text"
      id="claseInput"
      placeholder="Clase CSS (ej: article-body, title) — extrae todos los elementos"
    />
    <input
      type="text"
      id="selectorInput"
      placeholder="Selector avanzado opcional: #id, .clase, etiqueta"
    />
    <button onclick="extraerTexto()">Extraer</button>

    <textarea
      id="resultado"
      rows="15"
      placeholder="Aquí aparecerá el texto..."
    ></textarea>

    <br />
    <button onclick="descargarTexto()">Descargar TXT</button>

    <script src="script.js"></script>
  </body>
</html>
```

---

## Paso 2 — Crear `styles.css`

```css
body {
  font-family: Arial, sans-serif;
  padding: 20px;
}

input {
  width: 70%;
  padding: 10px;
  margin-bottom: 10px;
  display: block;
}

textarea {
  width: 100%;
  margin-top: 10px;
  padding: 10px;
}
```

---

## Paso 3 — Crear `script.js`

```js
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

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let texto = "";

    if (clase) {
      // Extrae TODOS los elementos que tengan esa clase
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
      // Extrae el primer elemento que coincida con el selector
      const elemento = doc.querySelector(selector);
      if (!elemento) {
        alert(`No se encontró ningún elemento con el selector "${selector}"`);
        return;
      }
      texto = (elemento.innerText || elemento.textContent)
        .replace(/\s+/g, " ")
        .trim();
    } else {
      // Sin filtros: extrae todo el texto del body
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
    alert("No hay texto para descargar. Extrae primero el contenido.");
    return;
  }
  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "texto_extraido.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}
```

---

## Cómo usar la aplicación

1. Abre `index.html` directamente en tu navegador (doble clic o arrastrar al navegador).
2. Escribe la URL de la página de la que quieres extraer texto.
3. **Opcional — Filtrar por sección:**
   - **Clase CSS:** escribe el nombre de una clase (sin el punto), por ejemplo `article-body`. Se extraerán todos los elementos que la tengan.
   - **Selector avanzado:** escribe un selector CSS completo, por ejemplo `#contenido`, `.post-title` o `main`. Se extrae solo el primer elemento encontrado.
   - Si dejas ambos campos vacíos se extrae todo el texto del `<body>`.
4. Haz clic en **Extraer**.
5. Cuando aparezca el texto, haz clic en **Descargar TXT** para guardar el resultado.

---

## Cómo funcionan los proxies CORS

Los navegadores bloquean por política de seguridad las peticiones directas a dominios externos (**CORS**). Para evitarlo, el script enruta la petición a través de proxies públicos que recuperan el HTML en nombre del navegador.

Se prueban en este orden, pasando al siguiente si el anterior falla o supera los 8 segundos:

| #   | Proxy                     | Formato de respuesta      |
| --- | ------------------------- | ------------------------- |
| 1   | `corsproxy.io`            | HTML directo              |
| 2   | `api.allorigins.win`      | JSON con campo `contents` |
| 3   | `thingproxy.freeboard.io` | HTML directo              |

> **Nota:** estos proxies son servicios de terceros gratuitos. Si una URL no es accesible desde ninguno de ellos (sitios con login, bloqueo de bots, etc.) la extracción fallará igualmente.

---

## Limitaciones conocidas

- No funciona con páginas que requieren autenticación.
- Contenido generado dinámicamente con JavaScript (SPAs) puede aparecer vacío o incompleto, ya que los proxies devuelven el HTML estático.
- Los proxies gratuitos pueden tener límites de uso o tiempo de respuesta variable.
