import sys

with open("bot.py", "r", encoding="utf-8") as f:
    content = f.read()

api_code = """
async def api_get_friends(request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id required"}, status=400)
    
    users = await load_users()
    friends = []
    for uid, udata in users.items():
        if str(udata.get("referred_by")) == str(user_id):
            friends.append({
                "id": str(uid),
                "name": udata.get("first_name", "Foydalanuvchi"),
                "avatar": udata.get("first_name", "U")[0].upper() if udata.get("first_name") else "U",
                "points": 15,
                "streak": 1,
                "joinedAt": str(udata.get("joined_at", ""))[:10]
            })
    
    resp = web.json_response({"friends": friends})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp
"""

# Insert API code before on_startup
content = content.replace("async def on_startup(bot: Bot):", api_code + "\nasync def on_startup(bot: Bot):")

# Modify main()
old_main = """def main():
    logging.basicConfig(level=logging.INFO)
    dp.startup.register(on_startup)
    
    if WEBHOOK_URL:
        # Webhook mode for cloud (Render, Railway, etc.)
        app = web.Application()
        webhook_requests_handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
        webhook_requests_handler.register(app, path="/webhook")
        setup_application(app, dp, bot=bot)
        web.run_app(app, host="0.0.0.0", port=PORT)
    else:
        # Long-polling mode for local testing
        asyncio.run(dp.start_polling(bot, allowed_updates=["message", "chat_member", "my_chat_member", "callback_query"]))"""

new_main = """async def start_bot():
    await on_startup(bot)
    if not WEBHOOK_URL:
        await dp.start_polling(bot, allowed_updates=["message", "chat_member", "my_chat_member", "callback_query"])

def main():
    logging.basicConfig(level=logging.INFO)
    
    app = web.Application()
    app.router.add_get("/api/friends", api_get_friends)
    
    if WEBHOOK_URL:
        dp.startup.register(on_startup)
        webhook_requests_handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
        webhook_requests_handler.register(app, path="/webhook")
        setup_application(app, dp, bot=bot)
        web.run_app(app, host="0.0.0.0", port=PORT)
    else:
        import threading
        def run_polling():
            asyncio.run(start_bot())
            
        t = threading.Thread(target=run_polling, daemon=True)
        t.start()
        
        logging.info("Starting local API server on port 8000...")
        web.run_app(app, host="0.0.0.0", port=8000)"""

content = content.replace(old_main, new_main)

with open("bot.py", "w", encoding="utf-8") as f:
    f.write(content)
