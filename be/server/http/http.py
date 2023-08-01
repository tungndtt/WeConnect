from aiohttp import web
from be.server.http.authentication import handle_login, handle_logout
from be.server.http.registration import handle_registration_confirm, handle_register
from be.server.http.user import handle_get_all_users, handle_get_users_in_group, handle_get_user_profile, handle_update_user
from be.server.http.notification import handle_get_notifications, handle_update_notification
from be.server.http.bot_chat import handle_get_bot_chat
from be.server.http.chat_room import handle_get_chat_rooms, handle_get_chat_room
from be.server.http.chat_group import handle_get_chat_groups, handle_get_chat_group, handle_access_chat_group, handle_register_chat_group, handle_update_chat_group_name


http_routes = [
    web.get("/http/login", handle_login),
    web.get("/http/logout", handle_logout),
    web.get("/http/register/{registration-token}", handle_registration_confirm),
    web.post("/http/register", handle_register),
    web.get("/http/users", handle_get_all_users),
    web.get("/http/users/group/{group-id}", handle_get_users_in_group),
    web.get("/http/users/profile", handle_get_user_profile),
    web.put("/http/users/profile", handle_update_user),
    web.get("/http/notifications", handle_get_notifications),
    web.put("/http/notifications", handle_update_notification),
    web.get("/http/chat_bot", handle_get_bot_chat),
    web.get("/http/chat_rooms", handle_get_chat_rooms),
    web.get("/http/chat_rooms/{room-id}", handle_get_chat_room),
    web.get("/http/chat_groups", handle_get_chat_groups),
    web.get("/http/chat_groups/{group-id}", handle_get_chat_group),
    web.post("/http/chat_groups/{group-id}", handle_access_chat_group),
    web.post("/http/chat_groups", handle_register_chat_group),
    web.put("/http/chat_groups", handle_update_chat_group_name),
]