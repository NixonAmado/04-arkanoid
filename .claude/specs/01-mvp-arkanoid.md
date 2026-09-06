# SPEC 01 — MVP del juego Arkanoid

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-09-05
> **Objetivo:** Implementar un Arkanoid jugable de principio a fin con los 5 niveles de `levels.js`, controles de teclado y mouse, vidas, puntaje y overlays de inicio/pausa/gameover/victoria, usando solo los sprites del spritesheet (sin audio).

## Scope

**In:**

- Loop de juego completo en `game.js`: física de pelota (rebotes contra paredes, paleta y bloques), colisiones AABB, render en `<canvas>` 800x600.
- Control de paleta con teclado (flechas o A/D) y con mouse (seguimiento horizontal).
- Los 5 niveles definidos en `levels.js`, con `ballSpeedMultiplier` aplicado a la velocidad base de la pelota.
- Progresión automática al siguiente nivel al destruir todos los bloques `alive`.
- Sistema de vidas: inicia en 3. Al caer la pelota, pierde una vida y se reinicia el nivel actual completo (bloques, posición de paleta y pelota).
- Puntaje fijo por bloque destruido (10 puntos), sin importar el color.
- HUD visible durante el juego: score y vidas restantes.
- Overlay de inicio: pantalla previa al nivel 1 que espera input (tecla o click) para arrancar.
- Pausa con tecla (Esc o P): detiene el loop y muestra overlay de pausa; la misma tecla reanuda.
- Overlay de game over al perder la última vida: se queda ahí, sin reinicio automático (requiere recargar la página).
- Overlay de victoria al limpiar el nivel 5: incluye opción (tecla o botón) para reiniciar el juego completo desde el nivel 1.
- Uso de `assets/spritesheet.js` para dibujar paddle, ball y bloques por color, incluyendo animación de explosión (`EXPLOSION_FRAMES`) al destruir un bloque.

**Out of scope (para specs futuras):**

- Sonido (`ball-bounce.mp3`, `break-sound.mp3`) — se deja documentado en CLAUDE.md pero no se integra en este MVP.
- Power-ups o multiplicadores de pelota.
- Tabla de high scores / persistencia entre sesiones.
- Ajustes de dificultad o selección de nivel manual.
- Soporte táctil/mobile.

## Data model

```js
// Estado global del juego (game.js)
gameState = 'start' | 'playing' | 'paused' | 'gameover' | 'win';
score = 0;
lives = 3;
currentLevel = 0; // índice sobre LEVELS

paddle = { x, y, w: 162, h: 14 };
ball = { x, y, w: 16, h: 16, vx, vy };
blocks = [
  { x, y, w, h, color, alive: true },
];
explosions = [
  { x, y, color, frame: 0, startTime },
];
```

Convenciones:

- Origen de coordenadas: esquina superior izquierda del canvas (800x600).
- Velocidades de pelota en píxeles/frame, escaladas por `ballSpeedMultiplier` del nivel activo.
- `blocks` se reconstruye desde `LEVELS[currentLevel].blocks` cada vez que se (re)inicia un nivel (por pérdida de vida o avance de nivel).

## Implementation plan

