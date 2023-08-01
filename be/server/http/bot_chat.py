from be.server.context import dao
from be.server.http.misc import verify_request, generate_json_response


@verify_request
async def handle_get_bot_chat(request):
    bot_chat_messages = dao.get_bot_chat_messages(request.user_id)
    return generate_json_response(True, bot_chat_messages)