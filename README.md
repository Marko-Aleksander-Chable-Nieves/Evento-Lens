# Eventolens Web + EventoLens Runner

Sitio estático listo para GitHub Pages. No requiere backend.

## Archivos principales

- `index.html` — sitio principal y simulador de precios.
- `styles.css` — estilos del sitio principal.
- `script.js` — simulador, cupón y comportamiento del sitio.
- `game.html` — EventoLens Runner, página dedicada al juego.
- `game.css` — diseño responsive del juego.
- `game.js` — lógica del juego, monedas, anuncios y cupones.
- `assets/` — video y recursos del sitio.

## Cupones del juego

El juego entrega siempre un cupón al perder:

- `LENS5` — 5% de descuento.
- `LENS10` — 10% de descuento para mejores partidas.
- `LENS15` — 15% de descuento para partidas destacadas.

El botón **Usar cupón y cotizar** abre el simulador con el cupón aplicado automáticamente. También se puede escribir el código manualmente en la sección **Cupón de descuento** del simulador.

> Los cupones son promocionales/demostrativos para el proyecto y el total mostrado por el simulador es una estimación.

## Publicar en GitHub Pages

Sube **el contenido de esta carpeta** a la raíz del repositorio, de modo que `index.html` quede directamente en la raíz.

En GitHub:

1. `Settings` → `Pages`.
2. En **Source**, elige `Deploy from a branch`.
3. Selecciona `main` y `/ (root)`.
4. Guarda los cambios.

La web quedará en una dirección similar a:

`https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`

El juego estará en:

`https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/game.html`


## Experimento Fake Door comercial

La landing incluye un CTA **Quiero contratar Eventolens**. Al pulsarlo se abre el experimento Fake Door, se ofrece un 20% de descuento y se captura una encuesta breve.

La interfaz está lista, pero para recibir respuestas de dispositivos distintos hay que conectar un endpoint en `experiment-config.js`. Mientras `endpoint` esté vacío, las respuestas se guardan solo en el navegador que está haciendo la prueba (`localStorage`).

Para comprobar el estado de conexión sin mostrarlo al público, abre la landing con `?admin=1`.

Cupón del experimento: `LANZA20` (20%).


## Google Sheets conectado

Esta versión ya incluye el endpoint de Google Apps Script del experimento. Las respuestas se envían a la hoja `Respuestas` y también conservan una copia local en el navegador como respaldo.


## v8 - Envío Google Sheets
El formulario Fake Door usa un POST HTML tradicional a Google Apps Script mediante un iframe oculto. Esto evita problemas de CORS de GitHub Pages y entrega los campos mediante `e.parameter`.


## Métricas E2
Esta versión registra VISITA, CTA y ENCUESTA_COMPLETADA en la pestaña `Métricas` del mismo Google Sheet. Para atribuir el QR, usa el enlace de la landing con `?src=qr`. El código actualizado de Apps Script está en `APPS-SCRIPT-METRICAS.txt`.
