var game = new Phaser.Game('95', '95', Phaser.AUTO, '', {
    preload: preload,
    create: create
});
var ROWS, COLS;
var GEM_SIZE = 70;
var gems;
var selectedGem = null;
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
            gem.events.onInputDown.add(selectGem, this);
            gem.events.onInputUp.add(releaseGem, this);
        }
    }
}
function selectGem (gem) {
    selectedGem = gem;
    game.add.tween(selectedGem).to({x:0},200,'Linear',true)
}
function releaseGem () {}