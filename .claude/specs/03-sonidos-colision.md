# SPEC 03 — Sonidos de colision

> **Estado:** Draft
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-06
> **Objetivo:** Reproducir un efecto de sonido al chocar la pelota con paredes, bloques y la barra, usando los audios ya existentes en `assets/sounds/`.

## Scope

**In:**

- Sonido al rebotar la pelota contra las paredes (izquierda, derecha, arriba): `ball-bounce.mp3`.
- Sonido al romper un bloque: `break-sound.mp3`.
- Sonido al rebotar la pelota contra la barra (paddle): `ball-bounce.mp3` (mismo audio que paredes).
- Cada tipo de colision usa un unico objeto `Audio` reusable (sin clonar instancias), reiniciando `currentTime = 0` antes de cada `play()` para permitir reproducciones repetidas seguidas.

**Out of scope (para specs futuras):**

- Control de volumen global, mute o slider de audio.
- Sonido distinto para paredes vs barra (ambos comparten `ball-bounce.mp3` en esta spec).
- Sonidos nuevos (musica de fondo, game over, win, etc.).
- Persistencia de preferencias de audio entre sesiones.

## Data model

```js
// game.js — nuevas variables de audio (fuera de gameState)
const sounds = {
  wall: new Audio('assets/sounds/ball-bounce.mp3'),
  paddle: new Audio('assets/sounds/ball-bounce.mp3'),
  block: new Audio('assets/sounds/break-sound.mp3'),
};

function playSound(name) {
  const audio = sounds[name];
  audio.currentTime = 0;
  audio.play();
}
```

Convenciones:

- `wall` y `paddle` son instancias `Audio` separadas (no la misma referencia) aunque apunten al mismo archivo, para poder sonar simultaneamente si la pelota toca ambas cosas en frames cercanos sin cortarse entre si.
- `playSound(name)` se llama desde los puntos existentes de deteccion de colision en `game.js` (rebote contra bordes del canvas, rebote contra `paddle`, destruccion de bloque en `checkBlockCollisions`).
- No se maneja la promesa de `play()` (posible rechazo por autoplay policy) mas alla de dejar que falle silenciosamente si el navegador la bloquea antes de la primera interaccion del usuario.

## Implementation plan

1. Declarar el objeto `sounds` con las 3 instancias de `Audio` y la funcion `playSound(name)` en `game.js`. Prueba manual: cargar el juego no lanza errores en consola.
2. Llamar `playSound('wall')` en el punto donde la pelota rebota contra los bordes izquierdo/derecho/superior del canvas. Prueba manual: la pelota rebota contra una pared y se escucha el sonido.
3. Llamar `playSound('paddle')` en el punto donde la pelota rebota contra la barra. Prueba manual: la pelota rebota contra la barra y se escucha el mismo sonido que en paredes.
4. Llamar `playSound('block')` en `checkBlockCollisions()` junto con `spawnExplosion`/`spawnParticles`, una vez por bloque destruido. Prueba manual: romper un bloque reproduce el sonido de rotura, distinto al de rebote.
5. Verificar que rebotes/roturas consecutivos rapidos (ej. varios bloques seguidos) no rompen el audio ni el loop del juego. Prueba manual: jugar un nivel completo, confirmar que los 3 sonidos se disparan en sus eventos correctos sin cortar el juego ni acumular errores en consola.

## Acceptance criteria

- [ ] Rebotar contra pared izquierda, derecha o superior reproduce `ball-bounce.mp3`.
- [ ] Rebotar contra la barra reproduce `ball-bounce.mp3`.
- [ ] Destruir un bloque reproduce `break-sound.mp3`.
- [ ] Colisiones repetidas y rapidas del mismo tipo (ej. varios bloques seguidos) reproducen el sonido cada vez, sin quedar mudas ni lanzar errores.
- [ ] No se altera el puntaje, vidas, fisica de colision ni progresion de nivel definidos en SPEC 01/02.

## Decisions

- **Si:** reusar `ball-bounce.mp3` tanto para pared como para barra. Razon: no existe un tercer archivo de audio en el proyecto; el usuario prefirio no agregar uno nuevo antes que bloquear la spec.
- **Si:** un objeto `Audio` fijo y reutilizable por tipo de sonido (reiniciando `currentTime`), en vez de clonar `Audio` en cada colision. Razon: pedido explicito del usuario, evita crear instancias nuevas en cada frame.
- **No:** control de volumen/mute en esta spec. Razon: fuera de alcance, el usuario solo pidio los 3 sonidos de colision.

## What is **not** in this spec

- Sonido diferenciado para pared vs barra.
- Mute, volumen o cualquier UI de control de audio.
- Nuevos archivos de sonido o musica de fondo.
- Cambios a las reglas de puntaje, colision o progresion de nivel.

Cada uno de estos, si se implementa, va en su propia spec.
