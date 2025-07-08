import { getChatResponse, initializeLLM } from "./modelConnector.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const chatHistoryList = document.querySelector("#chat-history");
const chatInputField = document.querySelector("#llm-chat-input");
const chatSubmitButton = document.querySelector("#llm-chat-submit");

export const chatHistory = [];

initializeLLM(chatHistory).then(() => {
  console.log(chatHistory);
});

document
  .querySelector("#llm-chat-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const userInputField = document.querySelector("#llm-chat-input");
    const userMessage = userInputField.value.trim();
    if (!userMessage) return;
    userInputField.value = "";

    addChatMessage(new HumanMessage(userMessage));

    document.dispatchEvent(new CustomEvent("chatResponseStart"));
    let botResponseEntry;

    try {
      botResponseEntry = await getChatResponse(chatHistory);
      if (botResponseEntry.startsWith("Error:")) {
        addChatMessage(
          new AIMessage(
            "Oops, there was a problem: " +
              botResponseEntry.replace(/^Error:\s*/, "")
          )
        );
      } else {
        addChatMessage(new AIMessage(botResponseEntry));
      }
    } catch (exception) {
      const errorMessage =
        exception instanceof Error ? exception.message : "Unknown error";
      addChatMessage(new AIMessage("Error: " + errorMessage));
    } finally {
      document.dispatchEvent(new CustomEvent("chatResponseEnd"));
    }
  });

export function addChatMessage(chatMessage) {
  chatHistory.push(chatMessage);

  let displayContent = chatMessage.content;
  if (typeof displayContent === "object") {
    console.log("Detected object message in addChatMessage:", displayContent);
    displayContent = JSON.stringify(displayContent);
  }

  const messageItem = document.createElement("li");
  messageItem.innerHTML = `<strong>${chatMessage.getType().toUpperCase()}:</strong> ${displayContent}`;
  messageItem.style.marginBottom = "10px";
  chatHistoryList.appendChild(messageItem);
  return messageItem;
}

// scroll chat to bottom when new message added
const observer = new MutationObserver(() => {
  chatHistoryList.scrollTop = chatHistoryList.scrollHeight;
});

observer.observe(chatHistoryList, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
});

document.addEventListener("chatResponseStart", () => {
  chatInputField.disabled = true;
  chatSubmitButton.disabled = true;
  chatInputField.value = "Thinking...";
});

document.addEventListener("chatResponseEnd", () => {
  chatInputField.disabled = false;
  chatSubmitButton.disabled = false;
  chatInputField.value = "";
  chatInputField.focus();
});

export async function sendSystemMessage(message) {
  const systemMessage = new HumanMessage(message);

  document.dispatchEvent(new CustomEvent("chatResponseStart"));

  try {
    const botResponseEntry = await getChatResponse([
      ...chatHistory,
      systemMessage,
    ]);

    if (botResponseEntry.startsWith("Error:")) {
      addChatMessage(
        new AIMessage(
          "Oops, there was a problem: " +
            botResponseEntry.replace(/^Error:\s*/, "")
        )
      );
    } else {
      addChatMessage(new AIMessage(botResponseEntry));
    }
  } catch (exception) {
    const errorMessage =
      exception instanceof Error ? exception.message : "Unknown error";
    addChatMessage(new AIMessage("Error: " + errorMessage));
  } finally {
    document.dispatchEvent(new CustomEvent("chatResponseEnd"));
  }
}

export function clearChatHistory() {
  chatHistoryList.innerHTML = "";
  chatHistory.length = 1;
  console.log(chatHistory);
}
