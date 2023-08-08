## Protocol:

Socket is mounted under `/socket` and Http is mounted under `/http`

1. Register a new account:

- Send confirmation link to email `POST /register {"email": str, "password": str, "first_name": str, "last_name": str}`
- Enter the link to create the account `GET /register/<registration-token>`
- Notify other users `SOCKET {"type": "user_activity", "message": str, "action": 2}`

2. Login:

- Send login request `POST /login {"email": str, "password": str}`
- Receive access token `{"token": <token>}`
- Send init request `SOCKET {"token": <token>}`
- Get all notifications `GET /notifications {"header": {"authentication": <token>}}`
- Get all users `GET /users {"header": {"authentication": <token>}}`
- Notify other users `SOCKET {"type": "user_activity", "message": str, "action": 0}`

3. Logout:

- Send logout request `GET /logout {"header": {"authentication": <token>}}`
- Notify other users `SOCKET {"type": "user_activity", "message": str, "action": 1}`

4. Enter bot-chat:

- If botchat messages weren't fetched, send init request `GET /chat_bot {"header": {"authentication": <token>}, "data": {"timestamp": sessionStorage.get("bot")}}`
- Scrolling-query older messages (limit: 100 older messages) `GET /chat_bot {"header": {"authentication": <token>}, "data": {"timestamp": date-str, "before": True}}`

5. Message with bot:

- Send user message `SOCKET {"token": <token>, "chat_type": "bot", "message": str}`
- Receive bot response `SOCKET {"type": "bot_chat_message", "messages": [ { "is_user": True, "message": str, "timestamp": date-str}, { "is_user": False, "message": str, "timestamp": date-str}]}`

6. Enter `human-chat` (`room-chat` mode by default):

- Get all user's chat rooms: `GET /chat_rooms {"header": {"authentication": <token>}}`
- Get all online/offline users: `GET /users {"header": {"authentication": <token>}}`

7. Enter chat room:

- If chat room messages weren't fetched, send init request `GET /chat_rooms/{room-id} {"header": {"authentication": <token>}, "data": {"timestamp": seesionStorage.get("room-{room-id}")}}`
- Update the read status of notification `PUT /notifications {"header": {"authentication": <token>}, "data": {"chat_room_id": int}}`
- Scrolling-query older messages (limit: 100 older messages) `GET /chat_rooms/{room-id} {"header": {"authentication": <token>}, "data": {"timestamp": date-str, "before": True}}`

8. Leave chat room:

- Update the read status of notification `PUT /notifications {"header": {"authentication": <token>}, "data": {"chat_room_id": int}}`

9. Message between users:

- Sender sends `SOCKET {"token": <token>, "chat_type": "room", "other_user_id": int, "message": str}`
- Receiver receives `SOCKET {"type": "room_chat_message", "user_id": int, "chat_room_id": int, "message": str, "timestamp": date-str}`

10. Enter `group-chat` mode:

- Get all chat groups: `GET /chat_groups {"header": {"authentication": <token>}}`

11. Enter chat group:

- If group chat messages weren't fetched, send init request `GET /chat_groups/{group-id} {"header": {"authentication": <token>}, "data": {"timestamp": seesionStorage.get("group-{group-id}")}}`. Otherwise, fetch messages since last visited timestamp `GET /chat_groups/{group-id} {"header": {"authentication": <token>}, "data": {"timestamp": <last-visit-timestamp>}}`
- Send group-entering request `POST /chat_groups/{group-id} {"header": {"authentication": <token>}, "data": {"is_enter": True}}`
- Notify all users currently in the chat group `SOCKET {"type": "group_chat_activitity", "message": str}`
- Get all group member general information `GET /users/group/{group-id} {"header": {"authentication": <token>}}`
- Scrolling-query older messages (limit: 100 older messages) `GET /chat_groups/{group-id} {"header": {"authentication": <token>}, "data": {"timestamp": date-str, "before": True}}`

12. Leave chat group:

- Send group-leaving request `POST /chat_groups/{group-id} {"header": {"authentication": <token>}, "data": {"is_enter": False}}`
- Notify all users currently in the chat group `SOCKET {"type": "group_chat_activitity", "message": str}`

13. Message in chat group:

- Send message to group `SOCKET {"token": <token>, "chat_type": "group", "chat_group_id": int, "message": str}`
- Notify all users currently in the chat group `SOCKET {"type": "group_chat_message", "user_id": int, "chat_group_id": int, "message": str, "timestamp": date-str}`

14. Create a chat group:

- Send create request `POST /chat_groups {"header": {"authentication": <token>}, "data": {"chat_group_name": str, "author_id": int}}`

15. Update a chat group:

- Send update request `PUT /chat_groups {"header": {"authentication": <token>}, "data": {"chat_group_name": int}}`

16. Inspect profile:

- Get user private information `GET /users/profile {"header": {"authentication": <token>}}`

17. Update profile:

- Get user private information `PUT /users/profile {"header": {"authentication": <token>}, "data": {"first_name": Optional[str], "last_name": Optional[str], "password": Optional[str]}}`
