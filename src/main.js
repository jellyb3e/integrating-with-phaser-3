// Jim Whitehead
// Created: 5/14/2025
// Phaser: 3.70.0
//
// Particle Practice Kit
//
// An example platformer layer with coin objects.
// The goal is to add particle effects for when the player collects a coin, and
// for the water to have bubbles, and for when the player falls in the water.
//

import { GravityTool } from "./languageModel/tools/gravityTool.js";
import { HideCoinTool } from "./languageModel/tools/hideCoinTool.js";
import { ShowCoinTool } from "./languageModel/tools/showCoinTool.js";

import { initializeTools, registerTool } from "./languageModel/modelConnector.js";
import { sendSystemMessage } from "./languageModel/chatBox.js";

import  Load  from "./Scenes/Load.js";
import  Platformer  from "./Scenes/Platformer.js";

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    width: 400,
    height: 300,
    scene: [Load, Platformer]
}

const game = new Phaser.Game(config);

// new stuff!
function getScene() {
  if (!game) throw new Error("Game instance not ready");
  return game.scene.getScene("platformerScene");
}

const tools = {
  gravity: new GravityTool(getScene),
  hideCoins: new HideCoinTool(getScene),
  showCoins: new ShowCoinTool(getScene)
};

Object.values(tools).forEach(generator => {
  if (generator.toolCall) {
    registerTool(generator.toolCall);
  }
});

initializeTools();

sendSystemMessage("Introduce yourself and explain what you can do.");