const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const PADDLE_W = 162;
const PADDLE_H = 14;
const BALL_SIZE = 16;
const BASE_BALL_SPEED = 5;
const PADDLE_SPEED = 8;
const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60°
const POINTS_PER_BLOCK = 10;
const STARTING_LIVES = 3;
const PARTICLE_GRAVITY = 0.25;
const PARTICLE_SIZE = 8;
const PARTICLE_LIFE = 500;

let gameState = 'start';
let score = 0;
let lives = STARTING_LIVES;
let currentLevel = 0;

let paddle = { x: 0, y: 0, w: PADDLE_W, h: PADDLE_H };
let ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
let blocks = [];
let explosions = [];
let particles = [];
let screenShake = { startTime: null, duration: 0, magnitude: 0 };
const keys = {};

function clamp( value, min, max ) {
  return Math.min( Math.max( value, min ), max );
}

function resetLevel( levelIndex ) {
  const level = LEVELS[ levelIndex ];
  blocks = level.blocks.map( b => ( { ...b } ) );
  explosions = [];
  particles = [];
  screenShake = { startTime: null, duration: 0, magnitude: 0 };

  paddle.x = ( canvas.width - PADDLE_W ) / 2;
  paddle.y = canvas.height - PADDLE_H - 20;

  ball.x = paddle.x + PADDLE_W / 2 - BALL_SIZE / 2;
  ball.y = paddle.y - BALL_SIZE;
  ball.vx = 0;
  ball.vy = 0;
}

function drawOverlay( title, subtitle ) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = 'bold 36px sans-serif';
  ctx.fillText( title, canvas.width / 2, canvas.height / 2 - 10 );

  ctx.font = '18px sans-serif';
  ctx.fillText( subtitle, canvas.width / 2, canvas.height / 2 + 30 );
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';

  ctx.textAlign = 'left';
  ctx.fillText( 'Score: ' + score, 16, 24 );

  ctx.textAlign = 'right';
  ctx.fillText( 'Vidas: ' + lives, canvas.width - 16, 24 );
}

function drawParticles() {
  const now = performance.now();

  for ( const particle of particles ) {
    const elapsed = now - particle.startTime;
    const alpha = clamp( 1 - elapsed / particle.life, 0, 1 );

    ctx.globalAlpha = alpha;
    drawFrame( ctx, { sx: particle.sx, sy: particle.sy, sw: particle.sw, sh: particle.sh }, particle.x, particle.y, particle.sw, particle.sh );
  }

  ctx.globalAlpha = 1;
}

function drawScene() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  const shakeOffset = getScreenShakeOffset();
  ctx.save();
  ctx.translate( shakeOffset.x, shakeOffset.y );

  for ( const block of blocks ) {
    if ( !block.alive ) continue;
    drawSprite( ctx, 'block_' + block.color, block.x, block.y, block.w, block.h );
  }

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
  drawSprite( ctx, 'ball', ball.x, ball.y, ball.w, ball.h );

  for ( const explosion of explosions ) {
    const frame = EXPLOSION_FRAMES[ explosion.color ][ explosion.frame ];
    drawFrame( ctx, frame, explosion.x, explosion.y, 32, 16 );
  }

  drawParticles();

  ctx.restore();

  if ( gameState === 'playing' || gameState === 'paused' ) {
    drawHUD();
  }

  if ( gameState === 'start' ) {
    drawOverlay( 'Arkanoid', 'Presiona una tecla o haz click para comenzar' );
  } else if ( gameState === 'paused' ) {
    drawOverlay( 'Pausa', 'Presiona Esc o P para continuar' );
  } else if ( gameState === 'gameover' ) {
    drawOverlay( 'Game Over', 'Puntaje final: ' + score + ' — recarga la página para reintentar' );
  } else if ( gameState === 'win' ) {
    drawOverlay( '¡Ganaste!', 'Puntaje: ' + score + ' — presiona una tecla o haz click para reiniciar' );
  }
}

function updatePaddleFromKeys() {
  if ( keys[ 'ArrowLeft' ] || keys[ 'a' ] || keys[ 'A' ] ) {
    paddle.x -= PADDLE_SPEED;
  }
  if ( keys[ 'ArrowRight' ] || keys[ 'd' ] || keys[ 'D' ] ) {
    paddle.x += PADDLE_SPEED;
  }
  paddle.x = clamp( paddle.x, 0, canvas.width - paddle.w );
}

function rectsIntersect( a, b ) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function bounceOffPaddle() {
  const speed = Math.hypot( ball.vx, ball.vy );
  const ballCenterX = ball.x + ball.w / 2;
  const paddleCenterX = paddle.x + paddle.w / 2;
  const relIntersect = clamp( ( ballCenterX - paddleCenterX ) / ( paddle.w / 2 ), -1, 1 );
  const angle = relIntersect * MAX_BOUNCE_ANGLE;

  ball.vx = speed * Math.sin( angle );
  ball.vy = -speed * Math.cos( angle );
  ball.y = paddle.y - ball.h;
}

function updateBallPhysics() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if ( ball.x <= 0 ) {
    ball.x = 0;
    ball.vx = -ball.vx;
  } else if ( ball.x + ball.w >= canvas.width ) {
    ball.x = canvas.width - ball.w;
    ball.vx = -ball.vx;
  }

  if ( ball.y <= 0 ) {
    ball.y = 0;
    ball.vy = -ball.vy;
  }

  if ( ball.vy > 0 && rectsIntersect( ball, paddle ) ) {
    bounceOffPaddle();
  }

  checkBlockCollisions();
}

function isBallOutOfBounds() {
  return ball.y > canvas.height;
}

