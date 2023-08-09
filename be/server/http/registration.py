import os
from be.server.http.misc import generate_json_response
from be.server.context import dao, jwt, broadcast_all_users
from be.email.email import EmailHandler


__email_handler = EmailHandler()
__registration_duration = os.environ.get("REGISTRATION_DURATION", 10)
__host = os.environ.get("HOST", "127.0.0.1")
__port = os.environ.get("HTTP_PORT", 2204)


async def handle_registration_confirm(request):
    registration_token = request.match_info.get("registration-token", "")
    is_valid, payload = jwt().verify_token(registration_token)
    if is_valid:
        new_user_id = dao().register_new_user(**payload)
        await broadcast_all_users({
            "type": "user_update", "user_id": new_user_id,
            "first_name": payload["first_name"], "last_name": payload["last_name"], 
        })
        return generate_json_response(True, None)
    elif payload is not None:
        return generate_json_response(False, "Link is already expired")
    else:
        return generate_json_response(False, "Invalid registration token")


async def handle_register(request):
    payload = await request.json()
    data = {}
    for field in ["email", "password", "first_name", "last_name"]:
        if field in payload:
            data[field] = payload[field]
        else:
            return generate_json_response(False, f"'{field}' cannot be empty")
    email = payload["email"]
    if dao().check_user_existence(email):
        return generate_json_response(False, f"There is already account associated with given email '{email}'")
    registration_token = jwt().generate_token(data, __registration_duration)
    subject = "WeConnect - Registration Confirmation"
    content = f"""
    <html>
        <body>
            <h5>Welcome to WeConnect community</h5>
            <p>In order to keep our community from bots, your created account must be associated with a real email</p>
            <p>Please enter this <a href='{__host}:{__port}/http/register/{registration_token}'>verfication link</a> to confirm your registration</p>
        </body>
    </html>
    """
    status = __email_handler.send_email(email, subject, content)
    return generate_json_response(status, None)