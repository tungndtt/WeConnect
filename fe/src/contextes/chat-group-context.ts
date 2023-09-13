import { createContext, useContext } from "react";
import { ChatGroup } from "../types/chat";

export type ChatGroupMap = {
  [chatGroupId: number]: ChatGroup;
}

type ChatGroupState = {
  chatGroups: ChatGroupMap;
  registerChatGroup: (groupName: string) => Promise<void>;
  updateChatGroup: (
    chatGroupId: number,
    newGroupName?: string,
    newOwnerId?: number
  ) => Promise<void>;
  getChatGroupMessages: (chatGroupId: number, before: boolean) => Promise<void>;
  sendChatGroupMessage: (chatGroupId: number, message: string) => void;
};

export const ChatGroupContext = createContext<ChatGroupState>({
  chatGroups: {},
  registerChatGroup: (_groupName: string) => new Promise<void>(() => {}),
  updateChatGroup: (
    _chatGroupId: number,
    _newGroupName?: string,
    _newOwnerId?: number
  ) => new Promise<void>(() => {}),
  getChatGroupMessages: (_chatGroupId: number, _before: boolean) =>
    new Promise<void>(() => {}),
  sendChatGroupMessage: (_chatGroupId: number, _message: string) => {},
});

export default function useChatGroupContext() {
  return useContext(ChatGroupContext);
};