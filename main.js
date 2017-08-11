var game = new Phaser.Game('100', '100', Phaser.AUTO, '', {
    preload: preload,
    create: create
});
var ROWS, COLS;
var GEM_SIZE = 70,
    MIN_CLEAR = 3;
var gems;
var selectGem = null, nextGem = null, afterCanClear = false;
var startXY = {x: 0, y: 0};
var waitKill_V = [], waitKill_H = [];
var waitMove = false;
var ctList = [];
var TextStep, TextScore;
// 加载资源
function preload () {
    game.load.spritesheet("GEMS", "timg.png", GEM_SIZE, GEM_SIZE);
}
// 初始化场景
function create () {
    ROWS = Math.floor((game.world.height - 100) / GEM_SIZE);
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
    // 监听指针移动事件
    game.input.addMoveCallback(moveGem, this);
    initText();
}
function initText () {
    var style = { font: "bold 32px MicrosoftYaHei", fill: "#fff"};
    TextStep = game.add.text(50, game.world.height - 100, '当前步数：0', style);
    TextScore = game.add.text(50, game.world.height - 50, '你的分数：0', style);
    TextStep.num = 0;
    TextStep.pre = '当前步数：';
    TextScore.num = 0;
    TextScore.pre = '你的分数：';
}
function updateText (t) {
    t.num++;
    t.setText(t.pre + t.num);
}
// 选中某个方块
function touchGem (gem) {
    if (waitMove) {
        return false;
    }
    selectGem = gem;
    startXY.x = gem.posX;
    startXY.y = gem.posY;
}
// 指针移动事件
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
// 松开指针
function releaseGem () {
    if (nextGem === null) {
        selectGem = null;
        return false;
    }
    killGem(selectGem);
    killGem(nextGem);
    if (afterCanClear) {
        waitMove = true;
        clearGems();
        updateText(TextStep);
    } else {
        tweenGem(selectGem, nextGem.posX, nextGem.posY);
        tweenGem(nextGem, selectGem.posX, selectGem.posY);
        swapGem(selectGem, nextGem);
    }

    afterCanClear = false;
    selectGem = null;
    nextGem = null;
}
// 随机赋予颜色（并排除立即消除的情况）
function randomColor (gem) {
    var prev1x = getGem(gem.posX - 1, gem.posY),
        prev2x = getGem(gem.posX - 2, gem.posY),
        prev1y = getGem(gem.posX, gem.posY - 1),
        prev2y = getGem(gem.posX, gem.posY - 2);
    var xColor = prev1x && prev2x && prev1x.frame == prev2x.frame && prev1x.frame,
        yColor = prev1y && prev2y && prev1y.frame == prev2y.frame && prev1y.frame;
    do {
        gem.frame = game.rnd.integerInRange(0, gem.animations.frameTotal - 1);
    } while (gem.frame === xColor || gem.frame === yColor);
}
// 根据坐标获得id
function calcGemId (x, y) {
    return x + y * COLS;
}
// 根据坐标获得方块（本质是根据id获得）
function getGem (x, y) {
    return gems.iterate('id', calcGemId(x, y), Phaser.Group.RETURN_CHILD);
}
// 设置方块的id和坐标
function setGem (gem, x, y) {
    gem.posX = x;
    gem.posY = y;
    gem.id = calcGemId(x, y);
}
// 交换两个方块的坐标
function swapGem (g1, g2) {
    var tempX = g1.posX,
        tempY = g1.posY;
    setGem(g1, g2.posX, g2.posY);
    setGem(g2, tempX, tempY);
}
// 根据方块 标记该方块十字方向上可消除的所有方块
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
        afterCanClear = true;
    }
    if (waitKill_V.length + 1 >= MIN_CLEAR) {
        gem.kill();
        waitKill_V.forEach(function (g) {
            g.kill();
        });
        afterCanClear = true;
    }
    waitKill_V = [];
    waitKill_H = [];
}
// 统计方块在某个方向上的同类
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
// 检查指针所在位置是否可交换
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
// 将标记的方块全部挪到场景外（上面）
function clearGems () {
    for (var i = 0; i < COLS; i++) {
        var ct = 1;
        for (var j = 0; j < ROWS; j++) {
            var g = getGem(i, j);
            if (g && !g.alive) {
                setGem(g, g.posX, -ct);
                ct++;
                updateText(TextScore);
            }
        }
        ctList[i] = ct - 1;
    }
    dropGems();
}
// 遍历全图将所有已被挪走的位置坠落填充
function dropGems () {
    var max = 0;
    for (var j = 0; j < COLS; j++) {
        var dropCount = 0;
        for (var i = ROWS - 1; i >= 0; i--) {
            var g = getGem(j, i);
            if (g === null) {
                dropCount++;
            } else if (dropCount > 0) {
                setGem(g, j, i + dropCount);
                tweenGem(g, g.posX, g.posY, dropCount);
                g.needReview = true;
            }
        }
        max = Math.max(max, dropCount);
    }
    game.time.events.add(max * 100, refill);
}
// 把最顶上的空缺用场景外的方块重新填充
function refill () {
    gems.forEachDead(function (g) {
        g.reset(g.posX * GEM_SIZE, g.posY * GEM_SIZE);
        g.needReview = true;
        randomColor(g);
        setGem(g, g.posX, g.posY + ctList[g.posX]);
        tweenGem(g, g.posX, g.posY, ctList[g.posX]);
    }, this);
    game.time.events.add(Math.max.apply(null, ctList) * 100, review);
}
// 重新遍历全图 查找标记可消除
function review () {
    afterCanClear = false;
    for (var i = 0; i < COLS; i++) {
        for (var j = 0; j < ROWS; j++) {
            var g = getGem(i, j);
            if (g.needReview) {
                killGem(g);
            }
        }
    }
    if (afterCanClear) {
        clearGems();
    } else {
        afterCanClear = false;
        waitMove = false;
    }
}
// 将方块移动到某坐标
function tweenGem (gem, nextX, nextY, count) {
    count = count || 1;
    return game.add.tween(gem).to({x: nextX  * GEM_SIZE, y: nextY * GEM_SIZE}, 100 * count, Phaser.Easing.Linear.None, true);
}