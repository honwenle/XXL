var game = new Phaser.Game('95', '95', Phaser.AUTO, '', {
    preload: preload,
    create: create
});
var ROWS, COLS;
var GEM_SIZE = 70;
var gems;
var selectGem = null, nextGem = null;
var startXY = {x: 0, y: 0};
function preload () {
    game.load.spritesheet("GEMS", "timg.png", GEM_SIZE, GEM_SIZE);
}
function create () {
    ROWS = Math.floor(game.world.height / GEM_SIZE);
    COLS = Math.floor(game.world.width / GEM_SIZE);

    gems = game.add.group();
    for (var i = 0; i < COLS; i++) {
        for (var j = 0; j < ROWS; j++) {
            var gem = gems.create(i * GEM_SIZE, j * GEM_SIZE, 'GEMS');
            gem.frame = game.rnd.integerInRange(0, gem.animations.frameTotal - 1);
            gem.inputEnabled = true;
            gem.events.onInputDown.add(touchGem, this);
            gem.events.onInputUp.add(releaseGem, this);
            setGem(gem, i, j);
        }
    }
    game.input.addMoveCallback(moveGem, this);
}
function touchGem (gem) {
    selectGem = gem;
    startXY.x = gem.posX;
    startXY.y = gem.posY;
    // killGem(gem);
    // dropGems();
}
function moveGem (pointer, x, y) {
    if (selectGem && pointer.isDown) {
        x = Math.floor(x / GEM_SIZE);
        y = Math.floor(y / GEM_SIZE);
        if (checkCanMove(x, y)) {
            gems.bringToTop(selectGem);
            tweenGem(selectGem, x, y);
            if (nextGem !== null) {
                tweenGem(nextGem, selectGem.posX, selectGem.posY);
                swapGem(selectGem, nextGem);
            }
            nextGem = getGem(x, y);
            if (nextGem == selectGem) {
                nextGem = null;
            } else {
                tweenGem(nextGem, selectGem.posX, selectGem.posY);
                swapGem(selectGem, nextGem);
            }
        }
    }
}
function releaseGem () {
    selectGem = null;
    nextGem = null;
}

function calcGemId (x, y) {
    return x + y * COLS;
}
function getGem (x, y) {
    return gems.iterate('id', calcGemId(x, y), Phaser.Group.RETURN_CHILD);
}
function setGem (gem, x, y) {
    gem.posX = x;
    gem.posY = y;
    gem.id = calcGemId(x, y);
}
function killGem (gem) {
    gem.kill();
    gem.posY -= ROWS;
    gem.id = calcGemId(gem.posX, gem.posY);
}
function swapGem (g1, g2) {
    var tempX = g1.posX,
        tempY = g1.posY;
    setGem(g1, g2.posX, g2.posY);
    setGem(g2, tempX, tempY);
}

function checkCanMove (toX, toY) {
    if (toX < 0 || toX >= COLS || toY < 0 || toY >= ROWS) {
        return false;
    }
    if (toX === selectGem.x && toY === selectGem.y) {
        return false;
    }
    if (startXY.x == toX && Math.abs(startXY.y - toY) <= 1) {
        return true;
    }
    if (startXY.y == toY && Math.abs(startXY.x - toX) <= 1) {
        return true;
    }
    return false;
}
function dropGems () {
    for (var j = 0; j < COLS; j++) {
        var dropCount = 0;
        for (var i = ROWS - 1; i >= 0; i--) {
            var g = getGem(j, i);
            if (g === null) {
                dropCount++;
            } else if (dropCount > 0) {
                setGem(g, j, i + dropCount);
                tweenGem(g, g.posX, g.posY);
            }
        }
    }
}

function tweenGem (gem, nextX, nextY, count) {
    count = count || 1;
    return game.add.tween(gem).to({x: nextX  * GEM_SIZE, y: nextY * GEM_SIZE}, 100 * count, Phaser.Easing.Linear.None, true);
}