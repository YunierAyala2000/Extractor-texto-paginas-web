# 🧾 Extractor de Texto desde una URL (HTML + CSS + JavaScript)

## 🎯 Objetivo

Crear una página web que:

1. Solicite una URL
2. Obtenga el contenido HTML
3. Extraiga el texto visible
4. Permita descargarlo como archivo `.txt`

---

## ⚠️ Importante (Limitación clave)

Los navegadores bloquean peticiones a muchas URLs externas por **CORS (Cross-Origin Resource Sharing)**.

👉 Esto significa:

- ❌ No podrás extraer contenido de cualquier sitio
- ✅ Solo funcionará con sitios que permitan CORS

---

## 📁 Estructura del proyecto

---

## 1️⃣ Crear el archivo HTML

Crea `index.html`:

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

## 2️⃣ Crear los estilos body { font-family: Arial, sans-serif; padding: 20px; }
input { width: 70%; padding: 10px; margin-bottom: 10px; } textarea { width:
100%; margin-top: 10px; padding: 10px; } ## 1️⃣ Crear el archivo HTML async
function extraerTexto() { const url = document.getElementById("urlInput").value;
if (!url) { alert("Ingresa una URL válida"); return; } try { const response =
await fetch(url); const html = await response.text(); // Parsear HTML const
parser = new DOMParser(); const doc = parser.parseFromString(html, "text/html");
// Obtener texto visible let texto = doc.body.innerText; // Limpiar espacios
texto = texto.replace(/\s+/g, " ").trim();
document.getElementById("resultado").value = texto; } catch (error) {
console.error(error); alert("No se pudo obtener el contenido (posible error
CORS)"); } }
```
