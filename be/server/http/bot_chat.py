from aiohttp import web


async def handle_get_bot_chat(request):
    name = request.match_info.get('name', "Anonymous")
    text = "Hello, " + name
    return web.Response(text=text)