import { tool } from "@langchain/core/tools";
import { z } from "zod";

export class HideCoinTool {
  constructor(sceneGetter) {
    this.sceneGetter = sceneGetter;

    this.toolCall = tool(
      async (_input) => {
        const gameScene = this.sceneGetter();
        if (!gameScene) {
          return "Tool Failed: Unable to load game data";
        }

        if (!gameScene.coinsShown) {
          return "Coins are already hidden.";
        }

        gameScene.hideCoins();
        return "Successfully toggled coin visibility. Now hiding coins.";
      },
      {
        name: "hideCoins",
        description: "Hides the coins in the game.",
        schema: z.object({}),
      }
    );
  }
}
