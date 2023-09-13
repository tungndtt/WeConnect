import { ReactNode, useState, useEffect } from "react";
import useAppContext from "../../contextes/app-context";
import useProfileContext from "../../contextes/profile-context";
import { ChatBotContext } from "../../contextes/chat-bot-context";
import { addSocketMessageHandler, sendData } from "../../lib/api/socket";
import { retrieveChatMessages, addNewChatMessages } from "./utils";
import { Chat } from "../../types/chat";

export default function ChatBotProvider(props: { children: ReactNode }) {
  const { token, sendRequest } = useAppContext();
  const { profile } = useProfileContext();
  const [chatBot, setChatBot] = useState({
    until: undefined,
    messages: undefined,
    pendingMessages: [],
  } as Chat);

  const getChatBotMessages = (before: boolean) => {
    return new Promise<void>((resolve, reject) => {
      sendRequest("chat_bot", "GET", {
        timestamp: chatBot.until,
        before: before,
      })
        .then((response: any) => {
          setChatBot((_chatBot) => {
            retrieveChatMessages(_chatBot, response);
            return { ..._chatBot };
          });
          resolve();
        })
        .catch(reject);
    });
  };

  const sendChatBotMessage = (userId: number, message: string) => {
    if (token && message) {
      const epoch = +new Date();
      sendData({
        chat_type: "bot",
        message,
        token,
        epoch,
      });
      setChatBot((_chatBot) => {
        _chatBot.pendingMessages.push([epoch, message]);
        return { ..._chatBot };
      });
    }
  };

  useEffect(() => {
    if (token) {
      addSocketMessageHandler("room_chat_message", (data) => {
        setChatBot((_chatBot: Chat) =>
          addNewChatMessages(profile!.id, _chatBot, data)
            ? { ..._chatBot }
            : _chatBot
        );
      });
      setChatBot({
        until: new Date(sessionStorage.get("botchat_timestamp")),
        messages: undefined,
        pendingMessages: [],
      });
    }
    return () => {
      sessionStorage.set("botchat_timestamp", chatBot.until?.toString());
    };
  }, [token]);

  return (
    <ChatBotContext.Provider
      value={{
        chatBot,
        getChatBotMessages,
        sendChatBotMessage,
      }}
    >
      {props.children}
    </ChatBotContext.Provider>
  );
}
