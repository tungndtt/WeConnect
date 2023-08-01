import smtplib
import os
from be.jwt.jwt import generate_token, verify_token
from be.server.http.misc import generate_json_response
from be.server.context import dao


class EmailHandler:
    def __init__(self) -> None:
        mail_host = os.environ.get("MAIL_HOST", "smtp.gmail.com")
        mail_port = int(os.environ.get("MAIL_PORT", 587))
        email = os.environ.get("EMAIL", "weconnect-noreply@gmail.com")
        password = os.environ.get("PASSWORD", "weconnect")
        self._email = email
        self._server = smtplib.SMTP(mail_host, mail_port)
        self._server.ehlo()
        self._server.starttls()
        self._server.login(email, password)

    def send_email(self, recipient, registration_link) -> bool:
        sender = self._email
        receiver = recipient if isinstance(recipient, list) else [recipient]
        content = f"""
        From: {sender}
        To: {receiver}
        Subject: WeConnect - Registration Confirmation
        
        <html>
            <body>
                <h5>Welcome to WeConnect community</h5>
                <p>In order to keep our community from bots, your created account must be associated with a real email</p>
                <p>Please enter this <a href='{registration_link}'>verfication link</a> to confirm your registration</p>
            </body>
        </html>
        """
        try:
            self._server.sendmail(sender, receiver, content)
            return True
        except Exception as error:
            print("[Email] Cannot send the registration confirmation mail: " + error)
            return False


_email_handler = EmailHandler()
_registration_duration = os.environ.get("REGISTRATION_DURATION", 10)
_host = os.environ.get("HOST", "127.0.0.1")
_port = os.environ.get("HTTP_PORT", 2204)


async def handle_registration_confirm(request):
    registration_token = request.match_info.get("registration-token", "")
    is_valid, payload = verify_token(registration_token)
    if is_valid:
        status = dao.register_new_user(**payload)
        return generate_json_response(status, None)
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
    registration_token = generate_token(data, _registration_duration)
    status = _email_handler.send_email(payload["email"], f"{_host}:{_port}/http/register/{registration_token}")
    return generate_json_response(status, None)