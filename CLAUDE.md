# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Juego de Arkanoid en HTML, CSS y JavaScript puro — sin dependencias, cero frameworks. Se abre directamente en el navegador (`open index.html`).

## Desarrollo

No hay paso de build ni servidor requerido. Para probar cambios: `open index.html`.

## Arquitectura

### Archivos principales

| Archivo | Rol |
|---|---|
| `index.html` | Punto de entrada; carga scripts y el `<canvas>` de 800×600 px |
| `game.js` | Toda la lógica del juego (estado, loop, físicas, render, HUD, overlays) |
| `levels.js` | Define `LEVELS`: array de 5 niveles con `blocks[]` y `ballSpeedMultiplier` |
| `assets/spritesheet.js` | Carga el spritesheet y expone helpers de dibujo |

### Assets

- **`assets/spritesheet-breakout.png`** — spritesheet único con todos los sprites
- **`assets/sounds/ball-bounce.mp3`** — rebote contra paredes y paddle
- **`assets/sounds/break-sound.mp3`** — destrucción de bloque

### Audio (en `game.js`)

```js
const sounds = {
  wall: new Audio('assets/sounds/ball-bounce.mp3'),
  paddle: new Audio('assets/sounds/ball-bounce.mp3'), // instancia separada, mismo archivo
  block: new Audio('assets/sounds/break-sound.mp3'),
};
playSound(name) // reinicia currentTime = 0 y llama play(); falla silenciosamente si el navegador bloquea autoplay
```

### API de `spritesheet.js`

```js
loadSpritesheet(cb)                        // carga la imagen; llama cb al terminar
drawSprite(ctx, name, x, y, w, h)          // dibuja un sprite por nombre
drawFrame(ctx, frame, x, y, w, h)          // dibuja un frame de animación
// Constantes exportadas: SPRITES, EXPLOSION_FRAMES, EXPLOSION_DURATIONS
```

### Sprites disponibles

| Nombre | Descripción |
|---|---|
| `paddle` | Paleta (162×14 px) |
| `ball` | Pelota (16×16 px) |
| `block_gray`, `block_red`, `block_yellow`, `block_cyan`, `block_magenta`, `block_hotpink`, `block_green` | Bloques por color |

Las explosiones usan `EXPLOSION_FRAMES[color]` (4 frames) y duran `EXPLOSION_DURATIONS[color]` ms (varía por color).

### Estado del juego (en `game.js`)

```js
gameState   // 'playing' | 'paused' | 'gameover' | 'win'
score       // number
lives       // number (inicia en 3)
currentLevel // número de nivel activo (0-indexed sobre LEVELS)
paddle      // { x, y, w: 162, h: 14 }
ball        // { x, y, w: 16, h: 16, vx, vy }
blocks[]    // [{ x, y, w, h, color, alive }]
explosions[]// animaciones activas
```

## Flujo de trabajo spec-driven

Este proyecto usa desarrollo guiado por specs. **No escribir código sin spec aprobada.**

### Comandos

| Comando | Acción |
|---|---|
| `/spec [descripción]` | Diseña una spec nueva haciendo preguntas primero. Guarda en `.claude/specs/NN-slug.md` con estado `Draft`. |
| `/spec-impl NN-slug` | Implementa la spec aprobada paso a paso, creando rama `spec-NN-slug` y pausando tras cada paso. |

### Ciclo de vida de una spec

```
Draft → Aprobado → Implementado
               ↘ Obsoleto
```

El estado se cambia **manualmente** antes de ejecutar `/spec-impl`. Nunca implementar una spec en estado `Draft`.

### Estructura de una spec (`.claude/specs/NN-slug.md`)

```markdown
# SPEC NN — Título breve

> **Estado:** Draft | Aprobado | Implementado | Obsoleto
> **Depende de:** specs previas requeridas (o "Ninguna")
> **Fecha:** YYYY-MM-DD
> **Objetivo:** una sola frase

## Scope
### In / Out of scope

## Data model
## Implementation plan   ← pasos numerados, cada uno con su prueba manual
## Acceptance criteria   ← checklist booleano
## Decisiones            ← qué se consideró y por qué
## Qué NO incluye este spec
```

### Specs existentes

| Spec | Estado | Resumen |
|---|---|---|
| `01-mvp-arkanoid.md` | Implementado | Juego base: paddle, pelota, bloques, niveles, HUD |
| `02-explosion-mejorada.md` | Implementado | Animación de explosión por color al destruir bloques |
| `03-sonidos-colision.md` | Aprobado/Implementado | Efectos de sonido en colisiones (pared, paddle, bloque) |

Cada rama de feature sigue el nombre `spec-NN-slug` y se mergea vía PR contra `spec-01-mvp-arkanoid` (rama principal del repo).

