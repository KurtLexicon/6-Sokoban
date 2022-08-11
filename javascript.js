
/*******************************************
 * Globals
 */

const gameHistory = []
var game

/****************************************
 * Handle events
 */

document.addEventListener('keydown', event => {
    try {
        switch (event.key) {
            case Key.ArrowUp:
            case Key.ArrowDown:
            case Key.ArrowLeft:
            case Key.ArrowRight:
                handleArrowKey(event)
                event.preventDefault();
                break;
            case Key.Enter:
                handleEnterKey()
                event.preventDefault();
                break;
            default:
        }
    } catch (err) {
        setStatusText(err)
    }
});

function handleEnterKey() {
    const defaultButtons = document.getElementsByClassName(Cls.DefaultButton);
    defaultButtons.length && defaultButtons[0].click()
}


function handleArrowKey(event) {
    let direction = ArrowKey2Direction[event.key]
    if (direction) {
        moveActor(direction);
        updateGameStatus(true);
    }
}

/****************************************
 * Handle moves
 */

function moveActor(direction) {
    if(game.done) return

    const thisPos = game.pos
    const maxBlocks = 2
    if (moveItem(thisPos, direction, maxBlocks)) {
        setTileState(thisPos, E, direction)
        game.pos = addPos(game, thisPos, direction)
    } else {
        playSound(Sound.Beep)
    }
}

function moveItem(thisPos, direction, maxBlocks) {
    const nextPos = addPos(game, thisPos, direction);
    const thisState = objGet(thisPos)
    const nextState = objGet(nextPos)

    if ([undefined, A, W].includes(nextState)) {
        return false
    } else if (nextState === E) {
        setTileState(nextPos, thisState, direction)
        return true
    } else if (nextState === B) {
        let ret = !!maxBlocks && moveItem(nextPos, direction, maxBlocks - 1)
        ret && setTileState(nextPos, thisState, direction)
        return ret
    }
}

/****************************************
 * Set CSS-classes on tiles
 */

 function setTileState(pos, value, direction) {
    const {r, c} = pos
    game.objs[r][c] = value
    setTileClass(r, c, direction)
}

function setAllTileClasses() {
    if(game.done) return

    for({r, c} of boardCells(game.objs)) {
        setTileClass(r, c)
    }
}

function setTileClass(r, c, direction) {
    const className = [
        Cls.Tile,
        Tiles[game.map[r][c]],
        Entities[game.objs[r][c]],
        direction && Direction2CSS[direction] 
    ]
    .filter(item => item) // remove undefined
    .join(' ')

    const node = document.getElementById(nodeId(r, c));
    if (node.className !== className) node.className = className
}


/****************************************
 * Update status of game (solved/not solved)
 */

 function updateGameStatus(addMoves) {
    if (addMoves) game.moves += 1

    let success = true
    for({mapCell, objCell} of gameCells()) {
        if ((objCell === B) !== (mapCell == T)) success = false
    }

    if(success && !game.done) {
        game.done = success
        playSound(Sound.Yay);
    }
    setStatusText()
}


/****************************************
 * Init Game
****************************************/

function boardFromTemplate(template) {
    return template.map((row, r) => row.map((cellValue, c) => {
        return {
            mapCell: [T, W].includes(cellValue) ? cellValue : E,
            objCell: [A, B].includes(cellValue) ? cellValue : E,
            r,
            c,
        }
    }))
}


function mapFromTemplate(template) {
    let map = template.map(row=>row.map(cell => [B, A].findIndex(c => cell == c) >= 0 ? E: cell))
    return map
}

function objsFromTemplate(template) {
    let objs = template.map(row=>row.map(cell => cell == T ? E: cell))
    return objs
}


function actorPositionFromTemplate(template) {
    let pos
    for({cell, r, c} of boardCells(template)) {
        if(cell === A) {
            if(pos) throw 'More than one actor found in game'
            pos = {r, c}
        }
    }
    if(!pos) throw Error ('No actor found in game')
    return pos
}

/* Creates random index for next game */
function randomTemplateIndex(templates) {
    if (!game) return rndInt(templates.length)
    if(templates.length === 1) return 0;

    // If we have a current game then make
    // sure we don't get the same again
    let ix = rndInt(templates.length - 1)
    if (ix >= game.index) ix += 1;
    return ix;
}

/* Create tiles in DOM, with id's and static classes */
function createDomTiles() {
    const field = document.getElementById(DocId.Field);
    field.innerHTML = '';

    for(r = 0; r < game.map.length; r++) {
        let rowNode = document.createElement('div');
        rowNode.className = Cls.Row;
        field.appendChild(rowNode);

        let row = game.map[r];
        for(c = 0; c < row.length; c++) {
            let cell = row[c];
            let node = document.createElement('div');
            node.className = Tiles[cell];
            node.setAttribute('id', nodeId(r, c));
            rowNode.appendChild(node);
        };
    };
}

