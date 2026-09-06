# SPEC 02 — Mejora de animación de explosión de bloques

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-06
> **Objetivo:** Enriquecer la destrucción de bloques (ya implementada en SPEC 01) con partículas de fragmento, screen shake y duración de explosión configurable por color.

## Scope

**In:**

- Duración de la animación de explosión (`EXPLOSION_FRAMES`) configurable por color de bloque, en vez del único valor global `EXPLOSION_DURATION`.
- Sistema de partículas: al destruir un bloque, se generan 4-6 fragmentos recortados del sprite `block_<color>` que salen disparados en ángulos aleatorios, caen por gravedad simulada y se desvanecen (fade out) hasta desaparecer.
- Screen shake notorio (~6-10px de desplazamiento, ~200ms) del canvas al destruir un bloque.
- Todo el efecto (explosión + partículas + shake) es puramente visual: no pausa la física de la pelota, el input ni el loop del juego.

**Out of scope (para specs futuras):**

- Sonido asociado a la destrucción de bloques (sigue fuera de alcance, ya documentado en CLAUDE.md).
- Hitstop / freeze-frame al romper un bloque.
- Partículas o shake configurables por el usuario (settings de accesibilidad, reducir movimiento, etc.).
- Cambios a las reglas de puntaje, colisión o progresión de nivel.

## Data model

```js
// game.js — se extiende explosions[] existente
explosions = [
  { x, y, color, frame: 0, startTime, duration }, // duration en ms, tomada de EXPLOSION_DURATIONS[color]
];

// nuevo arreglo de partículas
particles = [
  { x, y, vx, vy, color, sx, sy, sw, sh, startTime, life }, // sx/sy/sw/sh: recorte del spritesheet; life en ms
];

// nuevo estado de shake de pantalla
screenShake = { startTime: null, duration: 0, magnitude: 0 }; // null/0 cuando no hay shake activo
```

```js
// assets/spritesheet.js — reemplaza la constante única EXPLOSION_DURATION
const EXPLOSION_DURATIONS = {
  gray: 150,
  red: 150,
  yellow: 200,
  cyan: 200,
  green: 200,
  magenta: 250,
  hotpink: 250,
};
```

Convenciones:

- `particles` se generan en `spawnExplosion(block)` junto con la entrada de `explosions`, tomando 4-6 sub-recortes de 8x8 del sprite `block_<color>` (`SPRITES.blocks[color]`) en posiciones variadas dentro de sus 32x16 px.
- Velocidad inicial de cada partícula: ángulo aleatorio hacia arriba/lateral, gravedad aplicada cada frame (`vy += GRAVITY`), fade proporcional a `elapsed / life`.
- `screenShake` se activa (se sobreescribe con `startTime = now`, `duration = 200`, `magnitude = 8`) cada vez que se destruye un bloque; si ya había un shake activo, se reinicia (no se acumulan).
- El shake se aplica solo al render (`ctx.translate` con offset aleatorio decreciente), nunca a las coordenadas reales de `paddle`/`ball`/`blocks`.

## Implementation plan

1. Reemplazar `EXPLOSION_DURATION` por `EXPLOSION_DURATIONS` (objeto por color) en `assets/spritesheet.js`, y actualizar `updateExplosions()` en `game.js` para leer la duración desde `explosion.duration` (asignada en `spawnExplosion` según `EXPLOSION_DURATIONS[block.color]`). Prueba manual: romper bloques de distinto color muestra explosiones con duración visualmente distinta (magenta/hotpink más lentas que gray/red).
2. Implementar `spawnParticles(block)`: genera 4-6 partículas con recortes 8x8 de `SPRITES.blocks[block.color]`, velocidad y ángulo aleatorios, y las agrega a `particles[]`. Llamarla desde `checkBlockCollisions()` junto a `spawnExplosion`. Prueba manual: al romper un bloque salen fragmentos de su color disparados desde su posición.
3. Implementar `updateParticles()` (gravedad, movimiento, filtro por `life` agotado) y `drawParticles()` (con alpha decreciente por fade), integrados al loop principal. Prueba manual: las partículas caen, se desvanecen y desaparecen del arreglo tras su `life`.
4. Implementar `triggerScreenShake()` que setea `screenShake` al destruir un bloque, y aplicar el offset de shake en el render principal (`ctx.save/translate/restore` alrededor del dibujo del frame) mientras `screenShake` esté activo, decayendo la magnitud linealmente hasta `duration`. Prueba manual: cada bloque roto produce un temblor visible del canvas que cesa tras ~200ms.
5. Verificar integración completa: romper varios bloques seguidos (incluso en el mismo frame o frames consecutivos) no rompe el loop, no pausa la pelota, y el HUD/estado de juego sigue funcionando igual que en SPEC 01. Prueba manual: jugar un nivel completo, confirmar que explosiones/partículas/shake no afectan colisiones, vidas ni progresión.

## Acceptance criteria

- [ ] Cada color de bloque tiene su propia duración de explosión definida en `EXPLOSION_DURATIONS`, y la animación respeta esa duración por bloque destruido.
- [ ] Al destruir un bloque se generan entre 4 y 6 partículas recortadas del sprite de su color, en posiciones/ángulos variados.
- [ ] Las partículas caen por gravedad simulada y se desvanecen (fade) hasta desaparecer, sin quedar acumuladas indefinidamente en el arreglo `particles`.
- [ ] Al destruir un bloque el canvas tiembla de forma notoria (~6-10px) durante ~200ms y luego vuelve a su posición normal.
- [ ] Romper varios bloques en sucesión rápida no pausa la física de la pelota ni bloquea el input del jugador.
- [ ] Las coordenadas reales de `paddle`, `ball` y `blocks` nunca se ven alteradas por el shake (solo el render).
- [ ] El resto del comportamiento de SPEC 01 (puntaje, vidas, progresión de nivel, HUD) sigue funcionando sin regresiones.

## Decisions

- **Sí:** duración de explosión configurable por color (tabla `EXPLOSION_DURATIONS`), sin significado de dificultad — solo variedad visual. Razón: pedido explícito del usuario.
- **Sí:** partículas como sub-recortes del spritesheet (no rectángulos sólidos). Razón: pedido explícito del usuario, más fiel visualmente al set de sprites existente.
- **Sí:** partículas con gravedad y fade. Razón: pedido explícito del usuario (opción recomendada), da sensación de impacto físico.
- **Sí:** screen shake notorio (~6-10px, ~200ms) en vez de sutil. Razón: pedido explícito del usuario.
- **Sí:** todo el efecto es puramente visual, sin pausar el juego (sin hitstop). Razón: pedido explícito del usuario para mantener la jugabilidad fluida.
- **No:** sonido en esta spec. Razón: sigue fuera de alcance, documentado como pendiente en CLAUDE.md.

## What is **not** in this spec

- Sonido de destrucción de bloques.
- Hitstop / freeze-frame al impacto.
- Configuración de accesibilidad para reducir o desactivar shake/partículas.
- Cambios a las reglas de puntaje, física de colisión o progresión de nivel definidas en SPEC 01.

Cada uno de estos, si se implementa, va en su propia spec.
