# SeedMap

Explorador de semillas (seeds) de Minecraft: mapa interactivo de biomas en 10.000 × 10.000 bloques, con las estructuras generadas marcadas, checklist de progreso y URLs compartibles.

## Uso

1. `npm install`
2. Activa emsdk (emcc en el PATH) y ejecuta `npm run wasm` (clona Cubiomes y genera src/wasm/cubiomes.js y .wasm)
3. `npm run dev`

## Funciones

- **Mapa de biomas** con zoom y arrastre fluidos (Overworld / Nether / End): la generación corre en un **Web Worker**, el hilo principal solo pinta — cero bloqueos
- **Render adaptativo**: la escala de generación se elige según el zoom (celda de ~2–7 px en pantalla, scale 1 solo al máximo acercamiento), cada render incluye un margen del ~40 % y si la vista sigue cubierta por lo ya renderizado **no se vuelve a generar** — arrastrar es gratis; `set_world` se cachea en el worker (no re-configura generadores si la seed/versión no cambió)
- **Vista diorama** (botón ⛰): proyección isométrica del terreno con alturas estimadas por bioma — montañas que se levantan, caras laterales en los acantilados, agua profunda más oscura y sombreado por altitud
- **19 estructuras** con nombres en inglés e iconos pixel-art propios, tooltips y panel lateral con los **10 más cercanos** (botón «Ver todas» para el resto)
- **Variantes diferenciadas**: aldeas (llanura/desierto/sabana/taiga/nieve + zombi), bastiones (vivienda/hoglin/tesoro/puente), ruinas oceánicas (cálidas/frías), iglú (con/sin sótano) y portales en ruinas (gigante/subterráneo, también en el Nether)
- **Tarjetas destacadas** de Trial Chambers y Ancient City (la más cercana sin completar), ocultables con ✕ o ★
- **Checklist**: marca estructuras como hechas (se guarda por seed en el navegador)
- **Selector desplegable** de estructuras visibles con recuento por tipo
- **URL compartible**: la seed, versión, centro, dimensión y zoom viven en el hash (`#s=…&v=…&x=…&z=…&d=…&k=…`)
- **Comando `/tp`** listo para copiar, botón de seed aleatoria 🎲 y conversor de coordenadas ×8 / ÷8 (Overworld ↔ Nether)
- **Versión del juego**: 26.3 usa el modelo 1.21.x de Cubiomes; lo que cambie después no aparece hasta ajustar el motor

### Iconos personalizados

Los iconos son pixel-art 8×8 dibujado en código (`src/icons.js`). Para usar los tuyos, suelta PNGs en `src/icons/custom/` con el nombre de la clave correspondiente (lista en `src/icons/custom/LEEME.txt`) y se usan automáticamente en el mapa, las listas y los chips.

Nota: el mapa se renderiza 100% en el navegador con WebAssembly (Cubiomes). Para regenerar el WASM hace falta Emscripten, pero el repo ya incluye el build listo para `npm run dev`.
