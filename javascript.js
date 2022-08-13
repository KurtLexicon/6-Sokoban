
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
        updateGameStatus(game && !isGameDone());
    }
}

/****************************************
 * Handle moves
 */

function moveActor(direction) {
    if (isGameDone()) return

    const thisPos = game.actorPosition
    const maxBlocks = 3
    if (moveItem(thisPos, direction, maxBlocks)) {
        setTileState(thisPos, E, direction)
        game.actorPosition = addPos(thisPos, direction)
    } else {
        playSound(Sound.Beep)
    }
}

function moveItem(thisPos, direction, maxBlocks) {
    const nextPos = addPos(thisPos, direction);
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

function setTileState(pos, item, direction) {
    cell = game.board[pos.r][pos.c]
    cell.fieldItem3d = item
    setTileClass(cell, direction)
}

function getClassnameForCell(cell, direction) {
    return [
        Cls.Tile,
        FieldItem2CSS[cell.fieldItem2d],
        FieldItem2CSS[cell.fieldItem3d],
        direction && Direction2CSS[direction] 
    ]
    .filter(item => item) // remove undefined
    .join(' ')
}

function setTileClass(cell, direction) {
    const className = getClassnameForCell(cell, direction)
    const node = document.getElementById(nodeId(cell));
    if (node.className !== className) node.className = className
}


/****************************************
 * Update status of game (solved/not solved)
 */

 function updateGameStatus(addMoves) {
    if (addMoves) game.moves += 1

    let success = true
    for( cell of game.boardCells) {
        if ((cell.fieldItem3d === B) !== (cell.fieldItem2d == T)) success = false
    }

    if (success && !isGameDone()) {
        game.status = GameStatus.Success
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
            fieldItem2d: [T].includes(cellValue) ? cellValue : E,
            fieldItem3d: [A, B, W].includes(cellValue) ? cellValue : E,
            r,
            c,
        }
    }))
}

function getActorPosition(boardItems) {
    const actorCells = boardItems.filter(cell => cell.fieldItem3d === A)
    if (actorCells.length !== 1) throw 'The game template should have exactly one actor'
    return actorCells[0]
}

/* Creates random index for next game */
function randomTemplateIndex(templates) {
    if (!game) return rndInt(templates.length)
    if (templates.length === 1) return 0;

    // If we have a current game then make
    // sure we don't get the same again
    let ix = rndInt(templates.length - 1)
    if (ix >= game.index) ix += 1;
    return ix;
}

/* Create tiles in DOM, with id's and static classes */
function initField() {
    const fieldNode = document.getElementById(DocId.Field);
    fieldNode.innerHTML = '';

    for(row of game.board) {
        const rowNode = addDomElement(fieldNode, 'div', Cls.Row)
        for(cell of row){
            const id = nodeId(cell)
            const className = getClassnameForCell(cell)
            addDomElement(rowNode, 'div', className, id)
        };
    };
}

function addDomElement(parentNode, elemType, className, id) {
    let newNode = document.createElement(elemType);
    newNode.className = className;
    id && newNode.setAttribute('id', id);
    parentNode.appendChild(newNode);
    return newNode
}

function archiveGame(game) {
    if (game && game.moves) {
        delete game.board
        delete game.boardCells
        delete game.actorPosition
        gameHistory.push(game)
    }
    game = undefined
}

function newGame() {
    try {
        if (!game) sanityCheckTemplates() // only once, before first game is created

        let templates = Object.values(gameTemplates)
        let ixTemplate = randomTemplateIndex(templates)
        let template = templates[ixTemplate].map(row => [...row].map(c => Char2Code[c]))

        archiveGame(game)

        const board = boardFromTemplate(template)
        const boardCells = flatArray(board)
        const actorPosition = getActorPosition(boardCells)
        game = {
            index: ixTemplate,
            name: Object.keys(gameTemplates)[ixTemplate],
            board,
            boardCells,
            actorPosition,
            moves: 0,
            status: GameStatus.Active,
        }
        
        initField()
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
    if (nRows < 6) throw 'There should be at least 6 rows'

    let nCols
    template.map((row, r) => {
        nCols = nCols || row.length
        if (nCols < 6) throw 'There should be at least 6 columns'
        if (nCols !== row.length) throw 'All rows should have same number of columns'

        for (c = 0; c < row.length; c++) {
            const cell = Char2Code[row[c]];
            if (cell === undefined) throw `Unknown char code ${row[c]} in template definition`
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

 function nodeId(cell) {
    return `r${cell.r}c${cell.c}`
}

function rndInt(n) {
    return Math.floor(Math.random() * n);
}

function playSound(soundId) {
    document.getElementById(soundId).play();
}

/* Get the entity value for a cell by pos */
function objGet(pos) {
    return pos && game.board[pos.r][pos.c].fieldItem3d
}

/* Gets position in direction 'direction' from pos */
function addPos(pos, direction) {
    const {r, c} = Direction2Diff[direction]
    const newPos = {r: pos.r + r, c: pos.c + c}

    // Make sure we only return positions that are actually on the board
    if (game.board[newPos.r] === undefined)  return undefined
    if (game.board[newPos.r][newPos.c] === undefined)  return undefined

    return newPos
}

/* Sets a status text (success, nof moves), or displays an error message */
function setStatusText(error) {
    error && console.log(`Error Text: ${error}`)
    const statustext = 
        error ? (error.message || error) :
        !game ? 'No avtive game' :
        game.status === GameStatus.Success ? `Success!! You finished the game in ${game.moves} moves!!` :
        game.status === GameStatus.Active ? `${game.moves} moves so far` :
        game.status === GameStatus.Redigned ? `Resigned after ${game.moves} moves` :
        `Unknown game status ${game.status}`

    elem = document.getElementById(DocId.StatusLabel)
    elem.innerHTML = statustext;
    elem.className = error ? Cls.Error : ''
}

/* Returns an array that includes all entries in a 2 dimensional array */

function flatArray(board) {
    return board.reduce((acc, row) => (acc.push(...row), acc), [])
}

/* Check if game is finished */ 
function isGameDone(){
    return game && [GameStatus.Success, GameStatus.Resigned].includes(game.status)
}