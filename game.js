const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const PADDLE_W = 162;
const PADDLE_H = 14;
const BALL_SIZE = 16;
const BASE_BALL_SPEED = 5;
const PADDLE_SPEED = 8;
const POINTS_PER_BLOCK = 10;
const STARTING_LIVES = 3;

let gameState = 'start';
let score = 0;
let lives = STARTING_LIVES;
let currentLevel = 0;

let paddle = { x: 0, y: 0, w: PADDLE_W, h: PADDLE_H };
let ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
let blocks = [];
let explosions = [];
const keys = {};

function clamp( value, min, max ) {
  return Math.min( Math.max( value, min ), max );
}

function resetLevel( levelIndex ) {
  const level = LEVELS[ levelIndex ];
  blocks = level.blocks.map( b => ( { ...b } ) );
  explosions = [];

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

function drawScene() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  for ( const block of blocks ) {
    if ( !block.alive ) continue;
    drawSprite( ctx, 'block_' + block.color, block.x, block.y, block.w, block.h );
  }

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h );
  drawSprite( ctx, 'ball', ball.x, ball.y, ball.w, ball.h );

  if ( gameState === 'start' ) {
    drawOverlay( 'Arkanoid', 'Presiona una tecla o haz click para comenzar' );
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

function update() {
  if ( gameState === 'start' || gameState === 'playing' ) {
    updatePaddleFromKeys();
  }

  if ( gameState !== 'playing' ) return;

  ball.x += ball.vx;
  ball.y += ball.vy;
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

document.addEventListener( 'keydown', ( e ) => {
  keys[ e.key ] = true;
  startGame();
} );
document.addEventListener( 'keyup', ( e ) => {
  keys[ e.key ] = false;
} );
canvas.addEventListener( 'click', startGame );

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
