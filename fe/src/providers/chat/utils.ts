import { Chat } from "../../types/chat";

export const retrieveChatMessages = (chat: Chat, messages: any[]) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const [_, user_id, message, timestamp] = messages[i];
    chat.messages!.unshift({
      userId: user_id,
      message: message,
      timestamp: new Date(timestamp),
    });
  }
};

export const addNewChatMessages = (profileId: number, chat: Chat, data: any) => {
  const messageEpoch = data["epoch"];
  const messages = "messages" in data ? data["messages"] : [data];
  let isModified = false;
  if (profileId === messages[0]["user_id"]) {
    const index = chat.pendingMessages.findIndex(
      ([pendingEpoch, _]) => pendingEpoch === messageEpoch
    );
    if (index !== -1) {
      chat.pendingMessages.splice(index, 1);
      isModified = true;
    }
  }
  if (!chat.until) {
    chat.messages = [];
    chat.until = new Date(messages[0]["timestamp"]);
    isModified = true;
  }
  for (let { user_id, message, timestamp } of messages) {
    if (message) {
      chat.messages!.push({
        userId: user_id,
        message: message,
        timestamp: new Date(timestamp),
      });
      isModified = true;
    }
  }
  return isModified;
};