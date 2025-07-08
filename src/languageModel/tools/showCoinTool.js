import { tool } from "@langchain/core/tools";
import { z } from "zod";

export class ShowCoinTool {
  constructor(sceneGetter) {
    this.sceneGetter = sceneGetter;

    this.toolCall = tool(
      async (_input) => {
        const gameScene = this.sceneGetter();
        if (!gameScene) {
          return "Tool Failed: Unable to load game data";
        }

        if (gameScene.coinsShown) {
          return "Coins are already shown.";
        }

        gameScene.showCoins();
        return "Successfully toggled coin visibility. Now showing coins.";
      },
      {
        name: "showCoins",
        description: "Shows the coins in the game.",
        schema: z.object({}),
      }
    );
  }
}
