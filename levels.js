const BLOCK_W = 70;
const BLOCK_H = 28;
const BLOCK_GAP = 6;
const COLS = 10;
const TOP_MARGIN = 60;
const MARGIN_X = ( 800 - ( COLS * BLOCK_W + ( COLS - 1 ) * BLOCK_GAP ) ) / 2;

function makeRow( rowIndex, color ) {
  const row = [];
  for ( let c = 0; c < COLS; c++ ) {
    row.push( {
      x: MARGIN_X + c * ( BLOCK_W + BLOCK_GAP ),
      y: TOP_MARGIN + rowIndex * ( BLOCK_H + BLOCK_GAP ),
      w: BLOCK_W,
      h: BLOCK_H,
      color,
      alive: true,
    } );
  }
  return row;
}

function makeRows( colors ) {
  return colors.flatMap( ( color, i ) => makeRow( i, color ) );
}

const LEVELS = [
  { blocks: makeRows( [ 'gray', 'red' ] ), ballSpeedMultiplier: 1 },
  { blocks: makeRows( [ 'red', 'yellow', 'cyan' ] ), ballSpeedMultiplier: 1.15 },
  { blocks: makeRows( [ 'cyan', 'magenta', 'green', 'yellow' ] ), ballSpeedMultiplier: 1.3 },
  { blocks: makeRows( [ 'magenta', 'hotpink', 'red', 'green', 'yellow' ] ), ballSpeedMultiplier: 1.45 },
  { blocks: makeRows( [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ] ), ballSpeedMultiplier: 1.6 },
];
