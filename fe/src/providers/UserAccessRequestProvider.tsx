import { ReactNode, useState, useEffect } from "react";
import useAppContext from "../contextes/app-context";
import { UserAccessRequestContext } from "../contextes/user-access-request-context";
import { addSocketMessageHandler } from "../lib/api/socket";
import UserAccessRequest from "../types/user-access-request";

export default function UserAccessRequestProvider(props: {
  children: ReactNode;
}) {
  const { token, sendRequest } = useAppContext();
  const [userAccessRequests, setUserAccessRequests] = useState<
    UserAccessRequest[]
  >([]);

  const registerChatGroupAccessRequest = (chatGroupId: number) => {
    return new Promise<void>((resolve, reject) =>
      sendRequest(`chat_groups/access_requests/${chatGroupId}`, "POST")
        .then((response: any) => {
          setUserAccessRequests((_userAccessRequests) => [
            ..._userAccessRequests,
            {
              chatGroupId: chatGroupId,
              timestamp: new Date(response),
            },
          ]);
          resolve();
        })
        .catch(reject)
    );
  };

  const reviewChatGroupAccessRequest = (
    chatGroupId: number,
    requesterId: number,
    access: boolean
  ) => {
    return sendRequest(`chat_groups/access_requests/${chatGroupId}`, "PUT", {
      requester_id: requesterId,
      access: access,
    });
  };

  const ungregisterChatGroupAccessRequest = (
    chatGroupId: number,
    userId: number
  ) => {
    return sendRequest(`chat_groups/access_requests/${chatGroupId}`, "DELETE", {
      user_id: userId,
    });
  };

  useEffect(() => {
    if (token) {
      addSocketMessageHandler("unregister_access_request", (data) => {
        if (data.is_leave) {
          setUserAccessRequests((_userAccessRequests: UserAccessRequest[]) => {
            const index = _userAccessRequests!.findIndex(
              (_userAccessRequest: UserAccessRequest) =>
                !_userAccessRequest.chatGroupId === data.chat_group_id
            );
            _userAccessRequests!.splice(index, 1);
            return [..._userAccessRequests];
          });
        }
      });
      sendRequest("users/access_requests", "GET").then((_UserAcessRequests) => {
        setUserAccessRequests(
          (_UserAcessRequests as any[]).map((_UserAcessRequest: any) => ({
            chatGroupId: _UserAcessRequest[0],
            timestamp: _UserAcessRequest[1],
          }))
        );
      });
    }
  }, [token]);

  return (
    <UserAccessRequestContext.Provider
      value={{
        userAccessRequests,
        registerChatGroupAccessRequest,
        ungregisterChatGroupAccessRequest,
        reviewChatGroupAccessRequest,
      }}
    >
      {props.children}
    </UserAccessRequestContext.Provider>
  );
}
