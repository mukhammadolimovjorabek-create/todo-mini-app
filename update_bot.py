import re
with open("bot.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace synchronous load_users/save_user with async definitions
content = content.replace("def load_users():", "async def load_users():")
content = content.replace("def save_user(user_id: int, user_info: dict):", "async def save_user(user_id: int, user_info: dict):")
content = content.replace("def set_user_status(user_id: int, status: str):", "async def set_user_status(user_id: int, status: str):")

# Add await to calls
content = content.replace("users = load_users()", "users = await load_users()")
content = content.replace("save_user(user_id, user_info)", "await save_user(user_id, user_info)")
content = content.replace("set_user_status(user_id, \"left\")", "await set_user_status(user_id, \"left\")")
content = content.replace("set_user_status(user_id, \"active\")", "await set_user_status(user_id, \"active\")")

with open("bot.py", "w", encoding="utf-8") as f:
    f.write(content)
