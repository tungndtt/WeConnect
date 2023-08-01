## Protocol:

Socket is mounted under `/socket` and Http is mounted under `/http`

1. Register a new account:

- Send confirmation link to email `POST /register {"email": str, "password": str, "first_name": str, "last_name": str}`
- Enter the link to create the account `GET /register/<registration-token>`

2. Login:

- Send login request `POST /login {"email": str, "password": str}`
- Receive access token `{"token": <token>}`
- Send init message `SOCKET {"token": <token>}`
- Get all notifications `GET /notifications {"header": {"authentication": <token>}}`

3. Logout:

- Send logout request `GET /logout {"header": {"authentication": <token>}}`
- Deregister the user id

4. Enter bot-chat:

- Get botchat messages `GET /chat_bot {"header": {"authentication": <token>}}`
- Return historic messages with bot (limit: 100 recent messages) `GET /chat-bot {"header": {"authentication": <token>}, "data": {}}`
- Scrolling-query older messages (limit: 100 older messages) `GET /chat-bot {"header": {"authentication": <token>}, "data": {"until": date-str}}`

5. Message with bot:

- Send `SOCKET {"token": <token>, "chat_type": "bot", "message": str}`
- Receive `SOCKET {"chat_type": "bot", "messages": [ { "is_user": True, "message": str, "timestamp": date-str}, { "is_user": False, "message": str, "timestamp": date-str}]}`

6. Enter `human-chat` (`room-chat` mode by default):

- Get all user's chat rooms: `GET /chat_rooms {"header": {"authentication": <token>}}`
- Get all online/offline users: `GET /users {"header": {"authentication": <token>}}`

7. Enter chat room:

- Send `GET /chat_rooms/{room-id} {"header": {"authentication": <token>}}`
- Update the read status of notification `PUT /notifications {"header": {"authentication": <token>}, "data": {"chat_room_id": int}}`

8. Leave chat room:

- Update the read status of notification `PUT /notifications {"header": {"authentication": <token>}, "data": {"chat_room_id": int}}`

9. Message between users:

- Sender sends `SOCKET {"token": <token>, "chat_type": "room", "other_user_id": int, "message": str}`
- Receiver receives `SOCKET {"chat_type": "room", "user_id": int, "chat_room_id": int, "message": str, "timestamp": date-str}`

10. Enter `group-chat` mode:

- Get all chat groups: `GET /chat_groups {"header": {"authentication": <token>}}`

11. Enter chat group:

- Get group chat messages `GET /chat_groups/{group-id} {"header": {"authentication": <token>}}`
- Notify all users currently in the chat group `SOCKET {"chat_type": "group", "message": str}`
- Get all group member general information `GET /users/group/{group-id} {"header": {"authentication": <token>}}`

12. Leave chat group:

- Notify all users currently in the chat group `SOCKET {"chat_type": "group", "message": str}`

13. Message in chat group:

- Send message to group `SOCKET {"token": <token>, "chat_type": "group", "chat_group_id": int, "message": str}`
- Notify all users currently in the chat group `SOCKET {"chat_type": "group", "user_id": int, "chat_group_id": int, "message": str, "timestamp": date-str}`

14. Create a chat group:

- Send create request `POST /chat_groups {"header": {"authentication": <token>}, "data": {"chat_group_name": str, "author_id": int}}`

15. Update a chat group:

- Send update request `PUT /chat_groups {"header": {"authentication": <token>}, "data": {"chat_group_name": int}}`

16. Inspect profile:

- Get user private information `GET /users/profile {"header": {"authentication": <token>}}`

17. Update profile:

- Get user private information `PUT /users/profile {"header": {"authentication": <token>}, "data": {"first_name": Optional[str], "last_name": Optional[str], "password": Optional[str]}}`
