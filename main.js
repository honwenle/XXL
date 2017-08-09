var game = new Phaser.Game('95', '95', Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update
});
var ROWS, COLS;
var GEM_SIZE = 70;
var gems;
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
        }
    }
}
function update () {}