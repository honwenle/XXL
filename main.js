var game = new Phaser.Game('95', '95', Phaser.AUTO, '', {
    preload: preload,
    create: create
});
var ROWS, COLS;
var GEM_SIZE = 70,
    MIN_CLEAR = 3;
var gems;
var selectGem = null, nextGem = null, afterSwapCanClear = false;
var startXY = {x: 0, y: 0};
var waitKill_V = [], waitKill_H = [];
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
            setGem(gem, i, j);
            randomColor(gem);
            gem.inputEnabled = true;
            gem.events.onInputDown.add(touchGem, this);
            gem.events.onInputUp.add(releaseGem, this);
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
    // gem.reset(gem.posX * GEM_SIZE, -GEM_SIZE);
    // setGem(gem, gem.posX, 0);
    // tweenGem(gem, gem.posX, gem.posY);
    // killGem(gem);
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
    if (nextGem === null) {
        selectGem = null;
        return false;
    }
    killGem(selectGem);
    killGem(nextGem);
    if (afterSwapCanClear) {
        clearGems();
        dropGems();
    } else {
        tweenGem(selectGem, nextGem.posX, nextGem.posY);
        tweenGem(nextGem, selectGem.posX, selectGem.posY);
        swapGem(selectGem, nextGem);
    }

    afterSwapCanClear = false;
    selectGem = null;
    nextGem = null;
}

function randomColor (gem) {
    var prev1x = getGem(gem.posX - 1, gem.posY),
        prev2x = getGem(gem.posX - 2, gem.posY),
        prev1y = getGem(gem.posX, gem.posY - 1),
        prev2y = getGem(gem.posX, gem.posY - 2);
    var xColor = prev2x && prev1x.frame == prev2x.frame && prev1x.frame,
        yColor = prev2y && prev1y.frame == prev2y.frame && prev1y.frame;
    do {
        gem.frame = game.rnd.integerInRange(0, gem.animations.frameTotal - 1);
    } while (gem.frame === xColor || gem.frame === yColor);
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
function swapGem (g1, g2) {
    var tempX = g1.posX,
        tempY = g1.posY;
    setGem(g1, g2.posX, g2.posY);
    setGem(g2, tempX, tempY);
}

function killGem (gem) {
    countGemOnWay(gem, 0, -1);
    countGemOnWay(gem, 0, 1);
    countGemOnWay(gem, -1, 0);
    countGemOnWay(gem, 1, 0);
    if (waitKill_H.length + 1 >= MIN_CLEAR) {
        gem.kill();
        waitKill_H.forEach(function (g) {
            g.kill()
        });
        afterSwapCanClear = true;
    }
    if (waitKill_V.length + 1 >= MIN_CLEAR) {
        gem.kill();
        waitKill_V.forEach(function (g) {
            g.kill();
        });
        afterSwapCanClear = true;
    }
    waitKill_V = [];
    waitKill_H = [];
}
function countGemOnWay (gem, x, y) {
    var count = 0,
        next = null,
        nextX = gem.posX + x,
        nextY = gem.posY + y;
    while (nextX >= 0 && nextX < COLS && nextY >= 0 && nextY < ROWS) {
        next = getGem(nextX, nextY)
        if (next && next.frame == gem.frame) {
            if (x == 0) {
                waitKill_V.push(next);
            } else {
                waitKill_H.push(next);
            }
            nextX += x;
            nextY += y;
        } else {
            break;
        }
    }
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

function clearGems () {
    for (var i = 0; i < COLS; i++) {
        var ct = 0;
        for (var j = 0; j < ROWS; j++) {
            var g = getGem(i, j);
            if (g && !g.alive) {
                setGem(g, g.posX, -ct);
                ct++;
                console.log(g.posX,g.posY)
            }
        }
    }
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
                g.review = true;
            }
        }
    }
    // refill();
}
function refill () {
    gems.forEachDead(function (g) {
        g.reset(g.posX * GEM_SIZE, (g.posY-1) * GEM_SIZE);
        g.review = true;
        randomColor(g);
        setGem(g, g.posX, -g.posY);
        tweenGem(g, g.posX, g.posY);
        console.log(g.posX,g.posY)
    }, this);
}
function tweenGem (gem, nextX, nextY, count) {
    count = count || 1;
    return game.add.tween(gem).to({x: nextX  * GEM_SIZE, y: nextY * GEM_SIZE}, 100 * count, Phaser.Easing.Linear.None, true);
}