export const my = {sprite: {}, text: {}, vfx: {}};

export default class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 1.0;
    }

    create() {
        this.isUpDown = false;
        this.coinsShown = true;
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Create coins from Objects layer in tilemap
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // Find water tiles
        this.waterTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.water == true;
        });

        ////////////////////
        // TODO: put water bubble particle effect here
        // It's OK to have it start running
        ////////////////////
        this.waterTiles.forEach(tile => {
            const x = tile.getCenterX();
            const y = tile.getCenterY()-18;
            this.add.particles(x, y, "kenny-particles", {
                frame: "trace_04.png",
                scale: { values: [0, 0.3, 0.15, 0.05, 0] },
                alpha: {values: [0, 0.15, 0.05, 0] },
                x: { min: -9, max: 9 },
                speedY: { min: -50, max: -10 },
                speedX: { min: -5, max: 5 },
                quantity: 1,
                lifespan: { min: 2000, max: 2500 },
                frequency: 500
            });
        });


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: create coin collect particle effect here
        // Important: make sure it's not running
        this.collectParticle = this.add.particles(0, 0, "kenny-particles", {
            frame: "scorch_03.png",
            scale: { start: 0, end: .4 },
            alpha: {values: [0,1,0], ease:'Expo.easeOut'},
            lifespan: 1500,
            stopAfter: 1
        }).stop();

        // Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            if (!obj2.active) {return;}
            this.collectParticle.startFollow(obj2);
            obj2.setActive(false); // remove coin on overlap
            obj2.setVisible(false);
            ////////////////////
            // TODO: start the coin collect particle effect here
            ////////////////////
            this.collectParticle.start();
        });

        this.left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.jump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

        // TODO: Add movement vfx here
        

        // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        //this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        

    }

    update() {
        if (!this.coinGroup.countActive(true)) {
            this.coinsShown = false;
        }
        if(this.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here

        } else if(this.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.jump)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

    }

    toggleGravity() {
        this.physics.world.gravity.y *= -1;
        my.sprite.player.flipY = !my.sprite.player.flipY;
        this.isUpDown = !this.isUpDown;
    }

    hideCoins() {
        this.coinGroup.children.iterate(coin => {
            coin.setActive(false);
            coin.setVisible(false);
        });
        this.coinsShown = false;
    }
    showCoins() {
        this.coinGroup.children.iterate(coin => {
            coin.setActive(true);
            coin.setVisible(true);
        });
        this.coinsShown = true;
    }
}