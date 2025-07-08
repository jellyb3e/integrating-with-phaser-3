import { tool } from "@langchain/core/tools";

export class GravityTool {
  constructor(sceneGetter) {
    this.sceneGetter = sceneGetter;

    this.toolCall = tool(
      async () => {
        const gameScene = this.sceneGetter();
        if (!gameScene) {
          return "Tool Failed: Unable to load game data";
        }

        gameScene.toggleGravity();
        const sentencePhrasing = gameScene.isUpDown ? "inverted" : "normal";

        return `Successfully flipped gravity. It is now ${sentencePhrasing}`;
      },
      {
        name: "flipGravity",
        description: "Inverts the gravity in the game",
      }
    );
  }
}