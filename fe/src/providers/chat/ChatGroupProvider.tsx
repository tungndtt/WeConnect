import { ReactNode, useState, useEffect } from "react";
import useAppContext from "../../contextes/app-context";
import useProfileContext from "../../contextes/profile-context";
import {
  ChatGroupContext,
  ChatGroupMap,
} from "../../contextes/chat-group-context";
import { addSocketMessageHandler, sendData } from "../../lib/api/socket";
import { retrieveChatMessages, addNewChatMessages } from "./utils";

export default function ChatGroupProvider(props: { children: ReactNode }) {
  const { token, sendRequest } = useAppContext();
  const { profile } = useProfileContext();
  const [chatGroups, setChatGroups] = useState<ChatGroupMap>({});

  const registerChatGroup = (groupName: string) => {
    return sendRequest("chat_groups", "POST", { name: groupName });
  };

  const updateChatGroup = (
    chatGroupId: number,
    newGroupName?: string,
    newOwnerId?: number
  ) => {
    return sendRequest(`chat_groups/${chatGroupId}`, "PUT", {
      name: newGroupName,
      owner_id: newOwnerId,
    });
  };

  const getChatGroupMessages = (chatGroupId: number, before: boolean) => {
    return new Promise<void>((resolve, reject) => {
      sendRequest(`chat_groups/${chatGroupId}`, "GET", {
        timestamp: chatGroups[chatGroupId].until,
        before: before,
      })
        .then((response: any) => {
          setChatGroups((_chatGroups) => {
            const _chatGroup = _chatGroups[chatGroupId];
            retrieveChatMessages(_chatGroup, response);
            return { ...chatGroups, [chatGroupId]: _chatGroup };
          });
          resolve();
        })
        .catch(reject);
    });
  };

  const sendChatGroupMessage = (chatGroupId: number, message: string) => {
    if (token && message) {
      const epoch = +new Date();
      sendData({
        chat_type: "group",
        message,
        token,
        epoch,
      });
      setChatGroups((_chatGroups) => {
        const _chatGroup = _chatGroups[chatGroupId];
        _chatGroup.pendingMessages.push([epoch, message]);
        return { ..._chatGroups, [chatGroupId]: _chatGroup };
      });
    }
  };

  useEffect(() => {
    if (token) {
      const groupChatTimestamps = {} as { [chatGroupId: number]: Date };
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i) as string;
        const timestamp = sessionStorage.getItem(key) as string;
        if (key.startsWith("groupchat_timestamp-")) {
          const groupId = Number(key.substring("groupchat_timestamp-".length));
          groupChatTimestamps[groupId] = new Date(timestamp);
        }
      }
      addSocketMessageHandler("group_chat_update", (data) => {
        const { chat_group_id, name, owner_id } = data;
        setChatGroups((_chatGroups: ChatGroupMap) => ({
          ..._chatGroups,
          [chat_group_id]: {
            ..._chatGroups[chat_group_id],
            ownerId: owner_id,
            name: name,
          },
        }));
      });
      addSocketMessageHandler("unregister_access_request", (data) => {
        delete chatGroups[data.chat_group_id];
        setChatGroups({ ...chatGroups });
      });
      addSocketMessageHandler("group_chat_message", (data) => {
        setChatGroups((_chatGroups: ChatGroupMap) => {
          const _chatGroup = _chatGroups[data.chat_group_id];
          return addNewChatMessages(profile!.id, _chatGroup, data)
            ? { ..._chatGroups }
            : _chatGroups;
        });
      });
      sendRequest("chat_groups", "GET").then((_chatGroups) => {
        const _chatGroupsMap = {} as ChatGroupMap;
        (_chatGroups as any[]).forEach((_chatGroup: any) => {
          _chatGroupsMap[_chatGroup[0]] = {
            name: _chatGroup[1],
            ownerId: _chatGroup[2],
            until: groupChatTimestamps[_chatGroup[0]],
            messages: undefined,
            pendingMessages: [],
          };
        });
        setChatGroups(_chatGroupsMap);
      });
    }

    return () => {
      for (let [chatGroupId, chatGroup] of Object.entries(chatGroups)) {
        sessionStorage.set(
          `groupchat_timestamp-${chatGroupId}`,
          chatGroup.until?.toString()
        );
      }
    };
  }, [token]);

  return (
    <ChatGroupContext.Provider
      value={{
        chatGroups,
        registerChatGroup,
        updateChatGroup,
        getChatGroupMessages,
        sendChatGroupMessage,
      }}
    >
      {props.children}
    </ChatGroupContext.Provider>
  );
}
