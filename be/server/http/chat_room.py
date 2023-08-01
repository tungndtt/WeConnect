from datetime import datetime
from be.server.context import dao
from be.server.http.misc import verify_request, generate_json_response


@verify_request
async def handle_get_chat_rooms(request):
    chat_rooms = dao.get_chat_rooms(request.user_id)
    return generate_json_response(True, chat_rooms)


@verify_request
async def handle_get_chat_room(request):
    request_body = await request.json()
    chat_room_id = request.match_info.get("room-id", "")
    if not chat_room_id:
        return generate_json_response(False, "Chat room is not given")
    if "until" not in request_body:
        until = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    else:
        until = request_body["until"]
    room_chat_messages = dao.get_human_chat_messages(True, chat_room_id, until, 100)
    return generate_json_response(True, room_chat_messages)