function archiveGame(game) {
    if(game) {
        delete game.map
        delete game.objs
        delete game.board
        delete game.pos
        gameHistory.push(game)
        game = undefined
    }
}

function newGame() {
    try {
        if(!game) sanityCheckTemplates(); // only once, before first game is created

        let templates = Object.values(gameTemplates)
        let ixTemplate = randomTemplateIndex(templates)
        let template = templates[ixTemplate].map(row => [...row].map(c => Char2Code[c]))
        
        archiveGame(game)
        game = {
            index: ixTemplate,
            name: Object.keys(gameTemplates)[ixTemplate],
            board: boardFromTemplate(template),
            map: mapFromTemplate(template),
            objs: objsFromTemplate(template),
            pos: actorPositionFromTemplate(template),
            moves: 0,
            done: false,
        }
        
        createDomTiles()
        setAllTileClasses()
        setStatusText()
    } catch (err) {
        setStatusText(err)
    }
}

/****************************************
 * Checks that tamplates as valid
****************************************/

function sanityCheckTemplates() {
    Object.values(gameTemplates).map(t => sanityCheckTemplate(t))
}

function sanityCheckTemplate(template) {
    // 1. Check that nRows >= 6 and nCols >= 6
    // 2. Check that nCols is the same for all rows
    // 3. Check that there are no unreconized characters in template
    // 4. Check that there's exactly one actor
    // 5. Check that nTargets === nBlocks and nTargets >= 1
    
    let count = {}

    const nRows = template.length
    if(nRows < 6) throw 'There should be at least 6 rows'

    let nCols
    template.map((row, r) => {
        nCols = nCols || row.length
        if(nCols < 6) throw 'There should be at least 6 columns'
        if(nCols !== row.length) throw 'All rows should have same number of columns'

        for(c = 0; c < row.length; c++) {
            const cell = Char2Code[row[c]];
            if(cell === undefined) throw `Unknown char code ${row[c]} in template definition`
            count[cell] = (count[cell] || 0) + 1
        };
    })
    if (count[A] !== 1) throw Error  ('There should be exactly one actor');
    if (count[B] !== count[T]) throw Error  ('Number of targets should equal number of blocks')
    if (count[B] === 0) throw Error  ('There should be at least one target and one block')
}

/****************************************
 * Helpers and misc
 ***************************************/

 function nodeId(r, c) {
    return `r${r}c${c}`
}

function rndInt(n) {
    return Math.floor(Math.random() * n);
}

function playSound(soundId) {
    document.getElementById(soundId).play();
}

/* Get the entity value for a cell by pos */
function objGet(pos) {
    return pos && game.objs[pos.r][pos.c]
}

/* Adds addPos to game.pos, returns undefined if outside the board */
function addPos(game, gamePos, direction) {
    const {r, c} = Direction2Diff[direction]
    const newPos = {r: gamePos.r + r, c: gamePos.c + c}

    // Make sure we only return positions that are actually on the board
    if(game.objs[newPos.r] === undefined)  return undefined
    if(game.objs[newPos.r][newPos.c] === undefined)  return undefined

    return newPos
}

/* Sets a status text (success, nof moves), or displays an error message */
function setStatusText(error) {
    error && console.log(`Error Text: ${error}`)
    const statustext = 
        error ? (error.message || error) :
        !game ? 'No avtive game' :
        game.done ? `Success!! You finished the game in ${game.moves} moves!!` :
        game.done ? `Success!! You finished the game in ${game.moves} moves!!` :
        /* game.active */ `${game.moves} moves so far` 

    elem = document.getElementById(DocId.StatusLabel)
    elem.innerHTML = statustext;
    elem.className = error ? Cls.Error : ''
}

/* Returns an array of all tiles in the game, with coordinates and static/movalble objects */
function gameCells() {
    let tiles = []
    for(r = 0; r < game.map.length; r++) {
      for(c = 0; c < game.map[r].length; c++) {
        tiles.push({
            mapCell: game.map[r][c],
            objCell: game.objs[r][c],
            r,
            c
        })
      }
    }
    return tiles
}


/* Returns an array of all entries in an 2 domensional array, with coordinates and values */
function boardCells(board) {
    const tiles = []
    for(r = 0; r < board.length; r++) {
      for(c = 0; c < board[r].length; c++) {
        tiles.push({cell: board[r][c], r, c})
      }
    }
    return tiles
}
