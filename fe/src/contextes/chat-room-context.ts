import { createContext, useContext } from "react";
import { ChatRoom } from "../types/chat";

export type ChatRoomMap = {
  [userId: number]: ChatRoom;
}

type ChatRoomState = {
  chatRooms: ChatRoomMap;
  getChatRoomMessages: (userId: number, before: boolean) => Promise<void>;
  sendChatRoomMessage: (userId: number, message: string) => void;
};

export const ChatRoomContext = createContext<ChatRoomState>({
  chatRooms: {},
  getChatRoomMessages: (_userId: number, _before: boolean) =>
    new Promise<void>(() => {}),
  sendChatRoomMessage: (_userId: number, _message: string) => {},
});

export default function useChatRoomContext() {
  return useContext(ChatRoomContext);
};