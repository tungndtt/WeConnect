import openai
import os
import time
from be.server.context import dao, get_botchat_messages, unicast_user


__message_limit = int(os.environ.get("MESSAGE_LIMIT", 10))
__openai_api_key = os.environ.get("OPENAI_API_KEY")
if __openai_api_key is None:
    print("[Bot Chat] No API key to access ChatGPT api")
    quit()
openai.api_key = __openai_api_key


async def handle_bot_chat(request) -> None:
    user_id = request["user_id"]
    message = request["message"]
    messages = get_botchat_messages(user_id)
    messages.append({"role": "user", "content": message})
    #TODO: check the insert status
    message_timestamp = dao().register_new_message_with_bot(user_id, True, message)
    if len(messages) > __message_limit:
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
    response_timestamp = dao().register_new_message_with_bot(user_id, False, response)
    message = {
        "type": "bot_chat_message", 
        "messages": [
            { "is_user": True, "message": message, "timestamp": message_timestamp},
            { "is_user": False, "message": response, "timestamp": response_timestamp},
        ]
    }
    await unicast_user(user_id, message)
    
    

    