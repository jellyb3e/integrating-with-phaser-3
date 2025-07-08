import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolMessage, SystemMessage } from "@langchain/core/messages";

const apiKey = import.meta.env.VITE_LLM_API_KEY;
const modelName = import.meta.env.VITE_LLM_MODEL_NAME;

if (!apiKey) throw new Error("Missing LLM API KEY!");
if (!modelName) throw new Error("Missing LLM MODEL NAME!");
const llmTemp = 0;

const sysPrompt =
  "You are pobby, an expert yet humble tile-based map designer that speaks in shakespearean english. " +
  'Your goal is to assist the player in finishing "Particle Practice Kit", a Phaser game demo where the player can openly explore a small tile-based platformer world. The player can collect coins and jump on platforms. You\'ll have access to a few tools that you are to call whenever the player asks for them.';

let tools = []; // tool functions and their schemas
let toolsByName = {}; // Backwards references to tool functions by name

const llm = new ChatGoogleGenerativeAI({
  model: modelName,
  temperature: llmTemp,
  maxRetries: 2,
  apiKey: apiKey,
});

let llmWithTools = null;

export function registerTool(tool) {
  if (toolsByName[tool.name]) {
    console.warn(`Tool "${tool.name}" already registered; overwriting.`);
  }
  tools.push(tool);
  toolsByName[tool.name] = tool;
  console.log("Tool Registered: ", tool.name);
}

export function initializeTools() {
  if (llmWithTools) {
    console.error("Attempting to init tools when model is already bound!");
    return;
  }
  llmWithTools = llm.bindTools(tools);
  console.log("Bound following tools to LLM: ", Object.keys(toolsByName));
}

export async function initializeLLM(chatMessageHistory) {
  chatMessageHistory.push(new SystemMessage(sysPrompt));
}

export async function getChatResponse(chatMessageHistory) {
  if (!llmWithTools) {
    throw new Error("LLM has not been initialized yet! Stop breaking stuff");
  }

  try {
    let response = await llmWithTools.invoke(chatMessageHistory);
    console.log(
      `Message sent to LLM`,
      chatMessageHistory,
      `and received: `,
      response,
    );

    chatMessageHistory.push(response);

    const calls = response.tool_calls ?? [];
    for (const toolCall of calls) {
      const selectedTool = toolsByName[toolCall.name];
      if (!selectedTool) {
        const msg = `Error: Unknown tool "${toolCall.name}".`;
        console.error(msg);
        chatMessageHistory.push(
          new ToolMessage({
            name: toolCall.name,
            content: msg,
            tool_call_id: String(toolCall.id || ""),
          }),
        );
        continue;
      }
      try {
        const result = await selectedTool.invoke(toolCall.args);
        console.log(`Tool called ${toolCall.name} with result: ${result}`);

        chatMessageHistory.push(
          new ToolMessage({
            name: toolCall.name,
            content: result,
            tool_call_id: String(toolCall.id || ""),
          }),
        );
      } catch (toolError) {
        console.error(`Tool ${toolCall.name} failed:`, toolError);
        const errorMessage =
          `Error: Tool '${toolCall.name}' failed with args: ${JSON.stringify(toolCall.args)}.\n` +
          `Details: ${toolError}. Please try again with different parameters.`;

        chatMessageHistory.push(
          new ToolMessage({
            name: toolCall.name,
            content: errorMessage,
            tool_call_id: String(toolCall.id ?? ""),
          }),
        );
      }
    }

    if (calls.length > 0) {
      response = await llmWithTools.invoke(chatMessageHistory);
      console.log("Raw LLM response after tool calls: ", response);
    }

    let resultContent = response.content;
    if (typeof resultContent !== "string") {
      console.log(
        "Non-string AI response detected, need to fix this later:",
        resultContent,
      );
      resultContent = JSON.stringify(resultContent);
    }
    return resultContent;
  } catch (error) {
    console.error(
      "Error during tool call. THIS WILL BREAK EVERYTHING: ",
      error,
    );
    return "Error communicating with model :(";
  }
}
