## Protocol:

1. Register a new account:

- Send confirmation link to email: `POST /register {"email": ..., "password": ..., "first_name": ..., "last_name": ...}`
- Enter the link to create the account: `GET /register/<token>`
- Notify all online users about new users `SOCKET {}`

2. Login:

- Send `POST /login {"email": ..., "password": ...}`
- Receive `{"token": <token>}`
- Send init message `SOCKET {"token": <token>}`
- Get all notifications `GET /notifications {"header": {"authentication": <token>}}`

3. Logout:

- Send `GET /logout {"header": {"authentication": <token>}}`
- Deregister the user id

4. Enter bot-chat:

- Send `GET /chat_bot {"header": {"authentication": <token>}}`
- Return historic messages with bot (limit: 100 recent messages)
- Scrolling-query older messages (limit: 100 older messages) `GET /chat-bot {"header": {"authentication": <token>}, "data": {"until": ...}}`

5. Message with bot:

- Send `SOCKET {"token": <token>, "chat_type": "bot", "message": ...}`
- Receive `SOCKET {"chat_type": "bot", "messages": [ { "is_user": True, "message": ..., "timestamp": ...}, { "is_user": False, "message": ..., "timestamp": ...}]}`

6. Enter human-chat (`room-chat` mode by default):

- Get all user's chat rooms: `GET /chat_rooms {"header": {"authentication": <token>}}`
- Get all online/offline users: `GET /users {"header": {"authentication": <token>}}`

7. Enter chat room:

- Send `GET /chat_rooms/{room-id}`
- Update the read status of notification `PUT /notifications {"header": {"authentication": <token>}, "data": {"chat_room_id": ...}}`

8. Leave chat room:

- Update the read status of notification `PUT /notifications {"header": {"authentication": <token>}, "data": {"chat_room_id": ...}}`

9. Message between users:

- Sender sends `SOCKET {"token": <token>, "chat_type": "room", "other_user_id": ..., "message": ...}`
- Receiver receives `SOCKET {"chat_type": "room", "user_id": ..., "chat_room_id": ..., "message": ..., "timestamp": ...}` -> Update chat-room and notifications

10. Enter group-chat:

- Get all chat groups: `GET /chat_groups`

11. Enter chat group:

- Send `GET /chat_groups/{group-id} {"header": {"authentication": <token>}}`
- Notify all users currently in the chat group

12. Leave chat group:

- Notify all users currently in the chat group

13. Message in chat group:

- Send `SOCKET {"token": <token>, "chat_type": "group", "chat_group_id": ..., "message": ...}`
- Receive `SOCKET {"chat_type": "group", "user_id": ..., "chat_group_id": ..., "message": ..., "timestamp": ...}`

14. Create a chat group:

- Send `POST /chat_groups {"header": {"authentication": <token>}, "data": {"chat_group_name": ..., "author_id": ...}}`

15. Update a chat group:

- Send `PUT /chat_groups {"header": {"authentication": <token>}, "data": {"chat_group_name": ...}}`
