import { ReactNode, useState, useEffect } from "react";
import useAppContext from "../../contextes/app-context";
import useProfileContext from "../../contextes/profile-context";
import {
  ChatRoomContext,
  ChatRoomMap,
} from "../../contextes/chat-room-context";
import { addSocketMessageHandler, sendData } from "../../lib/api/socket";
import { retrieveChatMessages, addNewChatMessages } from "./utils";

export default function ChatRoomProvider(props: { children: ReactNode }) {
  const { token, sendRequest } = useAppContext();
  const { profile } = useProfileContext();
  const [chatRooms, setChatRooms] = useState<ChatRoomMap>({});

  const getChatRoomMessages = (userId: number, before: boolean) => {
    const { chatRoomId, until } = chatRooms[userId];
    return new Promise<void>((resolve, reject) => {
      sendRequest(`chat_rooms/${chatRoomId}`, "GET", {
        timestamp: until,
        before: before,
      })
        .then((response: any) => {
          setChatRooms((_chatRooms) => {
            const _chatRoom = _chatRooms[userId];
            retrieveChatMessages(_chatRoom, response);
            return { ..._chatRooms, [userId]: _chatRoom };
          });
          resolve();
        })
        .catch(reject);
    });
  };

  const sendChatRoomMessage = (userId: number, message: string) => {
    if (token && message) {
      const epoch = +new Date();
      sendData({
        chat_type: "room",
        other_user_id: userId,
        message,
        token,
        epoch,
      });
      setChatRooms((_chatRooms) => {
        const _chatRoom = _chatRooms[userId];
        _chatRoom.pendingMessages.push([epoch, message]);
        return { ..._chatRooms, [userId]: _chatRoom };
      });
    }
  };

  useEffect(() => {
    if (token) {
      addSocketMessageHandler("room_chat_message", (data) => {
        setChatRooms((_chatRooms: ChatRoomMap) => {
          const otherUserId =
            profile!.id === data.user_id ? data.other_user_id : data.user_id;
          let _chatRoom = _chatRooms[otherUserId];
          if (!_chatRoom) {
            _chatRoom = {
              chatRoomId: data.chat_room_id,
              messages: undefined,
              until: undefined,
              pendingMessages: [],
            };
            _chatRooms[otherUserId] = _chatRoom;
          } else if (_chatRoom.chatRoomId === 0) {
            _chatRoom.chatRoomId = data.chat_room_id;
          }
          return addNewChatMessages(profile!.id, _chatRoom, data)
            ? { ..._chatRooms, [otherUserId]: _chatRoom }
            : _chatRooms;
        });
      });
      const roomChatTimestamps = {} as { [chatRoomId: number]: Date };
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i) as string;
        const timestamp = sessionStorage.getItem(key) as string;
        if (key.startsWith("roomchat_timestamp-")) {
          const roomId = Number(key.substring("roomchat_timestamp-".length));
          roomChatTimestamps[roomId] = new Date(timestamp);
        }
      }
      sendRequest("chat_rooms", "GET").then((_chatRooms) => {
        const _chatRoomsMap = {} as ChatRoomMap;
        (_chatRooms as any[]).forEach((_chatRoom: any) => {
          _chatRooms[_chatRoom[1]] = {
            chatRoomId: _chatRoom[0],
            until: roomChatTimestamps[_chatRoom[0]],
            messages: undefined,
            pendingMessages: [],
          };
        });
        setChatRooms(_chatRoomsMap);
      });
    }

    return () => {
      for (let [chatRoomId, chatRoom] of Object.entries(chatRooms)) {
        sessionStorage.set(
          `roomchat_timestamp-${chatRoomId}`,
          chatRoom.until?.toString()
        );
      }
    };
  }, [token]);

  return (
    <ChatRoomContext.Provider
      value={{
        chatRooms,
        getChatRoomMessages,
        sendChatRoomMessage,
      }}
    >
      {props.children}
    </ChatRoomContext.Provider>
  );
}
