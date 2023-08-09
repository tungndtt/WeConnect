from be.server.context import jwt


def verify_request(request) -> None:
    token = request["token"]
    is_valid, payload = jwt().verify_token(token)
    if not is_valid:
        raise Exception("Invalid/expired token")
    request["user_id"] = payload["user_id"]


def check_request_parameters(request, *parameters) -> bool:
    for parameter in parameters:
        if parameter not in request:
            return False
    return True