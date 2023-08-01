import openai
import os
import time
from be.server.context import socket_connections, botchat_messages, dao


_message_limit = int(os.environ.get("MESSAGE_LIMIT", 10))
_openai_api_key = os.environ.get("OPENAI_API_KEY")
if _openai_api_key is None:
    print("[Bot Chat] No API key to access ChatGPT api")
    quit()
openai.api_key = _openai_api_key


async def handle_bot_chat(request) -> str:
    user_id = request["user_id"]
    message = request["message"]
    messages = botchat_messages[user_id]
    messages.append({"role": "user", "content": message})
    #TODO: check the insert status
    message_timestamp = dao.register_new_message_with_bot(user_id, True, message)
    if len(messages) > _message_limit:
        messages = messages[2:]
    while True:
        try:
            gpt_response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=200,
            )
            response = gpt_response["choices"][0]["message"]["content"] 
            break
        except:
            time.sleep(4)
    messages.append({"role": "assistant", "content": response})
    #TODO: check the insert status
    response_timestamp = dao.register_new_message_with_bot(user_id, False, response)
    user_connection = socket_connections[user_id]
    await user_connection.send_json({
        "chat_type": "bot", 
        "messages": [
            { "is_user": True, "message": message, "timestamp": message_timestamp},
            { "is_user": False, "message": response, "timestamp": response_timestamp},
        ]
    })
    
    

    