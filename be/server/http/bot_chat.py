from be.server.context import dao
from be.server.http.misc import verify_request, generate_json_response, extract_timestamp_args


@verify_request
async def handle_get_bot_chat(request):
    request_body = await request.json()
    timestamp, before = extract_timestamp_args(request_body)
    bot_chat_messages = dao().get_bot_chat_messages(request.user_id, timestamp, before, 100)
    return generate_json_response(True, bot_chat_messages)