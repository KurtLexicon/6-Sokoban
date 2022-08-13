
/* Constants for 2d elements */

const E = 'empty';
const T = 'target';

/* Constants for 3d elements */

const W = 'wall';
const B = 'block';
const A = 'actor';

/* Constants for Element ID's used in HTML and referenced from JS */

const DocId = {
  Field: 'field',
  StatusLabel: 'statusLabel',
}

/* Constants for sounds */

const Sound = {
  Beep: 'beep',
  Yay: 'yay',
}

/* Constants for GameStatus */

const GameStatus = {
  Active: 'active',
  Resigned: 'resigned',
  Success: 'success',
}



/* Constants for KeyDown codes handled in JS */

const Key = {
  ArrowUp : 'ArrowUp',
  ArrowDown : 'ArrowDown',
  ArrowLeft : 'ArrowLeft',
  ArrowRight : 'ArrowRight',
  Enter: 'Enter',
}

/* Constants for CSS/DOM classes */

const Cls = {
  Tile: 'tile',
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
  Error: 'error',
  Row: 'row',
  DefaultButton: 'defaultButton',
  TileWall: 'tile-wall',
  TileEmpty: 'tile-space',
  TileTarget: 'tile-goal',
  EntityActor: 'entity-player',
  EntityBlock: 'entity-block',  
}

/* Constants for directions */

const Direction  = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
}

/* Mapping from array key codes to direction code */

const ArrowKey2Direction = {
  [Key.ArrowUp] : Direction.Up,
  [Key.ArrowDown] : Direction.Down,
  [Key.ArrowLeft] : Direction.Left,
  [Key.ArrowRight] : Direction.Right,
}

/* Mapping from direction code to CSS class */

const Direction2CSS = {
  [Direction.Up] : Cls.Up,
  [Direction.Down] : Cls.Down,
  [Direction.Left] : Cls.Left,
  [Direction.Right] : Cls.Right,
}

/* Mapping from direction code to Diff object */

const Direction2Diff = {
  [Direction.Up] : {r: -1, c: 0},
  [Direction.Down] : {r: 1, c: 0},
  [Direction.Left] : {r: 0, c: -1},
  [Direction.Right] : {r: 0, c: 1},
}


/* Mapping of CSS Classes for fieldItems */

const FieldItem2CSS = {
  [W]: Cls.TileWall,
  [E]: Cls.TileEmpty,
  [T]: Cls.TileTarget,
  [A]: Cls.EntityActor,
  [B]: Cls.EntityBlock,
};

/* Mapping of characters in template definitons to element types */

const Char2Code = {
  ' ': E, // Empty
  '=': W, // Wall
  '|': W,
  '+': W,
  '*': T, // Target
  'X': B, // Block
  'o': A, // Actor
}

const gameTemplates = {
  tiny: [
      '+====+',
      '| *  |',
      '| X  |',
      '|* X |',
      '| o  |',
      '+====+',
  ],

  small: [
      '|======|',
      '| *|   |',
      '|* | | |',
      '|*X|X| |',
      '|      |',
      '|*X  X |',
      '| o|   |',
      '|======|',
  ],

  medium: [
      '==========',
      '|   *|   |',
      '|*== | | |',
      '|*  X|X| |',
      '|       *|',
      '|*==X=X= |',
      '|        |',
      '|*  X  X |',
      '|   o|   |',
      '==========',
  ],

  large: [
    '                   ',
    '                   ',
    '                   ',
    '    +===+          ',
    '    |   |          ',
    '    |X  |          ',
    '  +=+  X+|         ',
    '  |  X X |         ',
    '+=+ + || |   += ==+',
    '|   | || +===+  **|',
    '| X  X          **|',
    '+===+ === =o==  **|',
    '    |     ========+',
    '    +=====+        ',
    '                   ',
    '                   ',
  ],
}