function spawnExplosion( block ) {
  explosions.push( {
    x: block.x + block.w / 2 - 16,
    y: block.y + block.h / 2 - 8,
    color: block.color,
    frame: 0,
    startTime: performance.now(),
    duration: EXPLOSION_DURATIONS[ block.color ],
  } );
}

function spawnParticles( block ) {
  const sprite = SPRITES.blocks[ block.color ];
  const count = 4 + Math.floor( Math.random() * 3 ); // 4-6

  for ( let i = 0; i < count; i++ ) {
    const angle = -Math.PI / 2 + ( Math.random() - 0.5 ) * Math.PI; // hacia arriba/lateral
    const speed = 2 + Math.random() * 3;

    particles.push( {
      x: block.x + Math.random() * ( block.w - PARTICLE_SIZE ),
      y: block.y + Math.random() * ( block.h - PARTICLE_SIZE ),
      vx: Math.cos( angle ) * speed,
      vy: Math.sin( angle ) * speed,
      color: block.color,
      sx: sprite.sx + Math.floor( Math.random() * ( sprite.sw - PARTICLE_SIZE ) ),
      sy: sprite.sy + Math.floor( Math.random() * ( sprite.sh - PARTICLE_SIZE ) ),
      sw: PARTICLE_SIZE,
      sh: PARTICLE_SIZE,
      startTime: performance.now(),
      life: PARTICLE_LIFE,
    } );
  }
}

function checkBlockCollisions() {
  for ( const block of blocks ) {
    if ( !block.alive || !rectsIntersect( ball, block ) ) continue;

    block.alive = false;
    score += POINTS_PER_BLOCK;
    spawnExplosion( block );
    spawnParticles( block );
    triggerScreenShake();

    const overlapX = Math.min( ball.x + ball.w - block.x, block.x + block.w - ball.x );
    const overlapY = Math.min( ball.y + ball.h - block.y, block.y + block.h - ball.y );

    if ( overlapX < overlapY ) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }

    break;
  }
}

function updateExplosions() {
  const now = performance.now();

  explosions = explosions.filter( ( explosion ) => {
    const frameDuration = explosion.duration / 4;
    const elapsed = now - explosion.startTime;
    explosion.frame = Math.floor( elapsed / frameDuration );
    return explosion.frame < 4;
  } );
}

function triggerScreenShake() {
  screenShake = { startTime: performance.now(), duration: 200, magnitude: 8 };
}

function getScreenShakeOffset() {
  if ( screenShake.startTime === null ) return { x: 0, y: 0 };

  const elapsed = performance.now() - screenShake.startTime;
  if ( elapsed >= screenShake.duration ) {
    screenShake = { startTime: null, duration: 0, magnitude: 0 };
    return { x: 0, y: 0 };
  }

  const decay = 1 - elapsed / screenShake.duration;
  const magnitude = screenShake.magnitude * decay;

  return {
    x: ( Math.random() * 2 - 1 ) * magnitude,
    y: ( Math.random() * 2 - 1 ) * magnitude,
  };
}

function updateParticles() {
  const now = performance.now();

  particles = particles.filter( ( particle ) => {
    const elapsed = now - particle.startTime;
    if ( elapsed >= particle.life ) return false;

    particle.vy += PARTICLE_GRAVITY;
    particle.x += particle.vx;
    particle.y += particle.vy;

    return true;
  } );
}

function loseLife() {
  lives -= 1;
  if ( lives > 0 ) {
    resetLevel( currentLevel );
    gameState = 'start';
  } else {
    gameState = 'gameover';
  }
}

function isLevelCleared() {
  return blocks.every( ( block ) => !block.alive );
}

function advanceLevel() {
  if ( currentLevel < LEVELS.length - 1 ) {
    currentLevel += 1;
    resetLevel( currentLevel );
    gameState = 'start';
  } else {
    gameState = 'win';
  }
}

function update() {
  if ( gameState === 'start' || gameState === 'playing' ) {
    updatePaddleFromKeys();
  }

  if ( gameState !== 'playing' ) return;

  updateExplosions();
  updateParticles();

  updateBallPhysics();

  if ( isBallOutOfBounds() ) {
    loseLife();
    return;
  }

  if ( isLevelCleared() ) {
    advanceLevel();
  }
}

function loop() {
  update();
  drawScene();
  requestAnimationFrame( loop );
}

function startGame() {
  if ( gameState !== 'start' ) return;

  const multiplier = LEVELS[ currentLevel ].ballSpeedMultiplier;
  ball.vx = BASE_BALL_SPEED * multiplier;
  ball.vy = -BASE_BALL_SPEED * multiplier;
  gameState = 'playing';
}

function togglePause() {
  if ( gameState === 'playing' ) {
    gameState = 'paused';
  } else if ( gameState === 'paused' ) {
    gameState = 'playing';
  }
}

function restartGame() {
  if ( gameState !== 'win' ) return;

  score = 0;
  lives = STARTING_LIVES;
  currentLevel = 0;
  resetLevel( currentLevel );
  gameState = 'start';
}

document.addEventListener( 'keydown', ( e ) => {
  keys[ e.key ] = true;
  startGame();
  restartGame();

  if ( e.key === 'Escape' || e.key === 'p' || e.key === 'P' ) {
    togglePause();
  }
} );
document.addEventListener( 'keyup', ( e ) => {
  keys[ e.key ] = false;
} );
canvas.addEventListener( 'click', () => {
  startGame();
  restartGame();
} );

canvas.addEventListener( 'mousemove', ( e ) => {
  if ( gameState !== 'start' && gameState !== 'playing' ) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = ( e.clientX - rect.left ) * scaleX;
  paddle.x = clamp( mouseX - paddle.w / 2, 0, canvas.width - paddle.w );
} );

loadSpritesheet( () => {
  resetLevel( currentLevel );
  loop();
} );