1. Definir el esqueleto de estado (`gameState`, `score`, `lives`, `currentLevel`, `paddle`, `ball`, `blocks`, `explosions`) y la función `resetLevel(levelIndex)` que carga bloques desde `LEVELS` y posiciona paddle/ball. Prueba manual: cargar `index.html`, ver bloques del nivel 1 dibujados y paddle centrado.
2. Implementar el loop principal (`requestAnimationFrame`) con máquina de estados simple: solo renderiza cuando `gameState === 'playing'`. Prueba manual: sin input, la pelota no se mueve porque `gameState` sigue en `'start'`.
3. Implementar overlay de inicio y transición `'start' -> 'playing'` con tecla/click. Prueba manual: al presionar, arranca el movimiento de la pelota.
4. Implementar controles de paleta (teclado y mouse) con clamp a los límites del canvas. Prueba manual: mover paleta con flechas/A-D y con el mouse.
5. Implementar física de pelota: rebote en paredes laterales/superior, rebote en paleta (ángulo según punto de impacto), detección de caída (y > canvas.height). Prueba manual: la pelota rebota correctamente y cae si la paleta no la intercepta.
6. Implementar colisión pelota-bloque (AABB), marcar `alive: false`, sumar 10 al score, disparar animación de explosión vía `EXPLOSION_FRAMES`. Prueba manual: romper un bloque suma puntaje y muestra explosión.
7. Implementar pérdida de vida: al caer la pelota, decrementar `lives`, y si `lives > 0` llamar `resetLevel(currentLevel)`; si `lives === 0`, pasar a `gameState = 'gameover'`. Prueba manual: perder todas las vidas muestra overlay de game over.
8. Implementar avance de nivel: al no quedar bloques `alive`, si `currentLevel < LEVELS.length - 1` incrementar `currentLevel` y llamar `resetLevel`; si es el último nivel, pasar a `gameState = 'win'`. Prueba manual: limpiar nivel 1 avanza a nivel 2 con nuevo layout.
9. Implementar overlay de pausa con tecla (Esc/P) que alterna `'playing' <-> 'paused'` sin resetear estado. Prueba manual: pausar detiene la pelota, reanudar continúa desde la misma posición.
10. Implementar overlay de victoria final con opción de reinicio completo (`score = 0`, `lives = 3`, `currentLevel = 0`, `resetLevel(0)`, `gameState = 'start'` o `'playing'`). Prueba manual: ganar nivel 5 muestra overlay y el botón/tecla reinicia todo desde el nivel 1.
11. Implementar HUD (score y vidas) dibujado sobre el canvas durante `'playing'` y `'paused'`. Prueba manual: HUD refleja score y vidas actualizados en tiempo real.

## Acceptance criteria

- [x] El juego carga sin errores en consola al abrir `index.html`.
- [x] La pantalla de inicio se muestra antes del nivel 1 y espera tecla/click para arrancar.
- [x] La paleta se mueve con teclado (flechas o A/D) y con mouse.
- [x] La pelota rebota en paredes, techo y paleta; cae si la paleta no la intercepta.
- [x] Romper un bloque suma exactamente 10 puntos y dispara la animación de explosión correspondiente a su color.
- [x] Al perder una vida, el nivel actual se reinicia completo (bloques, paddle, pelota).
- [x] Al llegar a 0 vidas, se muestra el overlay de game over y el juego no reinicia automáticamente.
- [x] Al destruir todos los bloques de un nivel (1-4), el juego avanza automáticamente al siguiente nivel con su propio layout.
- [x] Al destruir todos los bloques del nivel 5, se muestra el overlay de victoria con opción de reiniciar.
- [x] Usar la opción de reinicio en el overlay de victoria vuelve el juego al nivel 1 con score 0 y 3 vidas.
- [x] Presionar la tecla de pausa detiene el loop y muestra overlay de pausa; presionarla de nuevo reanuda desde el mismo estado.
- [x] El HUD muestra el score y las vidas actualizados en todo momento durante `'playing'`/`'paused'`.
- [x] Todos los sprites (paddle, ball, bloques por color) se dibujan usando `assets/spritesheet.js`, sin placeholders de color plano.

## Decisions

- **Sí:** reiniciar el nivel completo al perder una vida (no solo resetear posición). Razón: decisión explícita del usuario, simplifica el estado de bloques a "todo o nada" por vida.
- **Sí:** puntaje fijo por bloque (10 pts) sin tabla por color. Razón: reduce alcance del MVP; una tabla de puntaje por color se puede añadir en spec futura sin romper esta.
- **Sí:** controles duales (teclado + mouse) desde el MVP. Razón: pedido explícito del usuario, ambos son triviales de implementar sobre el mismo estado de `paddle.x`.
- **No:** sonido en el MVP. Razón: usuario decidió dejarlo fuera pese a estar documentado en CLAUDE.md; se integra en spec futura reutilizando los mp3 ya presentes en `assets/sounds/`.
- **No:** persistencia de high scores. Razón: fuera del alcance de un MVP jugable; requiere su propio modelo de datos y decisión de storage.
- **Sí:** overlay de inicio en vez de auto-arranque. Razón: pedido explícito del usuario, evita que la pelota se mueva antes de que el jugador esté listo.

## What is **not** in this spec

- Sonido de rebote y de rotura de bloques.
- Power-ups, multiplicadores o efectos especiales sobre la pelota o la paleta.
- Persistencia de puntajes altos (high scores) entre sesiones.
- Selección manual de nivel o dificultad ajustable.
- Soporte para controles táctiles/mobile.

Cada uno de estos, si se implementa, va en su propia spec.
