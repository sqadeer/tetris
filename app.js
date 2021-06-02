// fires off when index.html is loaded
document.addEventListener('DOMContentLoaded', () =>{
    const grid = document.querySelector('.grid')
    let squares = Array.from(document.querySelectorAll('.grid div'))
    const ScoreDisplay = document.querySelector('#score')
    const StartBtn = document.querySelector('#start-button')
    const width = 10
    console.log(squares)

    // Tetrominoes
    // each inner array represents a rotation
    const lTetromino = [
        [width, width*2,width*2+1, width*2+2],
        [1, width+1, width*2+1, 2],
        [width, width+1, width+2, width*2+2],
        [1, width+1, width*2, width*2+1]
    ]

    const sTetromino = [
        [1, 2, width, width+1],
        [1, width+1, width+2, width*2+2],
        [1, 2, width, width+1],
        [1, width+1, width+2, width*2+2]
    ]

    const tTetromino = [
        [1, width, width+1, width+2],
        [1, width+1, width+2, width*2+1],
        [width, width+1, width+2, width*2+1],
        [1, width, width+1, width*2+1]
    ]

    const oTetromino = [
        [0, 1, width, width+1],
        [0, 1, width, width+1],
        [0, 1, width, width+1],
        [0, 1, width, width+1]
    ]

    const iTetromino = [
        [width, width+1, width+2, width+3],
        [2, width+2, width*2+2, width*3+2],
        [width*2, width*2+1, width*2+2, width*2+3],
        [1, width+1, width*2+1, width*3+1]
    ]

    const lstWallKickData = [
        [[-1,0], [-1,1], [0,-2], [-1,-2]],
        [[1,0], [1,-1], [0,2], [1,2]],
        [[1,0], [1,1], [0,-2], [1,-2]],
        [[-1,0], [-1,-1], [0,2], [-1,2]]
    ]

    const iWallKickData = [
        [[-2,0], [1,0], [-2,-1], [1,2]],
        [[-1,0], [2,0], [-1,2], [2,-1]],
        [[2,0], [-1,0], [2,1], [-1,-2]],
        [[1,0], [-2,0], [1,-2], [-2,1]]
    ]

    const theTetrominoes = [lTetromino, sTetromino, tTetromino, oTetromino, iTetromino]
    const wallKickData = [lstWallKickData, lstWallKickData, lstWallKickData, [], iWallKickData]

    let currentPosition = 4
    let currentRotation = 0

    // randomly select a Tetromino and its first rotation
    let randomTetrominoIndex = Math.floor(Math.random()*theTetrominoes.length)
    let currentShape = theTetrominoes[randomTetrominoIndex][currentRotation]
    let currentTetromino= theTetrominoes[randomTetrominoIndex]

    function draw(){
        //console.log("currentShape: ",currentShape);
        currentShape.forEach(index => {
            squares[currentPosition + index].classList.add('tetromino');
        });
    }

    function undraw(){
        currentShape.forEach(index => {
            squares[currentPosition + index].classList.remove('tetromino')
        })
    }

    // make the tetromino move down every second
    timerId = setInterval(moveDown, 1500)

    // assign functions to keyCodes
    function control(event){
        if(event.keyCode === 37){
            moveLeft()
        }
        else if(event.keyCode === 38){
            rotate()
        }
        else if(event.keyCode === 39){
            moveRight()
        }
        else if(event.keyCode === 40){
            moveDown()
        }
    }
    // the keyup event is fired when a key is released
    document.addEventListener('keyup', control)

    // move down function
    function moveDown(){
        freeze()
        undraw()
        currentPosition += width
        draw()
    }

    // freeze function
    function freeze(){
        if(currentShape.some(index => squares[currentPosition + index + width].classList.contains('taken'))){
            currentShape.forEach(index => squares[currentPosition + index].classList.add('taken'))
            // Start a new tetromino falling
            randomTetrominoIndex =  Math.floor(Math.random()*theTetrominoes.length)
            currentRotation = 0
            currentPosition = 4
            currentShape = theTetrominoes[randomTetrominoIndex][currentRotation]
            currentTetromino = theTetrominoes[randomTetrominoIndex]
            draw()
            return true
        }
        return false  
    }

    // move the tetromino left unless it is at an edge or there is a blockage
    function moveLeft(){
        const isAtLeftEdge = currentShape.some(index => (currentPosition + index) % width === 0) // checks if the shape is currently at the left edge
        if(isAtLeftEdge){ 
            return
        }
        undraw()
        // checks if there is no blockage
        if( !currentShape.some(index => squares[currentPosition + index - 1].classList.contains('taken'))){
            currentPosition -= 1
        }
        draw() 
    }

    // move the tetromino right unless it is at an edge or there is a blockage
    function moveRight(){
        const isAtRightEdge = currentShape.some(index => (currentPosition + index) % width === (width - 1)) 
        if(isAtRightEdge){
            return
        }
        undraw()
        // check if there is no blockage
        if(!currentShape.some(index => squares[currentPosition + index + 1].classList.contains('taken'))){
            currentPosition += 1
        }
        draw()
    }

    // should only be able to rotate if there is enough space to do so (no blockage and not at an end)
    function rotate(){
        if (freeze()){
            return;
        }
        undraw();
        var nextRotation = getNextRotation();
        var basicShape = currentTetromino[nextRotation]; 
        
        if(isObstructed(basicShape)){
           var wallKicks = wallKickData[randomTetrominoIndex][nextRotation];
           var i,j,x,y;
           for (i = 0; i < wallKicks.length; ++i){
               x = wallKicks[i][0]; y = wallKicks[i][1];
               var testShape = []; 
               var newIndex;

               for(j = 0; j < basicShape.length; ++j){
                   newIndex = basicShape[j] + x - (width * y);
                   testShape.push(newIndex);
               }
               // checks if a wall kick doesn't obstruct
               if(!isObstructed(testShape)){
                   currentShape = basicShape;
                   updateRotation();
                   kickCurrPos(x,y);
                   break;
               }
           }
        }
        else{
            currentShape = basicShape;
            updateRotation();
        } 
        draw();
    }

    function isObstructed(shape){
        // checks if rotation obstructed a wall
        if(( shape.some(index => (currentPosition + index) % width === (width - 1)) ) && 
                (shape.some(index => (currentPosition + index) % width === 0 )) ){
            return true;
        }
        // checks if rotation obstructed floor or stack
        else if(shape.some(index => squares[currentPosition + index].classList.contains('taken')) ){
            return true;
        }
        return false;
    }

    function updateRotation(){
        ++currentRotation;
        if(currentRotation === currentTetromino.length){
            currentRotation = 0;
        }
    }

    function getNextRotation(){
        var nextRotation = currentRotation + 1;
        if(nextRotation === currentTetromino.length){
            nextRotation = 0;
        }
        return nextRotation;
    }

    // updates currentPosition according to a wall kick
    function kickCurrPos(x,y){
        kickValue = x - (width * y);
        currentPosition += kickValue;
    }

})