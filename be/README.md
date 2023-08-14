## Protocol:

Socket is mounted under `/socket` and Http is mounted under `/http`

### Register a new account:

- Send confirmation link to email `POST /register {"email": str, "password": str, "first_name": str, "last_name": str}`
- Enter the link to create the account `GET /register/<registration-token>`
- Notify all online users `SOCKET {"type": "user_update", "user_id": number, "first_name": str, "last_name": str}`

### Login:

- Send login request `POST /login {"email": str, "password": str}`
- Receive access token `{"token": <token>}`
- Send init request `SOCKET {"token": <token>}`
- Get user profile `GET /users/profile {"header": {"authentication": <token>}}`
- Get all notifications `GET /notifications {"header": {"authentication": <token>}}`
- Get all access requests `GET /users/access_requests {"header": {"authentication": <token>}}`
- Get all users `GET /users {"header": {"authentication": <token>}}`
- Get all chat groups: `GET /chat_groups {"header": {"authentication": <token>}}`
- Notify all online users `SOCKET {"type": "user_activity", "user_id": number, "login": True}`

### Logout:

- Send logout request `GET /logout {"header": {"authentication": <token>}}`
- Notify all online users `SOCKET {"type": "user_activity", "user_id": number, "login": False}`

### Bot-chat:

1. Fetch messages:

- If botchat messages weren't fetched, send init request `GET /chat_bot {"header": {"authentication": <token>}, "data": {"timestamp": sessionStorage.get("bot")}}`
- Scrolling-query older messages (limit: 100 older messages) `GET /chat_bot {"header": {"authentication": <token>}, "data": {"timestamp": date-str, "before": True}}`

2. Message:

- Send user message `SOCKET {"token": <token>, "chat_type": "bot", "message": str, "epoch": int}`
- Receive bot response `SOCKET {"type": "bot_chat_message", "epoch": int, "message": [ { "user_id": int, "messages": str, "timestamp": date-str}, { "user_id": 0, "message": str, "timestamp": date-str}]}`

### Human-chat:

#### Chat room:

1. Fetch messages:

- Send init request `GET /chat_rooms/{room-id} {"header": {"authentication": <token>}, "data": {"timestamp": seesionStorage.get("room-{room-id}")}}`
- Scrolling-query older messages (limit: 100 older messages) `GET /chat_rooms/{room-id} {"header": {"authentication": <token>}, "data": {"timestamp": date-str, "before": True}}`

2. Message:

- Send message `SOCKET {"token": <token>, "chat_type": "room", "other_user_id": int, "message": str, "epoch": int}`
- Notify other user `SOCKET {"type": "room_chat_message", "user_id": int, "other_user_id": int, "chat_room_id": int, "message": str, "epoch": int, "timestamp": date-str}`

#### Chat group:

1. Fetch messages:

- Send init request `GET /chat_groups/{group-id} {"header": {"authentication": <token>}, "data": {"timestamp": seesionStorage.get("group-{group-id}")}}`
- Scrolling-query older messages (limit: 100 older messages) `GET /chat_groups/{group-id} {"header": {"authentication": <token>}, "data": {"timestamp": date-str, "before": True}}`

2. Message:

- Send message `SOCKET {"token": <token>, "chat_type": "group", "chat_group_id": int, "message": str, "epoch": int}`
- Notify all users in the chat group `SOCKET {"type": "group_chat_message", "user_id": int, "chat_group_id": int, "message": str, "epoch": int, "timestamp": date-str}`

**Note:** Update the chat notification `PUT /notifications {"header": {"authentication": <token>}, "data": {"chat_id": int, "is_room": True}}` on entering/leaving in human-chat

### Chat group actions:

1. Create chat group:

- Send create request `POST /chat_groups {"header": {"authentication": <token>}, "data": {"name": str}}`
- Notify all online users `SOCKET {"type": "group_chat_update", "chat_group_id": number, "name": str, "owner_id": number}`

2. Update chat group:

- Send update request `PUT /chat_groups {"header": {"authentication": <token>}, "data": {"name": int}}`
- Notify all online users `SOCKET {"type": "group_chat_update", "chat_group_id": number, "name": str, "owner_id": number}`

3. Request to access chat group:

- Send register request `POST /chat_groups/access_requests/{group-id} {"header": {"authentication": <token>}}`

4. Inspect access requests:

- Send request `GET /chat_groups/access_requests/{group-id} {"header": {"authentication": <token>}}`

5. Review access request:

- Send request `PUT /chat_groups/access_requests/{group-id} {"header": {"authentication": <token>}, "data": {"requester_id": int, "access": bool}}`

### User actions:

1. Update profile:

- Get user private information `PUT /users/profile {"header": {"authentication": <token>}, "data": {"first_name": Optional[str], "last_name": Optional[str], "password": Optional[str]}}`
- Notify all online users `SOCKET {"type": "user_update", "user_id": number, "first_name": str, "last_name": str}`
