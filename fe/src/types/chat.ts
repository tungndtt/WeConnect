import Message from "./message";

export type Chat = {
  until?: Date;
  messages: Message[] | undefined;
  pendingMessages: [number, string][];
};

export type ChatGroup = Chat & {
  name: string;
  ownerId: number;
};

export type ChatRoom = Chat & {
  chatRoomId: number;
};