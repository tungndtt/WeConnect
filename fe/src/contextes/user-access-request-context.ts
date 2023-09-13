import { createContext, useContext } from "react";
import UserAccessRequest from "../types/user-access-request";

type UserAccessRequestState = {
  userAccessRequests: UserAccessRequest[];
  registerChatGroupAccessRequest: (chatGroupId: number) => Promise<void>;
  reviewChatGroupAccessRequest: (
    chatGroupId: number,
    requesterId: number,
    acess: boolean
  ) => Promise<void>;
  ungregisterChatGroupAccessRequest: (
    chatGroupId: number,
    userId: number
  ) => Promise<void>;
};

export const UserAccessRequestContext = createContext<UserAccessRequestState>({
  userAccessRequests: [],
  registerChatGroupAccessRequest: (_chatGroupId: number) =>
    new Promise<void>(() => {}),
  reviewChatGroupAccessRequest: (
    _chatGroupId: number,
    _requesterId: number,
    _access: boolean
  ) => new Promise<void>(() => {}),
  ungregisterChatGroupAccessRequest: (_chatGroupId: number, _userId: number) =>
    new Promise<void>(() => {}),
});

export default function useUserAccessRequestContext() {
  return useContext(UserAccessRequestContext);
};