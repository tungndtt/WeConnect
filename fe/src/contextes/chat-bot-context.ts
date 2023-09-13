import { createContext, useContext } from "react";
import { Chat } from "../types/chat";

type ChatBotState = {
  chatBot: Chat;
  getChatBotMessages: (before: boolean) => Promise<void>;
  sendChatBotMessage: (userId: number, message: string) => void;
};

export const ChatBotContext = createContext<ChatBotState>({
  chatBot: {
    until: undefined,
    messages: undefined,
    pendingMessages: [] as [number, string][],
  },
  getChatBotMessages: (_before: boolean) => new Promise<void>(() => {}),
  sendChatBotMessage: (_userId: number, _message: string) => {},
});

export default function useChatBotContext() {
  return useContext(ChatBotContext);
};